# Deployment Guide

## Prerequisites

- Docker and Docker Compose installed
- Git

## Quick Start (Mac / Any Machine)

```bash
git checkout ngrok

# Create .env from template
cp .env.example .env
# Edit .env with your values (especially OPENROUTER_API_KEY if you want AI analysis)

# Build and start all services
docker compose -f docker-compose.prod.yml up --build -d

# Wait for services to start, then access:
# Frontend: http://localhost:3000
# API docs: http://localhost:8000/docs
```

### Import Data

```bash
# Place your Excel file in the data/ directory, then:
docker compose -f docker-compose.prod.yml exec backend uv run rugby import-excel /data/Partidos.xlsx
```

### Useful Commands

```bash
# View logs
docker compose -f docker-compose.prod.yml logs -f

# Stop services
docker compose -f docker-compose.prod.yml down

# Stop and remove volumes (deletes database)
docker compose -f docker-compose.prod.yml down -v

# Rebuild after code changes
docker compose -f docker-compose.prod.yml up --build -d
```

## Raspberry Pi Deployment

### 1. Install Docker on Raspberry Pi OS (64-bit)

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Log out and back in for group change to take effect
```

### 2. Clone and Configure

```bash
git clone <your-repo-url> rugby-poc
cd rugby-poc
git checkout ngrok
cp .env.example .env
# Edit .env as needed
```

### 3. Build and Run

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

The first build will take several minutes on a Pi. Subsequent starts are fast.

All base images (`python:3.11-slim`, `node:20-alpine`, `nginx:alpine`, `postgres:16-alpine`) support ARM64 natively.

### 4. Access

From any device on the same network:
- `http://<pi-ip-address>:3000` — Frontend
- `http://<pi-ip-address>:8000/docs` — API docs

Find the Pi's IP with: `hostname -I`

### Performance Tips

- Use a Raspberry Pi 4 (4GB+) or Pi 5 for best results
- Use a fast SD card (A2 rated) or USB SSD for storage
- The first build is slow; subsequent starts use cached layers
- PostgreSQL benefits from SSD storage over SD cards
