# Rugby Statistics System

A Python application for importing and analyzing rugby match statistics from Excel files.

## Features

- Import match data from Excel files (Partidos.xlsx format)
- PostgreSQL database for data storage
- Position-based scoring calculation (forwards vs backs)
- Time-normalized performance metrics
- REST API for data access
- CLI for common operations

## Quick Start

### Prerequisites

- Python 3.11+
- Docker and Docker Compose
- uv package manager

### Setup

1. Start the database:
```bash
docker compose up -d
```

2. Install dependencies:
```bash
uv sync
```

3. Run migrations:
```bash
uv run alembic upgrade head
```

4. Import data:
```bash
uv run rugby import-excel data/Partidos.xlsx
```

5. Start the API server:
```bash
uv run uvicorn rugby_stats.main:app --reload
```

### API Documentation

Once the server is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## CLI Commands

```bash
# Import Excel data
uv run rugby import-excel data/Partidos.xlsx

# Recalculate all scores
uv run rugby recalculate-scores

# Show player rankings
uv run rugby show-rankings

# Show rankings for forwards only
uv run rugby show-rankings --position forwards

# Show rankings for a specific team
uv run rugby show-rankings --team BARC

# List all teams
uv run rugby list-teams

# Seed default scoring weights
uv run rugby seed-weights
```

## Database Access

pgAdmin is available at http://localhost:5050
- Email: admin@rugby.local
- Password: admin123

PostgreSQL connection:
- Host: localhost
- Port: 5432
- Database: rugby_stats
- User: rugby
- Password: rugby123

## Scoring System

Players are scored based on their position:
- **Forwards (positions 1-8)**: Higher weights for physical stats like tackles, rucks
- **Backs (positions 9-15)**: Higher weights for attacking stats like passes, breaks, tries

Scores are normalized to 80 minutes to allow fair comparison between players with different playing times.

## Running Tests

```bash
uv run pytest
```
