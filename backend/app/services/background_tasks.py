"""Background task services for async processing."""

import logging
from collections import Counter
from datetime import datetime

from sqlalchemy.orm import Session, joinedload

from app.constants import get_group_for_position
from app.database import SessionLocal
from app.models import Match, Player, PlayerMatchStats
from app.services.ai_analysis import AIAnalysisService
from app.services.anomaly_detection import AnomalyDetectionService

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

                match.ai_analysis_status = "processing"
                db.commit()

                ai_service.analyze_and_save(match)

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
                    logger.error(
                        f"Failed to update error status for match {match_id}: {inner_e}"
                    )
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
            data = _prepare_evolution_data(db, player)
            analysis = _generate_analysis(db, player, data)
            _save_evolution_result(db, player, analysis)
        except Exception as e:
            _handle_evolution_error(db, player_id, e)
    finally:
        db.close()


def _prepare_evolution_data(db: Session, player: Player) -> dict:
    """Gather anomalies, summary, position comparison, and scoring config for evolution analysis.

    Returns a dict with keys: summary, anomalies, position_comparison,
    most_common_pos, and active_config.

    Raises ValueError if no match data is available.
    """
    anomaly_service = AnomalyDetectionService(db)
    anomalies = anomaly_service.detect_anomalies(player.id)

    from app.services.scoring import ScoringService

    scoring_service = ScoringService(db)
    summary = scoring_service.get_player_summary(player.name)

    if not summary or not summary.get("matches"):
        raise ValueError("No match data available")

    positions = [s.puesto for s in player.match_stats if s.puesto]
    most_common_pos = Counter(positions).most_common(1)[0][0]

    position_comparison = _calculate_position_comparison(db, player, most_common_pos)

    from app.models import ScoringConfiguration as ScoringConfigModel

    active_config = (
        db.query(ScoringConfigModel)
        .filter(ScoringConfigModel.is_active.is_(True))
        .options(joinedload(ScoringConfigModel.weights))
        .first()
    )

    return {
        "summary": summary,
        "anomalies": anomalies,
        "position_comparison": position_comparison,
        "most_common_pos": most_common_pos,
        "active_config": active_config,
    }


def _calculate_position_comparison(
    db: Session, player: Player, most_common_pos: int
) -> dict[str, dict]:
    """Calculate position comparison for evolution analysis."""
    group = get_group_for_position(most_common_pos)
    group_positions = group["positions"] if group else [most_common_pos]

    group_stats = (
        db.query(PlayerMatchStats)
        .filter(PlayerMatchStats.puesto.in_(group_positions))
        .all()
    )

    from app.services.scoring import ScoringService

    return ScoringService._calculate_stats_comparison(player.match_stats, group_stats)


def _generate_analysis(db: Session, player: Player, data: dict) -> str:
    """Call the AI service to generate the evolution analysis text."""
    ai_service = AIAnalysisService(db)
    return ai_service.generate_player_evolution(
        player_name=player.name,
        matches_data=data["summary"]["matches"],
        anomalies=data["anomalies"],
        position_comparison=data["position_comparison"],
        position_number=data["most_common_pos"],
        config=data["active_config"],
    )


def _save_evolution_result(db: Session, player: Player, analysis: str) -> None:
    """Persist successful evolution analysis on the player record."""
    player.ai_evolution_analysis = analysis
    player.ai_evolution_analysis_status = "completed"
    player.ai_evolution_analysis_error = None
    player.ai_evolution_generated_at = datetime.utcnow()
    player.ai_evolution_match_count = len(player.match_stats)
    db.commit()


def _handle_evolution_error(db: Session, player_id: int, error: Exception) -> None:
    """Log and persist an error that occurred during evolution analysis."""
    logger.error(f"Error generating evolution analysis for player {player_id}: {error}")
    db.rollback()
    player = db.query(Player).filter(Player.id == player_id).first()
    if player:
        player.ai_evolution_analysis_status = "error"
        player.ai_evolution_analysis_error = str(error)[:500]
        db.commit()
