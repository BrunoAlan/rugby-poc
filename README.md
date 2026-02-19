# Rugby Statistics System

A rugby match data analysis application with a FastAPI backend and React frontend. The system imports player performance data from Excel files, calculates position-weighted scores, and provides individual player analytics and AI-powered insights.

## Features

- Import match data from Excel files (Partidos.xlsx format)
- PostgreSQL database for data storage
- Per-position scoring weights (positions 1-15, individually configurable)
- Time-normalized performance metrics (70-minute standard)
- REST API for data access
- CLI for common operations
- Player profile management (name, weight, height) with inline editing
- Player evolution reports with anomaly detection
- AI-powered match and player analysis (via OpenRouter)
- PDF export for match reports and player evolution reports
- React frontend with dark theme, charts, and interactive stats

## Architecture

### Tech Stack
- **Backend**: Python, FastAPI, SQLAlchemy 2.0, PostgreSQL, Alembic, Pydantic, httpx
- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, React Query, React Router, Recharts, Framer Motion
- **Data Processing**: pandas, openpyxl for Excel import
- **PDF Generation**: reportlab
- **AI**: OpenRouter API for match and player analysis

### Data Flow
1. Excel sheets (one per match) → `ExcelImporter` service → PostgreSQL
2. `ScoringService` calculates weighted scores based on player position (1-15, each with individual weights)
3. FastAPI REST endpoints expose data
4. React frontend fetches via Axios with React Query caching

## Quick Start

### Prerequisites

- Python 3.11+
- Docker and Docker Compose
- uv package manager
- pnpm (for frontend)

### Setup

1. Start the database:
```bash
docker compose up -d
```

2. Install dependencies:
```bash
cd backend && uv sync
```

3. Run migrations:
```bash
cd backend && uv run alembic upgrade head
```

4. Import data:
```bash
cd backend && uv run rugby import-excel ../data/Partidos.xlsx
```

5. Start the API server:
```bash
cd backend && uv run uvicorn app.main:app --reload
```

6. Start the frontend:
```bash
cd frontend
pnpm install
pnpm dev
```

7. Open the app:
   - Frontend: http://localhost:3000
   - API docs (Swagger): http://localhost:8000/docs
   - API docs (ReDoc): http://localhost:8000/redoc

## CLI Commands

All CLI commands run from the `backend/` directory:

```bash
cd backend

# Import Excel data (--ai flag to also generate AI analysis)
uv run rugby import-excel ../data/Partidos.xlsx

# Recalculate all scores
uv run rugby recalculate-scores

# Show player rankings (filters: --match, --opponent, --position, --limit)
uv run rugby show-rankings

# Show player performance summary across all matches
uv run rugby player-summary "Player Name"

# List all players in database
uv run rugby list-players

# List all matches in database
uv run rugby list-matches

# Seed default scoring weights (--force to overwrite existing)
uv run rugby seed-weights

# Reset database (drops all tables and re-runs migrations)
uv run rugby reset-db

# Regenerate AI analysis for a specific match
uv run rugby regenerate-analysis <match_id>
```

## Database Access

PostgreSQL connection:
- Host: localhost
- Port: 5432
- Database: rugby_stats
- User: rugby
- Password: rugby123

## Scoring System

Each of the 16 tracked actions (defined in `constants.py` as `STAT_FIELDS`) has an individual weight **per position** (1-15), stored in the `scoring_weights` table. Default weights are defined in `constants.py` as `DEFAULT_SCORING_WEIGHTS`.

**Key constants:**
- `STANDARD_MATCH_DURATION = 70` — match duration for score normalization
- `MIN_MINUTES_FOR_NORMALIZATION = 40` — floor for score calculation (prevents inflation)
- `MIN_MINUTES_FOR_RANKING = 20` — minimum minutes to appear in aggregated rankings

**Formula:**
```
score_absoluto = Σ (stat × weight_for_position)
puntuacion_final = (score_absoluto / max(tiempo_juego, 40)) × 70
```

## Frontend

```bash
cd frontend
pnpm install
pnpm dev        # Start dev server at http://localhost:3000
pnpm build      # TypeScript check + production build
pnpm lint       # ESLint
```

The frontend proxies `/api` requests to the backend via Vite config.

### Pages
- **Dashboard**: Overview with match/player counts, recent matches, and quick import action
- **Match Detail**: Per-match stats, AI analysis, PDF export
- **Player Detail**: Inline-editable profile (name, weight, height), match history, score evolution chart, anomaly alerts, AI evolution analysis, position comparison, PDF export
- **Scoring Weights**: Position-tabbed weight editor (15 tabs, one per position)
- **Import**: Excel file upload with drag-and-drop

## Player Evolution & Anomaly Detection

The player detail page includes:
- **Anomaly alerts**: Detects when a player's last match stats deviate significantly from their historical median (thresholds: 25% for consistent stats, 30% for moderate, 50% for volatile)
- **AI evolution analysis**: On-demand narrative analysis of a player's progression, generated via OpenRouter and cached
- **Position comparison**: Player averages vs their position group (forwards/backs)
- **PDF report**: Downloadable evolution report with trends, comparisons, and AI analysis

## AI Analysis

Match and player analyses are generated via the OpenRouter API:
- **Match analysis**: Generated on import (with `--ai` flag) or on-demand via the API
- **Player evolution**: On-demand analysis cached on the Player model; invalidated when new matches are imported. Uses position-group-specific prompts (7 groups: Pilares, Hooker, 2da Línea, Tercera Línea, Medios, Centros, Back 3) with custom output sections and stat prioritization from active scoring weights
- Background thread processing to avoid blocking requests

## Running Tests

```bash
cd backend && uv run pytest
```
