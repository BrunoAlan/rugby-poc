"""Player API routes."""

from threading import Thread

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from rugby_stats.constants import get_position_label
from rugby_stats.database import get_db
from rugby_stats.models import Player as PlayerModel
from rugby_stats.schemas import (
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
)
from rugby_stats.services.anomaly_detection import AnomalyDetectionService
from rugby_stats.services.background_tasks import generate_player_evolution_background
from rugby_stats.services.scoring import ScoringService

router = APIRouter()


@router.get("/", response_model=PlayerList)
def list_players(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """List all players."""
    players = db.query(PlayerModel).offset(skip).limit(limit).all()
    total = db.query(PlayerModel).count()
    return PlayerList(items=players, total=total)


@router.get("/with-stats", response_model=PlayerWithStatsList)
def list_players_with_stats(
    skip: int = 0, limit: int = 100, db: Session = Depends(get_db)
):
    """List all players with their stats summary."""
    scoring_service = ScoringService(db)
    items, total = scoring_service.get_players_with_stats(skip=skip, limit=limit)
    return PlayerWithStatsList(
        items=[PlayerWithStats(**item) for item in items],
        total=total,
    )


@router.get("/{player_id}", response_model=Player)
def get_player(player_id: int, db: Session = Depends(get_db)):
    """Get a specific player by ID."""
    player = db.query(PlayerModel).filter(PlayerModel.id == player_id).first()
    if player is None:
        raise HTTPException(status_code=404, detail="Player not found")
    return player


@router.get("/name/{player_name}/summary", response_model=PlayerSummary)
def get_player_summary(player_name: str, db: Session = Depends(get_db)):
    """Get a player's performance summary across all matches."""
    scoring_service = ScoringService(db)
    summary = scoring_service.get_player_summary(player_name)
    if summary is None:
        raise HTTPException(status_code=404, detail="Player not found")
    return PlayerSummary(**summary)


@router.get("/{player_id}/anomalies", response_model=PlayerAnomalies)
def get_player_anomalies(
    player_id: int,
    mode: str = "all",
    db: Session = Depends(get_db),
):
    """Get anomaly detection results for a player's last match."""
    player = db.query(PlayerModel).filter(PlayerModel.id == player_id).first()
    if player is None:
        raise HTTPException(status_code=404, detail="Player not found")

    service = AnomalyDetectionService(db)
    anomalies = service.detect_anomalies(player_id, mode=mode)

    return PlayerAnomalies(
        player_id=player.id,
        player_name=player.name,
        anomalies=anomalies,
    )


@router.get("/{player_id}/position-comparison", response_model=PositionComparison)
def get_position_comparison(
    player_id: int,
    db: Session = Depends(get_db),
):
    """Compare player averages vs their position group averages."""
    player = db.query(PlayerModel).filter(PlayerModel.id == player_id).first()
    if player is None:
        raise HTTPException(status_code=404, detail="Player not found")

    if not player.match_stats:
        raise HTTPException(status_code=404, detail="No stats found for player")

    try:
        scoring_service = ScoringService(db)
        comparison = scoring_service.get_position_comparison(player_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    return PositionComparison(
        player_id=comparison["player_id"],
        player_name=comparison["player_name"],
        position_group=get_position_label(comparison["position_group"]),
        stats=comparison["stats"],
    )


@router.get("/{player_id}/evolution-analysis", response_model=PlayerEvolutionAnalysis)
def get_evolution_analysis(
    player_id: int,
    db: Session = Depends(get_db),
):
    """Get cached evolution analysis for a player."""
    player = db.query(PlayerModel).filter(PlayerModel.id == player_id).first()
    if player is None:
        raise HTTPException(status_code=404, detail="Player not found")

    current_match_count = len(player.match_stats)
    is_stale = (
        player.ai_evolution_match_count is not None
        and player.ai_evolution_match_count != current_match_count
    )

    return PlayerEvolutionAnalysis(
        player_id=player.id,
        player_name=player.name,
        status=player.ai_evolution_analysis_status,
        analysis=player.ai_evolution_analysis,
        error=player.ai_evolution_analysis_error,
        generated_at=player.ai_evolution_generated_at,
        match_count=player.ai_evolution_match_count,
        is_stale=is_stale,
    )


@router.post("/{player_id}/evolution-analysis", response_model=PlayerEvolutionAnalysis)
def trigger_evolution_analysis(
    player_id: int,
    db: Session = Depends(get_db),
):
    """Trigger generation of evolution analysis in background."""
    player = db.query(PlayerModel).filter(PlayerModel.id == player_id).first()
    if player is None:
        raise HTTPException(status_code=404, detail="Player not found")

    if not player.match_stats:
        raise HTTPException(status_code=400, detail="Player has no match stats")

    player.ai_evolution_analysis_status = "processing"
    db.commit()

    thread = Thread(target=generate_player_evolution_background, args=(player_id,))
    thread.start()

    return PlayerEvolutionAnalysis(
        player_id=player.id,
        player_name=player.name,
        status="processing",
    )


@router.put("/{player_id}", response_model=Player)
def update_player(player_id: int, player_data: PlayerUpdate, db: Session = Depends(get_db)):
    """Update a player's profile fields."""
    player = db.query(PlayerModel).filter(PlayerModel.id == player_id).first()
    if player is None:
        raise HTTPException(status_code=404, detail="Player not found")

    update_dict = player_data.model_dump(exclude_unset=True)

    if "name" in update_dict and update_dict["name"] != player.name:
        existing = db.query(PlayerModel).filter(
            PlayerModel.name == update_dict["name"],
            PlayerModel.id != player_id,
        ).first()
        if existing:
            raise HTTPException(status_code=409, detail="A player with this name already exists")

    for key, value in update_dict.items():
        setattr(player, key, value)

    db.commit()
    db.refresh(player)
    return player


@router.post("/", response_model=Player)
def create_player(player: PlayerCreate, db: Session = Depends(get_db)):
    """Create a new player."""
    db_player = PlayerModel(**player.model_dump())
    db.add(db_player)
    db.commit()
    db.refresh(db_player)
    return db_player


@router.delete("/{player_id}")
def delete_player(player_id: int, db: Session = Depends(get_db)):
    """Delete a player."""
    player = db.query(PlayerModel).filter(PlayerModel.id == player_id).first()
    if player is None:
        raise HTTPException(status_code=404, detail="Player not found")
    db.delete(player)
    db.commit()
    return {"message": "Player deleted"}
