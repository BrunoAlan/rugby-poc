"""Scoring configuration models."""

from sqlalchemy import Boolean, Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from rugby_stats.models.base import Base, TimestampMixin


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
