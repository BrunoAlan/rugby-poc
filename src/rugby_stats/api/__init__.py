"""API routes."""

from fastapi import APIRouter

from rugby_stats.api import players, matches, stats, scoring, imports, exports

api_router = APIRouter()

api_router.include_router(players.router, prefix="/players", tags=["players"])
api_router.include_router(matches.router, prefix="/matches", tags=["matches"])
api_router.include_router(stats.router, prefix="/stats", tags=["stats"])
api_router.include_router(scoring.router, prefix="/scoring", tags=["scoring"])
api_router.include_router(imports.router)
api_router.include_router(exports.router, prefix="/exports", tags=["exports"])
