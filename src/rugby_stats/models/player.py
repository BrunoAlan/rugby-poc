"""Player model."""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from rugby_stats.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from rugby_stats.models.player_stats import PlayerMatchStats


class Player(Base, TimestampMixin):
    """Rugby player (from our team)."""

    __tablename__ = "players"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), unique=True, nullable=False)

    # AI Evolution Analysis (cached)
    ai_evolution_analysis: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_evolution_analysis_status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pending"
    )  # pending, processing, completed, error
    ai_evolution_analysis_error: Mapped[str | None] = mapped_column(String(500), nullable=True)
    ai_evolution_generated_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    ai_evolution_match_count: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Relationships
    match_stats: Mapped[list["PlayerMatchStats"]] = relationship(
        "PlayerMatchStats", back_populates="player", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Player(id={self.id}, name='{self.name}')>"
