"""Match schemas."""

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class MatchBase(BaseModel):
    """Base match schema."""

    opponent_name: str
    team: str
    match_date: date | None = None
    source_sheet: str


class MatchCreate(MatchBase):
    """Schema for creating a match."""

    pass


class Match(MatchBase):
    """Match response schema."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    import_batch_id: UUID
    location: str | None = None
    result: str | None = None
    our_score: int | None = None
    opponent_score: int | None = None
    ai_analysis: str | None = None
    ai_analysis_generated_at: datetime | None = None
    ai_analysis_error: str | None = None
    created_at: datetime
    updated_at: datetime


class MatchList(BaseModel):
    """List of matches response."""

    items: list[Match]
    total: int
