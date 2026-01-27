"""Match model."""

from datetime import date, datetime
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import Date, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from rugby_stats.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from rugby_stats.models.player_stats import PlayerMatchStats


class Match(Base, TimestampMixin):
    """Rugby match against an opponent."""

    __tablename__ = "matches"

    id: Mapped[int] = mapped_column(primary_key=True)
    opponent_name: Mapped[str] = mapped_column(String(100), nullable=False)
    team: Mapped[str] = mapped_column(String(20), nullable=False)
    match_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    source_sheet: Mapped[str] = mapped_column(String(100), nullable=False)
    import_batch_id: Mapped[UUID] = mapped_column(default=uuid4, nullable=False)

    # Match metadata fields
    location: Mapped[str | None] = mapped_column(String(20), nullable=True)  # Local/Visitante
    result: Mapped[str | None] = mapped_column(String(20), nullable=True)  # Victoria/Derrota
    our_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    opponent_score: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # AI Analysis fields
    ai_analysis: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_analysis_generated_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    ai_analysis_error: Mapped[str | None] = mapped_column(String(500), nullable=True)
    ai_analysis_status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="skipped"
    )  # pending, processing, completed, error, skipped

    # Relationships
    player_stats: Mapped[list["PlayerMatchStats"]] = relationship(
        "PlayerMatchStats", back_populates="match", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Match(id={self.id}, team='{self.team}', opponent='{self.opponent_name}')>"
