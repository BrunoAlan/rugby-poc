#!/bin/sh
set -e

echo "Running database migrations..."
uv run alembic upgrade head

echo "Seeding default weights..."
uv run rugby seed-weights

echo "Starting server..."
exec uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
