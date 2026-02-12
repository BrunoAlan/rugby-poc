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
uv run rugby import-excel data/Partidos.xlsx    # Import Excel data (--ai flag to generate AI analysis)
uv run rugby recalculate-scores                 # Recalculate all player scores
uv run rugby seed-weights                       # Seed default scoring weights (--force to overwrite)
uv run rugby show-rankings                      # Display rankings in terminal (--match, --opponent, --position, --limit)
uv run rugby player-summary "Player Name"       # Show player performance summary across all matches
uv run rugby list-players                       # List all players in database
uv run rugby list-matches                       # List all matches in database
uv run rugby reset-db                           # Reset database (drop tables + re-migrate, --force to skip prompt)
uv run rugby regenerate-analysis <match_id>     # Regenerate AI analysis for a specific match
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
- **Backend**: FastAPI, SQLAlchemy 2.0, PostgreSQL, Alembic, Pydantic, httpx
- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, React Query, React Router, Recharts, Framer Motion, React Markdown, Lucide React, React Dropzone
- **Data Processing**: pandas, openpyxl for Excel import
- **PDF Generation**: reportlab for match report exports
- **AI**: OpenRouter API via httpx for match and player analysis

### Data Flow
1. Excel sheets (one per match) → `ExcelImporter` service → PostgreSQL
2. `ScoringService` calculates weighted scores based on player position (1-15, each with individual weights)
3. FastAPI REST endpoints expose data
4. React frontend fetches via Axios with React Query caching

### Backend Structure (`src/rugby_stats/`)
```
models/          # SQLAlchemy ORM models
api/             # FastAPI route handlers
services/        # Business logic (importer.py, scoring.py, pdf_generator.py, anomaly_detection.py, ai_analysis.py, background_tasks.py)
schemas/         # Pydantic request/response models
cli/             # Typer CLI commands
config.py        # Configuration settings (pydantic-settings)
constants.py     # Application constants
database.py      # Database connection and session management
main.py          # FastAPI application entry point
```

### Frontend Structure (`frontend/src/`)
```
api/             # Axios API client modules
hooks/           # React Query hooks (usePlayers, useRankings, etc.)
types/           # TypeScript interfaces
components/      # UI components by domain (players/, stats/, scoring/)
pages/           # Route-level page components
constants/       # Application constants
config/          # Configuration files
```

### Key Models
- **Player**: name (unique), AI evolution analysis fields (cached)
- **Match**: opponent_name, match_date, scores, AI analysis fields (cached)
- **PlayerMatchStats**: 16 statistics fields + calculated scores (score_absoluto, puntuacion_final)
- **ScoringConfiguration/Weight**: position-based multipliers for score calculation

### API Endpoints

**Players** (`/api/players`):
- `GET /` - List all players (pagination: skip, limit)
- `GET /with-stats` - Players with aggregated stats
- `GET /{id}` - Get specific player
- `GET /name/{name}/summary` - Detailed player match history
- `GET /{id}/anomalies?mode=all|recent` - Anomaly detection for last match
- `GET /{id}/position-comparison` - Player vs position group averages
- `GET /{id}/evolution-analysis` - Cached AI evolution analysis
- `POST /{id}/evolution-analysis` - Trigger AI evolution analysis generation
- `POST /` - Create new player
- `DELETE /{id}` - Delete player

**Stats** (`/api/stats`):
- `GET /` - List player match statistics (filters: player_id, match_id)
- `GET /rankings` - Rankings (filters: match_id, opponent, team, position_type; min_minutes)
- `GET /{id}` - Get specific player match stats

**Matches** (`/api/matches`):
- `GET /teams` - List all unique teams
- `GET /` - List all matches (filters: opponent, team)
- `GET /{id}` - Get specific match
- `POST /` - Create new match
- `DELETE /{id}` - Delete match

**Imports** (`/api/imports`):
- `POST /upload` - Upload Excel file and import match data (body: file, generate_ai: bool)
- `GET /template` - Download Excel import template

**Exports** (`/api/exports`):
- `GET /matches/{id}/pdf` - Download match report as PDF
- `GET /players/{id}/report` - Download player evolution report as PDF

**Scoring** (`/api/scoring`):
- `GET /configurations` - List all scoring configurations
- `GET /configurations/active` - Get active configuration with weights
- `GET /configurations/{id}` - Get specific configuration with weights
- `POST /configurations` - Create new scoring configuration
- `POST /configurations/{id}/activate` - Activate configuration (deactivates others)
- `POST /seed-defaults` - Seed default scoring weights
- `PUT /weights/{id}` - Update single weight value
- `POST /recalculate` - Recalculate all player scores

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

Weights are assigned **per position** (1-15). Each of the 16 actions has an individual weight for each position, stored in the `scoring_weights` table as one row per `(config_id, action_name, position)`. Default weights: positions 1-8 (forwards) and 9-15 (backs) start with different base values — see `DEFAULT_SCORING_WEIGHTS` in `models/scoring_config.py`.

**Key constants:**
- `STANDARD_MATCH_DURATION = 70` - Match duration for score normalization
- `MIN_MINUTES_FOR_NORMALIZATION = 40` - Floor for score calculation (prevents inflation)
- `MIN_MINUTES_FOR_RANKING = 20` - Minimum minutes to appear in aggregated rankings

**Formula:**
```
score_absoluto = Σ (stat × weight_for_position)
puntuacion_final = (score_absoluto / max(tiempo_juego, 40)) × 70
```

**Weight management:** `PUT /api/scoring/weights/{id}` updates a single weight. Frontend uses position tabs (15 tabs) to edit weights per position.

## PDF Export

Match reports can be downloaded as PDF from the match detail page. The report includes:
- Match header (team, opponent, date, result)
- AI analysis (parsed from markdown)
- Player rankings table with scores and minutes played

**Implementation:**
- Backend: `PDFGeneratorService` in `services/pdf_generator.py` uses reportlab
- Frontend: `PDFDownloadButton` component triggers download via `/api/exports/matches/{id}/pdf`

## Player Evolution & Anomaly Detection

Player detail page shows evolution analysis and anomaly alerts:
- **Anomaly Detection**: `AnomalyDetectionService` compares each stat in the last match against the player's historical median. Stats grouped by volatility (25%/30%/50% thresholds). Negative stats (tackles_errados, pases_malos, etc.) have inverted alert logic.
- **AI Evolution Analysis**: On-demand analysis via OpenRouter, cached on Player model. Invalidated when new matches are imported (compares `ai_evolution_match_count` vs actual match count). Generated in background thread. Uses **position-group-specific prompts** — 7 groups (Pilares, Hooker, 2da Línea, Tercera Línea, Medios, Centros, Back 3) defined in `constants.py` (`POSITION_GROUPS`), each with custom system prompt (role description + group-specific output sections) and stat prioritization derived from active `ScoringConfiguration` weights.
- **Position Comparison**: Compares player averages against their position group averages (all positions in the group, e.g., pilares 1+3).
- **Player PDF Report**: Exportable report with score evolution table, stats trends with alert highlighting, position comparison, and AI analysis.

**Frontend components:**
- `PlayerAlertsCard` — anomaly alerts with all/recent toggle
- `PlayerEvolutionCard` — AI analysis with status states and polling
- Trend indicators (arrows) in match history expanded rows
