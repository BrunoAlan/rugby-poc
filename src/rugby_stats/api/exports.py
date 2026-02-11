"""Export endpoints for generating reports."""

from collections import Counter

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from rugby_stats.database import get_db
from rugby_stats.models import Match, Player, PlayerMatchStats
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
    # Get the match
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    # Get rankings for the match
    scoring_service = ScoringService(db)
    rankings = scoring_service.get_rankings(match_id=match_id, limit=50)

    # Generate PDF
    pdf_service = PDFGeneratorService()
    pdf_bytes = pdf_service.generate_match_report(match, rankings)

    # Create filename
    date_str = match.match_date.strftime("%Y%m%d") if match.match_date else "no-date"
    filename = f"informe_{match.team}_vs_{match.opponent_name}_{date_str}.pdf"
    # Clean filename of special characters
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

    # Get anomalies
    anomaly_service = AnomalyDetectionService(db)
    anomalies = anomaly_service.detect_anomalies(player_id)

    # Get match summary
    scoring_service = ScoringService(db)
    summary = scoring_service.get_player_summary(player.name)

    # Get position comparison
    positions = [s.puesto for s in player.match_stats if s.puesto]
    most_common_pos = Counter(positions).most_common(1)[0][0] if positions else 1
    is_forward = 1 <= most_common_pos <= 8
    position_group = "forwards" if is_forward else "backs"

    if is_forward:
        group_stats = db.query(PlayerMatchStats).filter(PlayerMatchStats.puesto.between(1, 8)).all()
    else:
        group_stats = db.query(PlayerMatchStats).filter(PlayerMatchStats.puesto.between(9, 15)).all()

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

    # Generate PDF
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
