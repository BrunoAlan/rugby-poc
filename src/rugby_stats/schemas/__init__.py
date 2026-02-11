"""Pydantic schemas for API validation."""

from rugby_stats.schemas.player import (
    Player,
    PlayerAnomalies,
    PlayerCreate,
    PlayerEvolutionAnalysis,
    PlayerList,
    PlayerSummary,
    PlayerWithStats,
    PlayerWithStatsList,
    PositionComparison,
    StatAnomaly,
)
from rugby_stats.schemas.match import Match, MatchCreate, MatchList
from rugby_stats.schemas.player_stats import (
    PlayerMatchStats,
    PlayerMatchStatsCreate,
    PlayerMatchStatsList,
    PlayerRanking,
)
from rugby_stats.schemas.scoring import (
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
