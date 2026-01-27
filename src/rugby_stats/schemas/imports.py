"""Import schemas."""

from pydantic import BaseModel


class UploadResult(BaseModel):
    """Result of an Excel upload/import operation."""

    players_created: int
    matches_created: int
    stats_created: int
    sheets_processed: list[str]
    ai_analysis_generated: int = 0
    ai_analysis_errors: int = 0
    ai_analysis_queued: int = 0
