"""Player match statistics schemas."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class PlayerMatchStatsBase(BaseModel):
    """Base player match stats schema."""

    player_id: int
    match_id: int
    puesto: int
    tiempo_juego: float = 80.0

    # Statistics
    tackles_positivos: int = 0
    tackles: int = 0
    tackles_errados: int = 0
    portador: int = 0
    ruck_ofensivos: int = 0
    pases: int = 0
    pases_malos: int = 0
    perdidas: int = 0
    recuperaciones: int = 0
    gana_contacto: int = 0
    quiebres: int = 0
    penales: int = 0
    juego_pie: int = 0
    recepcion_aire_buena: int = 0
    recepcion_aire_mala: int = 0
    try_: int = 0


class PlayerMatchStatsCreate(PlayerMatchStatsBase):
    """Schema for creating player match stats."""

    pass


class PlayerMatchStats(PlayerMatchStatsBase):
    """Player match stats response schema."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    score_absoluto: float | None = None
    puntuacion_final: float | None = None
    scoring_config_id: int | None = None
    created_at: datetime
    updated_at: datetime


class PlayerMatchStatsWithDetails(PlayerMatchStats):
    """Player match stats with player and opponent details."""

    player_name: str | None = None
    opponent: str | None = None


class PlayerMatchStatsList(BaseModel):
    """List of player match stats response."""

    items: list[PlayerMatchStats]
    total: int


class PlayerRanking(BaseModel):
    """Player ranking entry."""

    rank: int
    player_name: str
    opponent: str | None = None  # None when showing aggregated view (all matches)
    puesto: int | None = None  # None when showing aggregated view
    tiempo_juego: float | None = None  # None when showing aggregated view
    score_absoluto: float | None = None  # None when showing aggregated view
    puntuacion_final: float
    matches_played: int | None = None  # Only present in aggregated view
