"""Scoring configuration schemas."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ScoringWeightBase(BaseModel):
    """Base scoring weight schema."""

    action_name: str
    forwards_weight: float
    backs_weight: float


class ScoringWeightCreate(ScoringWeightBase):
    """Schema for creating a scoring weight."""

    pass


class ScoringWeight(ScoringWeightBase):
    """Scoring weight response schema."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    config_id: int
    created_at: datetime
    updated_at: datetime


class ScoringConfigurationBase(BaseModel):
    """Base scoring configuration schema."""

    name: str
    description: str | None = None
    is_active: bool = False


class ScoringConfigurationCreate(ScoringConfigurationBase):
    """Schema for creating a scoring configuration."""

    weights: list[ScoringWeightCreate] | None = None


class ScoringConfiguration(ScoringConfigurationBase):
    """Scoring configuration response schema."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


class ScoringConfigurationWithWeights(ScoringConfiguration):
    """Scoring configuration with weights."""

    weights: list[ScoringWeight] = []
