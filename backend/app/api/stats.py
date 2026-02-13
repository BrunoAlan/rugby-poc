"""Player statistics API routes."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import PlayerMatchStats as StatsModel
from app.schemas import PlayerMatchStats, PlayerMatchStatsList, PlayerRanking
from app.services.scoring import ScoringService

router = APIRouter()


@router.get("/", response_model=PlayerMatchStatsList)
def list_stats(
    skip: int = 0,
    limit: int = 100,
    player_id: int | None = Query(None, description="Filter by player ID"),
    match_id: int | None = Query(None, description="Filter by match ID"),
    db: Session = Depends(get_db),
):
    """List all player match statistics."""
    query = db.query(StatsModel)
    if player_id:
        query = query.filter(StatsModel.player_id == player_id)
    if match_id:
        query = query.filter(StatsModel.match_id == match_id)
    stats = query.offset(skip).limit(limit).all()
    total = query.count()
    return PlayerMatchStatsList(items=stats, total=total)


@router.get("/rankings", response_model=list[PlayerRanking])
def get_rankings(
    match_id: int | None = Query(None, description="Filter by match ID. If not provided, aggregates by player."),
    opponent: str | None = Query(None, description="Filter by opponent name"),
    team: str | None = Query(None, description="Filter by team"),
    position_type: str | None = Query(
        None, description="Filter by position type: 'forwards' or 'backs'"
    ),
    min_minutes: int | None = Query(
        None, description="Minimum minutes played to appear in rankings. Default: 20 for aggregated view."
    ),
    limit: int = Query(20, ge=1, le=100, description="Number of results"),
    db: Session = Depends(get_db),
):
    """Get player rankings by puntuacion_final."""
    scoring_service = ScoringService(db)
    rankings = scoring_service.get_rankings(
        match_id=match_id,
        opponent=opponent,
        team=team,
        position_type=position_type,
        limit=limit,
        min_minutes=min_minutes,
    )
    return [PlayerRanking(**r) for r in rankings]


@router.get("/{stats_id}", response_model=PlayerMatchStats)
def get_stats(stats_id: int, db: Session = Depends(get_db)):
    """Get specific player match statistics by ID."""
    stats = db.query(StatsModel).filter(StatsModel.id == stats_id).first()
    if stats is None:
        raise HTTPException(status_code=404, detail="Stats not found")
    return stats
