"""Match API routes."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from rugby_stats.database import get_db
from rugby_stats.models import Match as MatchModel
from rugby_stats.schemas import Match, MatchCreate, MatchList

router = APIRouter()


@router.get("/teams", response_model=list[str])
def list_teams(db: Session = Depends(get_db)):
    """Lista todos los equipos únicos."""
    teams = (
        db.query(MatchModel.team).filter(MatchModel.team.isnot(None)).distinct().all()
    )
    return sorted([t[0] for t in teams])


@router.get("/", response_model=MatchList)
def list_matches(
    skip: int = 0,
    limit: int = 100,
    opponent: str | None = Query(None, description="Filter by opponent name"),
    team: str | None = Query(None, description="Filter by team"),
    db: Session = Depends(get_db),
):
    """List all matches, optionally filtered by opponent or team."""
    query = db.query(MatchModel)
    if opponent:
        query = query.filter(MatchModel.opponent_name == opponent)
    if team:
        query = query.filter(MatchModel.team == team)
    matches = query.offset(skip).limit(limit).all()
    total = query.count()
    return MatchList(items=matches, total=total)


@router.get("/{match_id}", response_model=Match)
def get_match(match_id: int, db: Session = Depends(get_db)):
    """Get a specific match by ID."""
    match = db.query(MatchModel).filter(MatchModel.id == match_id).first()
    if match is None:
        raise HTTPException(status_code=404, detail="Match not found")
    return match


@router.post("/", response_model=Match)
def create_match(match: MatchCreate, db: Session = Depends(get_db)):
    """Create a new match."""
    db_match = MatchModel(**match.model_dump())
    db.add(db_match)
    db.commit()
    db.refresh(db_match)
    return db_match


@router.delete("/{match_id}")
def delete_match(match_id: int, db: Session = Depends(get_db)):
    """Delete a match."""
    match = db.query(MatchModel).filter(MatchModel.id == match_id).first()
    if match is None:
        raise HTTPException(status_code=404, detail="Match not found")
    db.delete(match)
    db.commit()
    return {"message": "Match deleted"}
