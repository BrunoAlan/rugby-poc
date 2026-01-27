"""Import API endpoints."""

import tempfile
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from rugby_stats.config import get_settings
from rugby_stats.database import get_db
from rugby_stats.schemas.imports import UploadResult
from rugby_stats.services.importer import ExcelImporter
from rugby_stats.services.scoring import ScoringService

router = APIRouter(prefix="/imports", tags=["imports"])

settings = get_settings()


@router.post("/upload", response_model=UploadResult)
async def upload_excel(
    file: UploadFile = File(...),
    generate_ai: bool = True,
    db: Session = Depends(get_db),
):
    """
    Upload an Excel file and import rugby match data.

    Args:
        file: Excel file (.xlsx) containing match data
        generate_ai: Whether to generate AI analysis for each match
        db: Database session

    Returns:
        Import statistics including players, matches, and stats created
    """
    # Validate file type
    if not file.filename or not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only Excel files (.xlsx, .xls) are accepted.",
        )

    # Save file temporarily
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx") as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = Path(tmp.name)

        # Seed default weights if not present
        scoring_service = ScoringService(db)
        scoring_service.seed_default_weights()

        # Import data
        importer = ExcelImporter(db)
        stats = importer.import_file(
            tmp_path,
            generate_ai_analysis=generate_ai and settings.can_generate_ai_analysis,
        )

        # Recalculate scores
        scoring_service.recalculate_all_scores()

        return UploadResult(
            players_created=stats["players_created"],
            matches_created=stats["matches_created"],
            stats_created=stats["stats_created"],
            sheets_processed=stats["sheets_processed"],
            ai_analysis_generated=stats.get("ai_analysis_generated", 0),
            ai_analysis_errors=stats.get("ai_analysis_errors", 0),
        )

    except FileNotFoundError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")
    finally:
        # Clean up temp file
        if tmp_path.exists():
            tmp_path.unlink()


@router.get("/template")
async def download_template():
    """Download the Excel template for importing match data."""
    template_path = Path(__file__).parent.parent.parent.parent / "data" / "Template.xlsx"

    if not template_path.exists():
        raise HTTPException(status_code=404, detail="Template file not found")

    return FileResponse(
        path=template_path,
        filename="Template.xlsx",
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )
