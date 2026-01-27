# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rugby POC - A rugby match data analysis application with a FastAPI backend and React frontend. The system imports player performance data from Excel files, calculates position-weighted scores, and provides rankings and analytics.

## Commands

### Backend (Python with uv)
```bash
uv sync                                          # Install dependencies
uv run pytest                                    # Run tests
uv run pytest tests/test_scoring.py -v          # Run specific test file
uv run alembic upgrade head                     # Apply database migrations
uv run uvicorn rugby_stats.main:app --reload    # Start API server (port 8000)
```

### CLI Commands
```bash
uv run rugby import-excel data/Partidos.xlsx    # Import Excel data
uv run rugby recalculate-scores                 # Recalculate all player scores
uv run rugby seed-weights                       # Seed default scoring weights
uv run rugby show-rankings                      # Display rankings in terminal
```

### Frontend (pnpm)
```bash
cd frontend
pnpm dev                                         # Start dev server (port 3000)
pnpm build                                       # TypeScript check + Vite build
pnpm lint                                        # ESLint
```

### Docker
```bash
docker compose up -d                             # Start PostgreSQL
```

## Architecture

### Tech Stack
- **Backend**: FastAPI, SQLAlchemy 2.0, PostgreSQL, Alembic, Pydantic
- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, React Query, React Router
- **Data Processing**: pandas, openpyxl for Excel import
- **PDF Generation**: reportlab for match report exports

### Data Flow
1. Excel sheets (one per match) → `ExcelImporter` service → PostgreSQL
2. `ScoringService` calculates weighted scores based on player position (forwards 1-8 vs backs 9-15)
3. FastAPI REST endpoints expose data
4. React frontend fetches via Axios with React Query caching

### Backend Structure (`src/rugby_stats/`)
```
models/          # SQLAlchemy ORM models
api/             # FastAPI route handlers
services/        # Business logic (importer.py, scoring.py, pdf_generator.py)
schemas/         # Pydantic request/response models
cli/             # Typer CLI commands
```

### Frontend Structure (`frontend/src/`)
```
api/             # Axios API client modules
hooks/           # React Query hooks (usePlayers, useRankings, etc.)
types/           # TypeScript interfaces
components/      # UI components by domain (players/, stats/, scoring/)
pages/           # Route-level page components
```

### Key Models
- **Player**: name (unique)
- **Match**: opponent_name, match_date, scores
- **PlayerMatchStats**: 16 statistics fields + calculated scores (score_absoluto, puntuacion_final)
- **ScoringConfiguration/Weight**: position-based multipliers for score calculation

### API Endpoints
- `GET /api/players/with-stats` - Players with aggregated stats
- `GET /api/players/name/{name}/summary` - Detailed player match history
- `GET /api/stats/rankings?match_id=X` - Rankings (aggregated if no match_id)
- `GET /api/matches/` - Match list
- `POST /api/imports/excel` - Upload Excel file
- `GET /api/exports/matches/{match_id}/pdf` - Download match report as PDF

## Database

PostgreSQL 16 via Docker:
- Host: localhost:5432
- Credentials: rugby / rugby123
- Database: rugby_stats

## Development Workflow

1. `docker compose up -d`
2. `uv run alembic upgrade head`
3. `uv run rugby import-excel data/Partidos.xlsx`
4. `uv run uvicorn rugby_stats.main:app --reload`
5. `cd frontend && pnpm dev`
6. Frontend: http://localhost:3000 | API docs: http://localhost:8000/docs

## Important Notes

- Frontend proxies `/api` requests to backend via Vite config
- Rankings endpoint aggregates by player when no match_id filter, returns per-match stats when filtered
- PlayerMatchStats has 16 stat fields from Excel: tackles_positivos, tackles, tackles_errados, portador, ruck_ofensivos, pases, pases_malos, perdidas, recuperaciones, gana_contacto, quiebres, penales, juego_pie, recepcion_aire_buena, recepcion_aire_mala, try_

## Scoring System

See [docs/SCORING.md](docs/SCORING.md) for detailed documentation.

**Key constants:**
- `STANDARD_MATCH_DURATION = 80` - Standard rugby match in minutes
- `MIN_MINUTES_FOR_NORMALIZATION = 40` - Floor for score calculation (prevents inflation)
- `MIN_MINUTES_FOR_RANKING = 20` - Minimum minutes to appear in aggregated rankings

**Formula:**
```
score_absoluto = Σ (stat × weight)
puntuacion_final = (score_absoluto / max(tiempo_juego, 40)) × 80
```

## PDF Export

Match reports can be downloaded as PDF from the match detail page. The report includes:
- Match header (team, opponent, date, result)
- AI analysis (parsed from markdown)
- Player rankings table with scores and minutes played

**Implementation:**
- Backend: `PDFGeneratorService` in `services/pdf_generator.py` uses reportlab
- Frontend: `PDFDownloadButton` component triggers download via `/api/exports/matches/{id}/pdf`
