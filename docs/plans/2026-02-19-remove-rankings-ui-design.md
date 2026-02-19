# Remove Rankings from Frontend

## Problem

Player rankings create friction within the team by comparing players against each other. The comparison features that add value are individual evolution (player vs themselves) and position group averages — not inter-player rankings.

## Decision

Remove all ranking UI from the frontend. Keep the backend endpoints intact for internal/future use.

## Scope

Frontend only. Backend untouched.

## Changes

### Delete
- `frontend/src/pages/Rankings.tsx`

### Modify
- **`App.tsx`** — remove `/rankings` route
- **`Sidebar.tsx`** — remove "Rankings" navigation link
- **`Dashboard.tsx`**:
  - Remove `useRankings`, `RankingsTable`, `Trophy`, `TrendingUp` imports
  - Remove "Top Score" and "Mejor Jugador" stat cards
  - Remove "Top 5 Rankings" section
  - Make "Partidos Recientes" full width (remove 2-column grid)

### Keep (no changes)
- `RankingsTable.tsx` — used by `MatchDetail`
- `useRankings.ts` — used by `MatchDetail` and other hooks
- `PlayerCompare` page — maintained
- All backend endpoints and services

## Result

- Dashboard: 2 stat cards (Total Partidos, Total Jugadores) + Partidos Recientes (full width) + CTA importar
- Navigation without "Rankings" link
- Everything else unchanged
