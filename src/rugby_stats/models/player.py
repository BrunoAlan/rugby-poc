"""Player model."""

from typing import TYPE_CHECKING

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from rugby_stats.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from rugby_stats.models.player_stats import PlayerMatchStats


class Player(Base, TimestampMixin):
    """Rugby player (from our team)."""

    __tablename__ = "players"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), unique=True, nullable=False)

    # Relationships
    match_stats: Mapped[list["PlayerMatchStats"]] = relationship(
        "PlayerMatchStats", back_populates="player", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Player(id={self.id}, name='{self.name}')>"
