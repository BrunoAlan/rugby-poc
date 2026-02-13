"""Pydantic schemas for API validation."""

from app.schemas.player import (
    Player,
    PlayerAnomalies,
    PlayerCreate,
    PlayerEvolutionAnalysis,
    PlayerList,
    PlayerSummary,
    PlayerUpdate,
    PlayerWithStats,
    PlayerWithStatsList,
    PositionComparison,
    StatAnomaly,
)
from app.schemas.match import Match, MatchCreate, MatchList
from app.schemas.player_stats import (
    PlayerMatchStats,
    PlayerMatchStatsCreate,
    PlayerMatchStatsList,
    PlayerRanking,
)
from app.schemas.scoring import (
    ScoringConfiguration,
    ScoringConfigurationCreate,
    ScoringWeight,
    ScoringWeightCreate,
)

__all__ = [
    "Player",
    "PlayerAnomalies",
    "PlayerCreate",
    "PlayerEvolutionAnalysis",
    "PlayerList",
    "PlayerSummary",
    "PlayerUpdate",
    "PlayerWithStats",
    "PlayerWithStatsList",
    "PositionComparison",
    "StatAnomaly",
    "Match",
    "MatchCreate",
    "MatchList",
    "PlayerMatchStats",
    "PlayerMatchStatsCreate",
    "PlayerMatchStatsList",
    "PlayerRanking",
    "ScoringConfiguration",
    "ScoringConfigurationCreate",
    "ScoringWeight",
    "ScoringWeightCreate",
]
