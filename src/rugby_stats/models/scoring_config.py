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


# Default weights per position (1-15).
# Each action maps to {position: weight}.
# Positions: 1=Loosehead Prop, 2=Hooker, 3=Tighthead Prop, 4/5=Locks,
# 6=Blindside Flanker, 7=Openside Flanker, 8=Number 8,
# 9=Scrum-half, 10=Fly-half, 11=Left Wing, 12=Inside Centre,
# 13=Outside Centre, 14=Right Wing, 15=Fullback
DEFAULT_SCORING_WEIGHTS: dict[str, dict[int, float]] = {
    "tackles_positivos": {
        1: 4.5, 2: 4.5, 3: 4.5, 4: 5.0, 5: 5.0,
        6: 5.5, 7: 6.5, 8: 5.0, 9: 3.5, 10: 3.0,
        11: 2.5, 12: 4.0, 13: 3.5, 14: 2.5, 15: 3.0,
    },
    "tackles": {
        1: 2.0, 2: 2.0, 3: 2.0, 4: 2.0, 5: 2.0,
        6: 2.5, 7: 3.0, 8: 2.5, 9: 1.5, 10: 1.5,
        11: 1.0, 12: 2.0, 13: 1.8, 14: 1.0, 15: 1.5,
    },
    "tackles_errados": {
        1: -3.5, 2: -3.5, 3: -3.5, 4: -4.0, 5: -4.0,
        6: -4.5, 7: -5.0, 8: -4.0, 9: -3.0, 10: -3.0,
        11: -2.5, 12: -3.5, 13: -3.0, 14: -2.5, 15: -3.0,
    },
    "portador": {
        1: 1.5, 2: 1.5, 3: 1.5, 4: 1.5, 5: 1.5,
        6: 2.0, 7: 2.0, 8: 2.5, 9: 1.0, 10: 1.5,
        11: 2.0, 12: 2.0, 13: 2.0, 14: 2.0, 15: 1.5,
    },
    "ruck_ofensivos": {
        1: 3.0, 2: 2.5, 3: 3.0, 4: 3.0, 5: 3.0,
        6: 2.5, 7: 2.5, 8: 2.5, 9: 0.5, 10: 0.5,
        11: 0.5, 12: 1.0, 13: 0.5, 14: 0.5, 15: 0.5,
    },
    "pases": {
        1: 0.3, 2: 0.5, 3: 0.3, 4: 0.3, 5: 0.3,
        6: 0.5, 7: 0.5, 8: 0.8, 9: 2.0, 10: 1.8,
        11: 1.0, 12: 1.2, 13: 1.2, 14: 1.0, 15: 1.0,
    },
    "pases_malos": {
        1: -1.5, 2: -2.0, 3: -1.5, 4: -1.5, 5: -1.5,
        6: -2.0, 7: -2.0, 8: -2.5, 9: -5.0, 10: -4.5,
        11: -3.5, 12: -4.0, 13: -4.0, 14: -3.5, 15: -3.5,
    },
    "perdidas": {
        1: -3.5, 2: -3.5, 3: -3.5, 4: -4.0, 5: -4.0,
        6: -4.0, 7: -4.0, 8: -4.5, 9: -4.5, 10: -5.0,
        11: -5.0, 12: -5.0, 13: -5.0, 14: -5.0, 15: -4.5,
    },
    "recuperaciones": {
        1: 4.5, 2: 5.0, 3: 4.5, 4: 5.0, 5: 5.0,
        6: 5.5, 7: 6.5, 8: 5.5, 9: 4.0, 10: 3.5,
        11: 3.5, 12: 4.0, 13: 4.0, 14: 3.5, 15: 4.0,
    },
    "gana_contacto": {
        1: 3.0, 2: 3.0, 3: 3.0, 4: 3.0, 5: 3.0,
        6: 3.5, 7: 3.5, 8: 4.0, 9: 3.0, 10: 3.5,
        11: 4.0, 12: 4.5, 13: 4.5, 14: 4.0, 15: 3.5,
    },
    "quiebres": {
        1: 3.0, 2: 3.5, 3: 3.0, 4: 3.5, 5: 3.5,
        6: 4.5, 7: 4.5, 8: 5.0, 9: 5.5, 10: 6.0,
        11: 7.5, 12: 6.5, 13: 7.0, 14: 7.5, 15: 6.0,
    },
    "penales": {
        1: -5.5, 2: -5.0, 3: -5.5, 4: -5.0, 5: -5.0,
        6: -5.0, 7: -6.0, 8: -5.0, 9: -4.0, 10: -4.0,
        11: -3.5, 12: -4.0, 13: -4.0, 14: -3.5, 15: -4.0,
    },
    "juego_pie": {
        1: 0.5, 2: 0.5, 3: 0.5, 4: 0.5, 5: 0.5,
        6: 0.8, 7: 0.8, 8: 1.5, 9: 2.5, 10: 4.0,
        11: 2.0, 12: 2.0, 13: 2.0, 14: 2.0, 15: 3.5,
    },
    "recepcion_aire_buena": {
        1: 2.0, 2: 2.5, 3: 2.0, 4: 4.0, 5: 4.0,
        6: 3.0, 7: 3.0, 8: 3.5, 9: 3.0, 10: 4.0,
        11: 4.5, 12: 3.5, 13: 3.5, 14: 4.5, 15: 5.5,
    },
    "recepcion_aire_mala": {
        1: -2.0, 2: -2.5, 3: -2.0, 4: -3.5, 5: -3.5,
        6: -3.0, 7: -3.0, 8: -3.0, 9: -3.0, 10: -3.5,
        11: -4.0, 12: -3.5, 13: -3.5, 14: -4.0, 15: -5.0,
    },
    "try_": {
        1: 8.0, 2: 8.5, 3: 8.0, 4: 9.0, 5: 9.0,
        6: 9.5, 7: 10.0, 8: 10.0, 9: 10.0, 10: 10.5,
        11: 12.0, 12: 11.0, 13: 11.0, 14: 12.0, 15: 10.5,
    },
}
