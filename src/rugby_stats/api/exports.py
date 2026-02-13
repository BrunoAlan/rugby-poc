"""Export endpoints for generating reports."""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from rugby_stats.database import get_db
from rugby_stats.models import Match, Player
from rugby_stats.services.anomaly_detection import AnomalyDetectionService
from rugby_stats.services.pdf_generator import PDFGeneratorService
from rugby_stats.services.scoring import ScoringService

router = APIRouter()


@router.get("/matches/{match_id}/pdf")
def download_match_pdf(
    match_id: int,
    db: Session = Depends(get_db),
):
    """
    Download a PDF report for a specific match.

    The report includes:
    - Match header (team, opponent, date, result)
    - AI analysis (if available)
    - Player rankings table
    """
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    scoring_service = ScoringService(db)
    rankings = scoring_service.get_rankings(match_id=match_id, limit=50)

    pdf_service = PDFGeneratorService()
    pdf_bytes = pdf_service.generate_match_report(match, rankings)

    date_str = match.match_date.strftime("%Y%m%d") if match.match_date else "no-date"
    filename = f"informe_{match.team}_vs_{match.opponent_name}_{date_str}.pdf"
    filename = filename.replace(" ", "_").replace("/", "-")

    return StreamingResponse(
        iter([pdf_bytes]),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Length": str(len(pdf_bytes)),
        },
    )


@router.get("/players/{player_id}/report")
def download_player_report(
    player_id: int,
    db: Session = Depends(get_db),
):
    """Download a PDF evolution report for a player."""
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    if not player.match_stats:
        raise HTTPException(status_code=400, detail="Player has no match stats")

    anomaly_service = AnomalyDetectionService(db)
    anomalies = anomaly_service.detect_anomalies(player_id)

    scoring_service = ScoringService(db)
    summary = scoring_service.get_player_summary(player.name)
    position_group, position_comparison = scoring_service.get_position_comparison_for_report(player_id)

    pdf_service = PDFGeneratorService()
    pdf_bytes = pdf_service.generate_player_report(
        player_name=player.name,
        position_group=position_group,
        matches_data=summary.get("matches", []) if summary else [],
        anomalies=anomalies,
        position_comparison=position_comparison,
        ai_analysis=player.ai_evolution_analysis,
    )

    filename = f"informe_evolucion_{player.name.replace(' ', '_')}.pdf"

    return StreamingResponse(
        iter([pdf_bytes]),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Length": str(len(pdf_bytes)),
        },
    )
