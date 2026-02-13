# Player Profile Fields Design

**Date:** 2026-02-12
**Status:** Approved

## Goal

Add weight and height fields to the Player entity, allow editing player name, weight, and height via inline editing in the PlayerDetail page.

## Decisions

- **Fields:** `weight_kg` (float, nullable) and `height_cm` (float, nullable) on the Player model
- **Units:** Kilograms and centimeters
- **Photo:** Deferred to a future iteration
- **Edit UI:** Inline editing in the PlayerSummaryCard (approach A — no modal, no separate page)
- **Name uniqueness:** If edited name collides with an existing player, show an error (no merge)

## Data Model

Add two nullable columns to the `players` table via Alembic migration:

```
weight_kg: Float | None
height_cm: Float | None
```

Both nullable so existing players created via Excel import remain valid without manual data entry.

## Backend API

### New endpoint: `PUT /api/players/{player_id}`

**Request body** (`PlayerUpdate` schema — partial update):
```
name: str | None
weight_kg: float | None
height_cm: float | None
```

Only provided fields are updated. If `name` conflicts with another player, return 409 Conflict.

**Response:** `Player` schema (extended with `weight_kg`, `height_cm`).

### Schema changes

Extend `Player`, `PlayerWithStats`, and `PlayerSummary` response schemas to include `weight_kg` and `height_cm`.

## Frontend

### PlayerSummaryCard — inline editing

**Read mode (default):**
- Displays name, weight (e.g., "92 kg"), height (e.g., "185 cm") — or "Sin datos" if null
- Edit button (pencil icon) in the card corner

**Edit mode (on click):**
- Name becomes a text input
- Weight and height become numeric inputs with unit suffixes
- "Guardar" and "Cancelar" buttons
- On save: calls `PUT /api/players/{id}`, returns to read mode
- On name conflict: inline error message
- React Query cache invalidation on success

### Players list (Players.tsx)

No changes — stays focused on search and filtering.
