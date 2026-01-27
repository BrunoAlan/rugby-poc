"""Background task services for async processing."""

import logging

from rugby_stats.database import SessionLocal
from rugby_stats.models import Match
from rugby_stats.services.ai_analysis import AIAnalysisService

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
