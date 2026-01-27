"""Player API routes."""

from collections import Counter

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from rugby_stats.database import get_db
from rugby_stats.models import Player as PlayerModel
from rugby_stats.schemas import (
    Player,
    PlayerCreate,
    PlayerList,
    PlayerSummary,
    PlayerWithStats,
    PlayerWithStatsList,
)
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
    players = db.query(PlayerModel).offset(skip).limit(limit).all()
    total = db.query(PlayerModel).count()

    items = []
    for player in players:
        stats_list = player.match_stats
        matches_played = len(stats_list)
        total_score = sum(s.puntuacion_final or 0 for s in stats_list)
        avg_score = total_score / matches_played if matches_played > 0 else 0

        # Calculate most frequent position
        primary_position = None
        if stats_list:
            positions = [s.puesto for s in stats_list if s.puesto is not None]
            if positions:
                primary_position = Counter(positions).most_common(1)[0][0]

        items.append(
            PlayerWithStats(
                id=player.id,
                name=player.name,
                created_at=player.created_at,
                updated_at=player.updated_at,
                matches_played=matches_played,
                avg_score=round(avg_score, 1),
                total_score=round(total_score, 1),
                primary_position=primary_position,
            )
        )

    return PlayerWithStatsList(items=items, total=total)


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
