"""Scoring calculation service."""

from sqlalchemy.orm import Session

from rugby_stats.models import PlayerMatchStats, ScoringConfiguration, ScoringWeight
from rugby_stats.models.scoring_config import DEFAULT_SCORING_WEIGHTS

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

        stat_fields = [
            "tackles_positivos",
            "tackles",
            "tackles_errados",
            "portador",
            "ruck_ofensivos",
            "pases",
            "pases_malos",
            "perdidas",
            "recuperaciones",
            "gana_contacto",
            "quiebres",
            "penales",
            "juego_pie",
            "recepcion_aire_buena",
            "recepcion_aire_mala",
            "try_",
        ]

        for field in stat_fields:
            stat_value = getattr(stats, field, 0) or 0
            action_weights = weights.get(field, {})
            w = action_weights.get(position, 0.0)
            score_absoluto += stat_value * w

        # Normalize to standard match duration with floor
        tiempo_juego = stats.tiempo_juego or STANDARD_MATCH_DURATION
        tiempo_for_calc = max(tiempo_juego, MIN_MINUTES_FOR_NORMALIZATION)
        if tiempo_for_calc > 0:
            puntuacion_final = (score_absoluto / tiempo_for_calc) * STANDARD_MATCH_DURATION
        else:
            puntuacion_final = 0.0

        return score_absoluto, puntuacion_final

    def recalculate_all_scores(
        self, config: ScoringConfiguration | None = None
    ) -> int:
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
        """
        Get player rankings by puntuacion_final.

        Args:
            match_id: Optional match ID filter. If None, aggregates by player.
            opponent: Optional opponent filter (match opponent_name)
            team: Optional team filter (M17, M18, etc.)
            position_type: 'forwards' (1-8), 'backs' (9-15), or None for all
            limit: Maximum number of results
            min_minutes: Minimum minutes played to appear in rankings.
                         Defaults to MIN_MINUTES_FOR_RANKING for aggregated view.

        Returns:
            List of player stats with rankings
        """
        from sqlalchemy import func

        from rugby_stats.models import Match, Player

        if match_id:
            # Filter by specific match - return individual match stats
            # For single match view, show all players but can filter by min_minutes
            query = self.db.query(PlayerMatchStats).filter(
                PlayerMatchStats.puntuacion_final.isnot(None),
                PlayerMatchStats.match_id == match_id,
            )

            # Apply team filter if specified (join with Match)
            if team:
                query = query.join(Match, PlayerMatchStats.match_id == Match.id).filter(
                    Match.team == team
                )

            # Apply minimum minutes filter if specified
            if min_minutes is not None:
                query = query.filter(PlayerMatchStats.tiempo_juego >= min_minutes)

            if position_type == "forwards":
                query = query.filter(PlayerMatchStats.puesto.between(1, 8))
            elif position_type == "backs":
                query = query.filter(PlayerMatchStats.puesto.between(9, 15))

            results = (
                query.order_by(PlayerMatchStats.puntuacion_final.desc())
                .limit(limit)
                .all()
            )

            rankings = []
            for rank, stats in enumerate(results, 1):
                rankings.append(
                    {
                        "rank": rank,
                        "player_name": stats.player.name,
                        "opponent": stats.match.opponent_name,
                        "puesto": stats.puesto,
                        "tiempo_juego": stats.tiempo_juego,
                        "score_absoluto": round(stats.score_absoluto, 2),
                        "puntuacion_final": round(stats.puntuacion_final, 2),
                    }
                )

            return rankings

        # No match_id: Aggregate by player (average score across all matches)
        # Apply minimum minutes filter (default to MIN_MINUTES_FOR_RANKING)
        effective_min_minutes = min_minutes if min_minutes is not None else MIN_MINUTES_FOR_RANKING

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

        if position_type == "forwards":
            query = query.filter(PlayerMatchStats.puesto.between(1, 8))
        elif position_type == "backs":
            query = query.filter(PlayerMatchStats.puesto.between(9, 15))

        results = (
            query.group_by(Player.id, Player.name)
            .order_by(func.avg(PlayerMatchStats.puntuacion_final).desc())
            .limit(limit)
            .all()
        )

        rankings = []
        for rank, result in enumerate(results, 1):
            rankings.append(
                {
                    "rank": rank,
                    "player_name": result.player_name,
                    "opponent": None,  # Aggregated view
                    "puesto": None,  # Not applicable for aggregated view
                    "tiempo_juego": None,  # Not applicable for aggregated view
                    "score_absoluto": None,  # Not applicable for aggregated view
                    "puntuacion_final": round(result.avg_score, 2),
                    "matches_played": result.matches_played,
                }
            )

        return rankings

    def get_player_summary(self, player_name: str) -> dict | None:
        """
        Get a summary of a player's performance across all matches.

        Args:
            player_name: Player name

        Returns:
            Summary dict or None if player not found
        """
        from rugby_stats.models import Player

        player = self.db.query(Player).filter(Player.name == player_name).first()
        if not player:
            return None

        stats_list = player.match_stats
        if not stats_list:
            return {"player_id": player.id, "player_name": player_name, "matches_played": 0}

        total_tiempo = sum(s.tiempo_juego or 0 for s in stats_list)
        avg_score = (
            sum(s.puntuacion_final or 0 for s in stats_list) / len(stats_list)
            if stats_list
            else 0
        )

        return {
            "player_id": player.id,
            "player_name": player_name,
            "matches_played": len(stats_list),
            "total_minutes": round(total_tiempo, 1),
            "avg_puntuacion_final": round(avg_score, 2),
            "matches": [
                {
                    "match_id": s.match_id,
                    "opponent": s.match.opponent_name,
                    "team": s.match.team,
                    "match_date": s.match.match_date.isoformat() if s.match.match_date else None,
                    "puesto": s.puesto,
                    "tiempo_juego": s.tiempo_juego,
                    "score": round(s.puntuacion_final, 2) if s.puntuacion_final else 0,
                    # All 16 statistics
                    "tackles_positivos": s.tackles_positivos or 0,
                    "tackles": s.tackles or 0,
                    "tackles_errados": s.tackles_errados or 0,
                    "portador": s.portador or 0,
                    "ruck_ofensivos": s.ruck_ofensivos or 0,
                    "pases": s.pases or 0,
                    "pases_malos": s.pases_malos or 0,
                    "perdidas": s.perdidas or 0,
                    "recuperaciones": s.recuperaciones or 0,
                    "gana_contacto": s.gana_contacto or 0,
                    "quiebres": s.quiebres or 0,
                    "penales": s.penales or 0,
                    "juego_pie": s.juego_pie or 0,
                    "recepcion_aire_buena": s.recepcion_aire_buena or 0,
                    "recepcion_aire_mala": s.recepcion_aire_mala or 0,
                    "try_": s.try_ or 0,
                }
                for s in stats_list
            ],
        }
