"""Scoring configuration models."""

from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Float, ForeignKey, Integer, String, UniqueConstraint
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
    """Weight for a specific action and position in a scoring configuration."""

    __tablename__ = "scoring_weights"
    __table_args__ = (
        UniqueConstraint("config_id", "action_name", "position", name="uq_config_action_position"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    config_id: Mapped[int] = mapped_column(
        ForeignKey("scoring_configurations.id"), nullable=False
    )
    action_name: Mapped[str] = mapped_column(String(50), nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    weight: Mapped[float] = mapped_column(Float, nullable=False)

    # Relationships
    configuration: Mapped["ScoringConfiguration"] = relationship(
        "ScoringConfiguration", back_populates="weights"
    )

    def __repr__(self) -> str:
        return f"<ScoringWeight(action='{self.action_name}', position={self.position}, weight={self.weight})>"


# Default weights: {action_name: (forwards_value, backs_value)}
# Positions 1-8 get forwards_value, 9-15 get backs_value
_DEFAULT_WEIGHT_PAIRS = {
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

DEFAULT_SCORING_WEIGHTS: dict[str, dict[int, float]] = {
    action: {
        pos: fwd if pos <= 8 else back
        for pos in range(1, 16)
    }
    for action, (fwd, back) in _DEFAULT_WEIGHT_PAIRS.items()
}
