"""Background task services for async processing."""

import logging
from collections import Counter
from datetime import datetime

from sqlalchemy.orm import joinedload

from rugby_stats.constants import get_group_for_position
from rugby_stats.database import SessionLocal
from rugby_stats.models import Match, Player, PlayerMatchStats
from rugby_stats.services.ai_analysis import AIAnalysisService
from rugby_stats.services.anomaly_detection import AnomalyDetectionService

logger = logging.getLogger(__name__)


def generate_ai_analysis_background(match_ids: list[int]) -> None:
    """
    Generate AI analysis for matches in background.

    This function creates its own database session since it runs outside
    the request context. Each match is processed independently so that
    failures don't affect other matches.

    Args:
        match_ids: List of match IDs to generate AI analysis for
    """
    logger.info(f"Starting background AI analysis for {len(match_ids)} match(es)")

    db = SessionLocal()
    try:
        ai_service = AIAnalysisService(db)

        for match_id in match_ids:
            try:
                match = db.query(Match).filter(Match.id == match_id).first()
                if not match:
                    logger.warning(f"Match {match_id} not found, skipping")
                    continue

                # Update status to processing
                match.ai_analysis_status = "processing"
                db.commit()

                # Generate AI analysis
                ai_service.analyze_and_save(match)

                # Update status based on result
                if match.ai_analysis:
                    match.ai_analysis_status = "completed"
                elif match.ai_analysis_error:
                    match.ai_analysis_status = "error"

                db.commit()
                logger.info(
                    f"Completed AI analysis for match {match_id}: {match.ai_analysis_status}"
                )

            except Exception as e:
                logger.error(f"Error generating AI analysis for match {match_id}: {e}")
                db.rollback()
                try:
                    match = db.query(Match).filter(Match.id == match_id).first()
                    if match:
                        match.ai_analysis_status = "error"
                        match.ai_analysis_error = str(e)[:500]
                        db.commit()
                except Exception as inner_e:
                    logger.error(f"Failed to update error status for match {match_id}: {inner_e}")
                    db.rollback()

    finally:
        db.close()
        logger.info("Background AI analysis task completed")


def generate_player_evolution_background(player_id: int) -> None:
    """Generate AI evolution analysis for a player in background."""
    logger.info(f"Starting background player evolution analysis for player {player_id}")

    db = SessionLocal()
    try:
        player = db.query(Player).filter(Player.id == player_id).first()
        if not player:
            logger.warning(f"Player {player_id} not found")
            return

        player.ai_evolution_analysis_status = "processing"
        db.commit()

        try:
            anomaly_service = AnomalyDetectionService(db)
            anomalies = anomaly_service.detect_anomalies(player_id)

            from rugby_stats.services.scoring import ScoringService
            scoring_service = ScoringService(db)
            summary = scoring_service.get_player_summary(player.name)

            if not summary or not summary.get("matches"):
                player.ai_evolution_analysis_error = "No match data available"
                player.ai_evolution_analysis_status = "error"
                db.commit()
                return

            positions = [s.puesto for s in player.match_stats if s.puesto]
            most_common_pos = Counter(positions).most_common(1)[0][0]

            group = get_group_for_position(most_common_pos)
            group_positions = group["positions"] if group else [most_common_pos]

            group_stats = db.query(PlayerMatchStats).filter(
                PlayerMatchStats.puesto.in_(group_positions)
            ).all()

            stat_fields = [
                "tackles_positivos", "tackles", "tackles_errados", "portador",
                "ruck_ofensivos", "pases", "pases_malos", "perdidas",
                "recuperaciones", "gana_contacto", "quiebres", "penales",
                "juego_pie", "recepcion_aire_buena", "recepcion_aire_mala", "try_",
            ]
            position_comparison = {}
            for field in stat_fields:
                player_values = [getattr(s, field, 0) or 0 for s in player.match_stats]
                group_values = [getattr(s, field, 0) or 0 for s in group_stats]
                player_avg = sum(player_values) / len(player_values) if player_values else 0
                group_avg = sum(group_values) / len(group_values) if group_values else 0
                diff_pct = round(((player_avg - group_avg) / group_avg) * 100, 1) if group_avg > 0 else 0.0
                position_comparison[field] = {
                    "player_avg": round(player_avg, 1),
                    "group_avg": round(group_avg, 1),
                    "difference_pct": diff_pct,
                }

            # Get active scoring config for weight-based stat prioritization
            from rugby_stats.models import ScoringConfiguration as ScoringConfigModel
            active_config = db.query(ScoringConfigModel).filter(
                ScoringConfigModel.is_active.is_(True)
            ).options(joinedload(ScoringConfigModel.weights)).first()

            ai_service = AIAnalysisService(db)
            analysis = ai_service.generate_player_evolution(
                player_name=player.name,
                matches_data=summary["matches"],
                anomalies=anomalies,
                position_comparison=position_comparison,
                position_number=most_common_pos,
                config=active_config,
            )

            player.ai_evolution_analysis = analysis
            player.ai_evolution_analysis_status = "completed"
            player.ai_evolution_analysis_error = None
            player.ai_evolution_generated_at = datetime.utcnow()
            player.ai_evolution_match_count = len(player.match_stats)
            db.commit()

        except Exception as e:
            logger.error(f"Error generating evolution analysis for player {player_id}: {e}")
            db.rollback()
            player = db.query(Player).filter(Player.id == player_id).first()
            if player:
                player.ai_evolution_analysis_status = "error"
                player.ai_evolution_analysis_error = str(e)[:500]
                db.commit()

    finally:
        db.close()
