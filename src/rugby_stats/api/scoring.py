"""Scoring configuration API routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from rugby_stats.database import get_db
from rugby_stats.models import ScoringConfiguration as ConfigModel
from rugby_stats.models import ScoringWeight as WeightModel
from rugby_stats.schemas.scoring import (
    ScoringConfiguration,
    ScoringConfigurationCreate,
    ScoringConfigurationWithWeights,
    WeightUpdate,
    ScoringWeight as WeightSchema,
)
from rugby_stats.services.scoring import ScoringService

router = APIRouter()


@router.get("/configurations", response_model=list[ScoringConfiguration])
def list_configurations(db: Session = Depends(get_db)):
    """List all scoring configurations."""
    configs = db.query(ConfigModel).all()
    return configs


@router.get("/configurations/active", response_model=ScoringConfigurationWithWeights)
def get_active_configuration(db: Session = Depends(get_db)):
    """Get the currently active scoring configuration."""
    scoring_service = ScoringService(db)
    config = scoring_service.get_active_config()
    if config is None:
        raise HTTPException(status_code=404, detail="No active configuration found")
    return config


@router.get("/configurations/{config_id}", response_model=ScoringConfigurationWithWeights)
def get_configuration(config_id: int, db: Session = Depends(get_db)):
    """Get a specific scoring configuration with weights."""
    config = db.query(ConfigModel).filter(ConfigModel.id == config_id).first()
    if config is None:
        raise HTTPException(status_code=404, detail="Configuration not found")
    return config


@router.post("/configurations", response_model=ScoringConfiguration)
def create_configuration(
    config: ScoringConfigurationCreate, db: Session = Depends(get_db)
):
    """Create a new scoring configuration."""
    db_config = ConfigModel(
        name=config.name,
        description=config.description,
        is_active=config.is_active,
    )
    db.add(db_config)
    db.commit()
    db.refresh(db_config)
    return db_config


@router.post("/configurations/{config_id}/activate", response_model=ScoringConfiguration)
def activate_configuration(config_id: int, db: Session = Depends(get_db)):
    """Activate a scoring configuration (deactivates all others)."""
    config = db.query(ConfigModel).filter(ConfigModel.id == config_id).first()
    if config is None:
        raise HTTPException(status_code=404, detail="Configuration not found")

    # Deactivate all configurations
    db.query(ConfigModel).update({ConfigModel.is_active: False})

    # Activate the specified one
    config.is_active = True
    db.commit()
    db.refresh(config)
    return config


@router.post("/seed-defaults", response_model=ScoringConfiguration)
def seed_default_weights(db: Session = Depends(get_db)):
    """Seed the default scoring weights."""
    scoring_service = ScoringService(db)
    config = scoring_service.seed_default_weights()
    return config


@router.put("/weights/{weight_id}", response_model=WeightSchema)
def update_weight(weight_id: int, data: WeightUpdate, db: Session = Depends(get_db)):
    """Update a single scoring weight value."""
    weight = db.query(WeightModel).filter(WeightModel.id == weight_id).first()
    if weight is None:
        raise HTTPException(status_code=404, detail="Weight not found")
    weight.weight = data.weight
    db.commit()
    db.refresh(weight)
    return weight


@router.post("/recalculate")
def recalculate_scores(db: Session = Depends(get_db)):
    """Recalculate all player scores using the active configuration."""
    scoring_service = ScoringService(db)
    try:
        count = scoring_service.recalculate_all_scores()
        return {"message": f"Recalculated scores for {count} player stats"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
