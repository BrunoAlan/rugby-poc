"""Player match statistics model."""

from typing import TYPE_CHECKING

from sqlalchemy import Float, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.match import Match
    from app.models.player import Player


class PlayerMatchStats(Base, TimestampMixin):
    """Statistics for a player in a specific match."""

    __tablename__ = "player_match_stats"
    __table_args__ = (
        UniqueConstraint("player_id", "match_id", name="uq_player_match"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    player_id: Mapped[int] = mapped_column(ForeignKey("players.id"), nullable=False)
    match_id: Mapped[int] = mapped_column(ForeignKey("matches.id"), nullable=False)

    # Player position (1-8 forwards, 9-15 backs)
    puesto: Mapped[int] = mapped_column(Integer, nullable=False)

    # Playing time in minutes
    tiempo_juego: Mapped[float] = mapped_column(Float, nullable=False, default=80.0)

    # Statistics columns (16 stats)
    tackles_positivos: Mapped[int] = mapped_column(Integer, default=0)
    tackles: Mapped[int] = mapped_column(Integer, default=0)
    tackles_errados: Mapped[int] = mapped_column(Integer, default=0)
    portador: Mapped[int] = mapped_column(Integer, default=0)
    ruck_ofensivos: Mapped[int] = mapped_column(Integer, default=0)
    pases: Mapped[int] = mapped_column(Integer, default=0)
    pases_malos: Mapped[int] = mapped_column(Integer, default=0)
    perdidas: Mapped[int] = mapped_column(Integer, default=0)
    recuperaciones: Mapped[int] = mapped_column(Integer, default=0)
    gana_contacto: Mapped[int] = mapped_column(Integer, default=0)
    quiebres: Mapped[int] = mapped_column(Integer, default=0)
    penales: Mapped[int] = mapped_column(Integer, default=0)
    juego_pie: Mapped[int] = mapped_column(Integer, default=0)
    recepcion_aire_buena: Mapped[int] = mapped_column(Integer, default=0)
    recepcion_aire_mala: Mapped[int] = mapped_column(Integer, default=0)
    try_: Mapped[int] = mapped_column("try", Integer, default=0)

    # Calculated scores
    score_absoluto: Mapped[float | None] = mapped_column(Float, nullable=True)
    puntuacion_final: Mapped[float | None] = mapped_column(Float, nullable=True)
    scoring_config_id: Mapped[int | None] = mapped_column(
        ForeignKey("scoring_configurations.id"), nullable=True
    )

    # Relationships
    player: Mapped["Player"] = relationship("Player", back_populates="match_stats")
    match: Mapped["Match"] = relationship("Match", back_populates="player_stats")

    @property
    def is_forward(self) -> bool:
        """Check if player position is forward (1-8)."""
        return 1 <= self.puesto <= 8

    @property
    def is_back(self) -> bool:
        """Check if player position is back (9-15)."""
        return 9 <= self.puesto <= 15

    def __repr__(self) -> str:
        return f"<PlayerMatchStats(player_id={self.player_id}, match_id={self.match_id}, puesto={self.puesto})>"
