"""Scoring configuration models."""

from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Float, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from rugby_stats.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    pass


class ScoringConfiguration(Base, TimestampMixin):
    """Scoring configuration set."""

    __tablename__ = "scoring_configurations"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    weights: Mapped[list["ScoringWeight"]] = relationship(
        "ScoringWeight", back_populates="configuration", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<ScoringConfiguration(id={self.id}, name='{self.name}', is_active={self.is_active})>"


class ScoringWeight(Base, TimestampMixin):
    """Weight for a specific action in a scoring configuration."""

    __tablename__ = "scoring_weights"
    __table_args__ = (
        UniqueConstraint("config_id", "action_name", name="uq_config_action"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    config_id: Mapped[int] = mapped_column(
        ForeignKey("scoring_configurations.id"), nullable=False
    )
    action_name: Mapped[str] = mapped_column(String(50), nullable=False)
    forwards_weight: Mapped[float] = mapped_column(Float, nullable=False)
    backs_weight: Mapped[float] = mapped_column(Float, nullable=False)

    # Relationships
    configuration: Mapped["ScoringConfiguration"] = relationship(
        "ScoringConfiguration", back_populates="weights"
    )

    def __repr__(self) -> str:
        return f"<ScoringWeight(action='{self.action_name}', fwd={self.forwards_weight}, back={self.backs_weight})>"


# Default scoring weights as defined in the plan
DEFAULT_SCORING_WEIGHTS = {
    "tackles_positivos": (5.0, 3.0),
    "tackles": (2.0, 1.5),
    "tackles_errados": (-4.0, -3.0),
    "portador": (1.5, 1.2),
    "ruck_ofensivos": (2.5, 0.5),
    "pases": (0.5, 1.2),
    "pases_malos": (-2.0, -4.0),
    "perdidas": (-4.0, -5.0),
    "recuperaciones": (5.0, 4.0),
    "gana_contacto": (3.0, 4.0),
    "quiebres": (4.0, 7.0),
    "penales": (-5.0, -4.0),
    "juego_pie": (1.0, 3.0),
    "recepcion_aire_buena": (3.0, 5.0),
    "recepcion_aire_mala": (-3.0, -4.0),
    "try_": (10.0, 12.0),
}
