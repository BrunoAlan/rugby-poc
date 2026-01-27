"""Export endpoints for generating reports."""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from rugby_stats.database import get_db
from rugby_stats.models import Match
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
