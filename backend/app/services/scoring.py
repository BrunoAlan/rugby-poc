"""Scoring calculation service."""

from sqlalchemy.orm import Session

from collections import Counter

from app.constants import DEFAULT_SCORING_WEIGHTS, STAT_FIELDS
from app.models import PlayerMatchStats, ScoringConfiguration, ScoringWeight

# Scoring configuration constants
# STANDARD_MATCH_DURATION = 80  # Standard rugby match duration in minutes
STANDARD_MATCH_DURATION = 70  # Match duration for current use case
MIN_MINUTES_FOR_RANKING = 20  # Minimum minutes played to appear in rankings
MIN_MINUTES_FOR_NORMALIZATION = 40  # Floor for normalization to prevent inflated scores


class ScoringService:
    """Service for calculating player scores."""

    def __init__(self, db: Session):
        self.db = db

    def seed_default_weights(self, *, force: bool = False) -> ScoringConfiguration:
        """Create default scoring configuration with predefined weights.

        Args:
            force: If True, delete existing 'default' config and re-seed.
        """
        existing = (
            self.db.query(ScoringConfiguration)
            .filter(ScoringConfiguration.name == "default")
            .first()
        )
        if existing:
            if not force:
                return existing
            # Nullify FK references from player_match_stats before deleting
            self.db.query(PlayerMatchStats).filter(
                PlayerMatchStats.scoring_config_id == existing.id
            ).update({PlayerMatchStats.scoring_config_id: None})
            self.db.delete(existing)
            self.db.flush()

        config = ScoringConfiguration(
            name="default",
            description="Default scoring weights per position (1-15)",
            is_active=True,
        )
        self.db.add(config)
        self.db.flush()

        for action_name, weights_by_pos in DEFAULT_SCORING_WEIGHTS.items():
            for position, weight_value in weights_by_pos.items():
                weight = ScoringWeight(
                    config_id=config.id,
                    action_name=action_name,
                    position=position,
                    weight=weight_value,
                )
                self.db.add(weight)

        self.db.commit()
        return config

    def get_active_config(self) -> ScoringConfiguration | None:
        """Get the currently active scoring configuration."""
        return (
            self.db.query(ScoringConfiguration)
            .filter(ScoringConfiguration.is_active == True)  # noqa: E712
            .first()
        )

    def calculate_score(
        self, stats: PlayerMatchStats, config: ScoringConfiguration | None = None
    ) -> tuple[float, float]:
        """
        Calculate score for a player's match statistics.

        Args:
            stats: Player match statistics
            config: Scoring configuration to use (defaults to active config)

        Returns:
            Tuple of (score_absoluto, puntuacion_final)
        """
        if config is None:
            config = self.get_active_config()

        if config is None:
            raise ValueError("No active scoring configuration found")

        # Build weights dictionary: {action_name: {position: weight}}
        weights: dict[str, dict[int, float]] = {}
        for w in config.weights:
            weights.setdefault(w.action_name, {})[w.position] = w.weight

        position = stats.puesto

        # Calculate absolute score
        score_absoluto = 0.0

        for field in STAT_FIELDS:
            stat_value = getattr(stats, field, 0) or 0
            action_weights = weights.get(field, {})
            w = action_weights.get(position, 0.0)
            score_absoluto += stat_value * w

        # Normalize to standard match duration with floor
        tiempo_juego = stats.tiempo_juego or STANDARD_MATCH_DURATION
        tiempo_for_calc = max(tiempo_juego, MIN_MINUTES_FOR_NORMALIZATION)
        if tiempo_for_calc > 0:
            puntuacion_final = (
                score_absoluto / tiempo_for_calc
            ) * STANDARD_MATCH_DURATION
        else:
            puntuacion_final = 0.0

        return score_absoluto, puntuacion_final

    def recalculate_all_scores(self, config: ScoringConfiguration | None = None) -> int:
        """
        Recalculate scores for all player match statistics.

        Args:
            config: Scoring configuration to use (defaults to active config)

        Returns:
            Number of records updated
        """
        if config is None:
            config = self.get_active_config()

        if config is None:
            raise ValueError("No active scoring configuration found")

        # Get all player stats
        all_stats = self.db.query(PlayerMatchStats).all()

        count = 0
        for stats in all_stats:
            score_absoluto, puntuacion_final = self.calculate_score(stats, config)
            stats.score_absoluto = score_absoluto
            stats.puntuacion_final = puntuacion_final
            stats.scoring_config_id = config.id
            count += 1

        self.db.commit()
        return count

    def get_rankings(
        self,
        match_id: int | None = None,
        opponent: str | None = None,
        team: str | None = None,
        position_type: str | None = None,
        limit: int = 20,
        min_minutes: int | None = None,
    ) -> list[dict]:
        """Get player rankings by puntuacion_final."""
        if match_id:
            return self._get_match_rankings(
                match_id, team, position_type, limit, min_minutes
            )
        return self._get_aggregated_rankings(
            opponent, team, position_type, limit, min_minutes
        )

    def _get_match_rankings(
        self,
        match_id: int,
        team: str | None,
        position_type: str | None,
        limit: int,
        min_minutes: int | None,
    ) -> list[dict]:
        """Get rankings for a specific match."""
        from app.models import Match

        query = self.db.query(PlayerMatchStats).filter(
            PlayerMatchStats.puntuacion_final.isnot(None),
            PlayerMatchStats.match_id == match_id,
        )

        if team:
            query = query.join(Match, PlayerMatchStats.match_id == Match.id).filter(
                Match.team == team
            )
        if min_minutes is not None:
            query = query.filter(PlayerMatchStats.tiempo_juego >= min_minutes)

        query = self._apply_position_filter(query, position_type)

        results = (
            query.order_by(PlayerMatchStats.puntuacion_final.desc()).limit(limit).all()
        )

        return [
            {
                "rank": rank,
                "player_name": stats.player.name,
                "opponent": stats.match.opponent_name,
                "puesto": stats.puesto,
                "tiempo_juego": stats.tiempo_juego,
                "score_absoluto": round(stats.score_absoluto, 2),
                "puntuacion_final": round(stats.puntuacion_final, 2),
            }
            for rank, stats in enumerate(results, 1)
        ]

    def _get_aggregated_rankings(
        self,
        opponent: str | None,
        team: str | None,
        position_type: str | None,
        limit: int,
        min_minutes: int | None,
    ) -> list[dict]:
        """Get aggregated rankings across all matches."""
        from sqlalchemy import func

        from app.models import Match, Player

        effective_min_minutes = (
            min_minutes if min_minutes is not None else MIN_MINUTES_FOR_RANKING
        )

        query = (
            self.db.query(
                Player.name.label("player_name"),
                func.avg(PlayerMatchStats.puntuacion_final).label("avg_score"),
                func.count(PlayerMatchStats.id).label("matches_played"),
                func.sum(PlayerMatchStats.tiempo_juego).label("total_minutes"),
            )
            .join(PlayerMatchStats, Player.id == PlayerMatchStats.player_id)
            .filter(
                PlayerMatchStats.puntuacion_final.isnot(None),
                PlayerMatchStats.tiempo_juego >= effective_min_minutes,
            )
        )

        if opponent or team:
            query = query.join(Match, PlayerMatchStats.match_id == Match.id)
            if opponent:
                query = query.filter(Match.opponent_name == opponent)
            if team:
                query = query.filter(Match.team == team)

        query = self._apply_position_filter(query, position_type)

        results = (
            query.group_by(Player.id, Player.name)
            .order_by(func.avg(PlayerMatchStats.puntuacion_final).desc())
            .limit(limit)
            .all()
        )

        return [
            {
                "rank": rank,
                "player_name": result.player_name,
                "opponent": None,
                "puesto": None,
                "tiempo_juego": None,
                "score_absoluto": None,
                "puntuacion_final": round(result.avg_score, 2),
                "matches_played": result.matches_played,
            }
            for rank, result in enumerate(results, 1)
        ]

    @staticmethod
    def _apply_position_filter(query, position_type: str | None):
        """Apply forwards/backs position filter to a query."""
        if position_type == "forwards":
            query = query.filter(PlayerMatchStats.puesto.between(1, 8))
        elif position_type == "backs":
            query = query.filter(PlayerMatchStats.puesto.between(9, 15))
        return query

    def get_player_summary(self, player_name: str) -> dict | None:
        """Get a summary of a player's performance across all matches."""
        from app.models import Player

        player = self.db.query(Player).filter(Player.name == player_name).first()
        if not player:
            return None

        stats_list = player.match_stats
        if not stats_list:
            return {
                "player_id": player.id,
                "player_name": player_name,
                "matches_played": 0,
                "weight_kg": player.weight_kg,
                "height_cm": player.height_cm,
            }

        total_tiempo = sum(s.tiempo_juego or 0 for s in stats_list)
        avg_score = sum(s.puntuacion_final or 0 for s in stats_list) / len(stats_list)

        return {
            "player_id": player.id,
            "player_name": player_name,
            "matches_played": len(stats_list),
            "total_minutes": round(total_tiempo, 1),
            "avg_puntuacion_final": round(avg_score, 2),
            "weight_kg": player.weight_kg,
            "height_cm": player.height_cm,
            "matches": [self._build_match_stats_dict(s) for s in stats_list],
        }

    @staticmethod
    def _build_match_stats_dict(stats: PlayerMatchStats) -> dict:
        """Build a dict with match info and all 16 stat fields."""
        result = {
            "match_id": stats.match_id,
            "opponent": stats.match.opponent_name,
            "team": stats.match.team,
            "match_date": stats.match.match_date.isoformat()
            if stats.match.match_date
            else None,
            "puesto": stats.puesto,
            "tiempo_juego": stats.tiempo_juego,
            "score": round(stats.puntuacion_final, 2) if stats.puntuacion_final else 0,
        }
        for field in STAT_FIELDS:
            result[field] = getattr(stats, field, 0) or 0
        return result

    def get_position_comparison(self, player_id: int) -> dict:
        """Calculate position comparison stats for a player vs their position group."""
        from app.models import Player

        player = self.db.query(Player).filter(Player.id == player_id).first()
        if not player:
            raise ValueError(f"Player {player_id} not found")

        player_stats = player.match_stats
        if not player_stats:
            raise ValueError("No stats found for player")

        positions = [s.puesto for s in player_stats if s.puesto]
        if not positions:
            raise ValueError("No position data for player")

        most_common_pos = Counter(positions).most_common(1)[0][0]
        group_stats = (
            self.db.query(PlayerMatchStats)
            .filter(PlayerMatchStats.puesto == most_common_pos)
            .all()
        )

        stats_comparison = self._calculate_stats_comparison(player_stats, group_stats)

        return {
            "player_id": player.id,
            "player_name": player.name,
            "position_group": most_common_pos,
            "stats": stats_comparison,
        }

    def get_position_comparison_for_report(self, player_id: int) -> tuple[str, dict]:
        """Get position comparison data formatted for PDF report generation.

        Returns:
            Tuple of (position_group_label, stats_comparison)
        """
        from app.constants import (
            FORWARD_POSITION_MAX,
            FORWARD_POSITION_MIN,
            get_group_for_position,
        )
        from app.models import Player

        player = self.db.query(Player).filter(Player.id == player_id).first()
        if not player:
            raise ValueError(f"Player {player_id} not found")

        positions = [s.puesto for s in player.match_stats if s.puesto]
        most_common_pos = Counter(positions).most_common(1)[0][0] if positions else 1

        group = get_group_for_position(most_common_pos)
        group_positions = group["positions"] if group else [most_common_pos]

        group_stats = (
            self.db.query(PlayerMatchStats)
            .filter(PlayerMatchStats.puesto.in_(group_positions))
            .all()
        )

        is_forward = FORWARD_POSITION_MIN <= most_common_pos <= FORWARD_POSITION_MAX
        position_group = "forwards" if is_forward else "backs"

        stats_comparison = self._calculate_stats_comparison(
            player.match_stats, group_stats
        )

        return position_group, stats_comparison

    @staticmethod
    def _calculate_stats_comparison(
        player_stats: list, group_stats: list
    ) -> dict[str, dict]:
        """Calculate per-stat comparison between player and group."""
        comparison = {}
        for field in STAT_FIELDS:
            player_values = [getattr(s, field, 0) or 0 for s in player_stats]
            group_values = [getattr(s, field, 0) or 0 for s in group_stats]

            player_avg = sum(player_values) / len(player_values) if player_values else 0
            group_avg = sum(group_values) / len(group_values) if group_values else 0

            diff_pct = 0.0
            if group_avg > 0:
                diff_pct = round(((player_avg - group_avg) / group_avg) * 100, 1)

            comparison[field] = {
                "player_avg": round(player_avg, 1),
                "group_avg": round(group_avg, 1),
                "difference_pct": diff_pct,
            }
        return comparison

    def get_players_with_stats(
        self, skip: int = 0, limit: int = 100
    ) -> tuple[list[dict], int]:
        """Get players with aggregated stats summary."""
        from app.models import Player

        players = self.db.query(Player).offset(skip).limit(limit).all()
        total = self.db.query(Player).count()

        items = [self._build_player_with_stats(player) for player in players]
        return items, total

    @staticmethod
    def _build_player_with_stats(player) -> dict:
        """Build player summary with aggregated match stats."""
        stats_list = player.match_stats
        matches_played = len(stats_list)
        total_score = sum(s.puntuacion_final or 0 for s in stats_list)
        avg_score = total_score / matches_played if matches_played > 0 else 0

        primary_position = None
        if stats_list:
            positions = [s.puesto for s in stats_list if s.puesto is not None]
            if positions:
                primary_position = Counter(positions).most_common(1)[0][0]

        return {
            "id": player.id,
            "name": player.name,
            "created_at": player.created_at,
            "updated_at": player.updated_at,
            "matches_played": matches_played,
            "avg_score": round(avg_score, 1),
            "total_score": round(total_score, 1),
            "primary_position": primary_position,
        }
