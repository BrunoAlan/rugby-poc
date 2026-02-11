"""Player schemas."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class PlayerBase(BaseModel):
    """Base player schema."""

    name: str


class PlayerCreate(PlayerBase):
    """Schema for creating a player."""

    pass


class Player(PlayerBase):
    """Player response schema."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


class PlayerList(BaseModel):
    """List of players response."""

    items: list[Player]
    total: int


class PlayerMatchDetail(BaseModel):
    """Player match detail for summary."""

    match_id: int
    opponent: str
    team: str
    match_date: str | None = None
    puesto: int
    tiempo_juego: float
    score: float
    # All 16 statistics
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


class PlayerSummary(BaseModel):
    """Player summary across all matches."""

    player_id: int
    player_name: str
    matches_played: int
    total_minutes: float | None = None
    avg_puntuacion_final: float | None = None
    matches: list[PlayerMatchDetail] | None = None


class PlayerWithStats(Player):
    """Player with stats summary for list view."""

    matches_played: int = 0
    avg_score: float = 0.0
    total_score: float = 0.0
    primary_position: int | None = None


class PlayerWithStatsList(BaseModel):
    """List of players with stats."""

    items: list[PlayerWithStats]
    total: int
