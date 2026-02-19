# Remove Rankings UI — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove all player ranking displays from the frontend to avoid inter-player comparisons that create team friction.

**Architecture:** Delete the Rankings page, remove its route and nav link, strip ranking-related content from the Dashboard. Backend stays untouched.

**Tech Stack:** React, TypeScript, React Router, Lucide icons, Framer Motion

---

### Task 1: Remove Rankings route and import from App.tsx

**Files:**
- Modify: `frontend/src/App.tsx:10,27`

**Step 1: Remove Rankings import and route**

Remove line 10 (`import Rankings`) and line 27 (`<Route path="/rankings"...>`).

Result should be:

```tsx
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Matches from './pages/Matches'
import MatchDetail from './pages/MatchDetail'
import Players from './pages/Players'
import PlayerDetail from './pages/PlayerDetail'
import PlayerCompare from './pages/PlayerCompare'
import Upload from './pages/Upload'
import ScoringConfig from './pages/ScoringConfig'

function App() {
  const location = useLocation()

  return (
    <Layout>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/matches/:id" element={<MatchDetail />} />
          <Route path="/players" element={<Players />} />
          <Route path="/players/compare" element={<PlayerCompare />} />
          <Route path="/players/:name" element={<PlayerDetail />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/scoring" element={<ScoringConfig />} />
        </Routes>
      </AnimatePresence>
    </Layout>
  )
}

export default App
```

**Step 2: Verify build**

Run: `cd frontend && pnpm build`
Expected: Build succeeds (Rankings page is no longer referenced)

**Step 3: Commit**

```bash
git add frontend/src/App.tsx
git commit -m "feat: remove rankings route from app router"
```

---

### Task 2: Remove Rankings link from Sidebar

**Files:**
- Modify: `frontend/src/components/layout/Sidebar.tsx:5,22`

**Step 1: Remove Trophy import and Rankings nav entry**

Remove `Trophy` from the lucide-react import (line 5) and remove the Rankings entry from the `navigation` array (line 22).

```tsx
import {
  LayoutDashboard,
  Users,
  Calendar,
  Upload,
  Settings,
  X,
} from 'lucide-react'
```

```tsx
const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Partidos', href: '/matches', icon: Calendar },
  { name: 'Jugadores', href: '/players', icon: Users },
  { name: 'Subir Excel', href: '/upload', icon: Upload },
  { name: 'Configuración', href: '/scoring', icon: Settings },
]
```

**Step 2: Verify build**

Run: `cd frontend && pnpm build`
Expected: PASS

**Step 3: Commit**

```bash
git add frontend/src/components/layout/Sidebar.tsx
git commit -m "feat: remove rankings link from sidebar navigation"
```

---

### Task 3: Strip rankings from Dashboard

**Files:**
- Modify: `frontend/src/pages/Dashboard.tsx`

**Step 1: Clean up imports**

Remove these imports/references:
- `Trophy`, `TrendingUp` from lucide-react (line 2)
- `useRankings` (line 5)
- `RankingsTable` (line 7)

Keep: `Calendar`, `Users`, `ArrowRight`, `Upload` from lucide-react.

**Step 2: Remove rankings data fetch**

Remove line 15: `const { data: rankings, isLoading: rankingsLoading } = useRankings({ limit: 5 })`

**Step 3: Remove "Top Score" and "Mejor Jugador" stat cards**

Remove the last two objects from the `stats` array (the ones using `rankings?.[0]`). Keep only "Total Partidos" and "Total Jugadores".

**Step 4: Replace 2-column grid with full-width Partidos Recientes**

Replace the `<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">` section. Remove the Top 5 Rankings AnimatedCard entirely. Make Partidos Recientes standalone (no grid wrapper needed).

Final Dashboard.tsx:

```tsx
import { Link } from 'react-router-dom'
import { Calendar, Users, ArrowRight, Upload } from 'lucide-react'
import { useMatches } from '../hooks/useMatches'
import { usePlayers } from '../hooks/usePlayers'
import StatsSummary from '../components/stats/StatsSummary'
import MatchCard from '../components/matches/MatchCard'
import AnimatedPage from '../components/ui/AnimatedPage'
import AnimatedCard from '../components/ui/AnimatedCard'

export default function Dashboard() {
  const { data: matches, isLoading: matchesLoading } = useMatches()
  const { data: players, isLoading: playersLoading } = usePlayers()

  const recentMatches = matches?.slice(0, 3) || []
  const totalMatches = matches?.length || 0
  const totalPlayers = players?.length || 0

  const stats = [
    {
      label: 'Total Partidos',
      value: totalMatches,
      icon: <Calendar className="h-5 w-5" />,
      color: 'border-primary-500',
      iconBg: 'from-primary-500/20 to-primary-600/10',
    },
    {
      label: 'Total Jugadores',
      value: totalPlayers,
      icon: <Users className="h-5 w-5" />,
      color: 'border-primary-500',
      iconBg: 'from-primary-500/20 to-primary-600/10',
    },
  ]

  return (
    <AnimatedPage className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-4xl font-black text-white">Dashboard</h1>
        <p className="mt-1 text-dark-300">
          Resumen general de estadísticas de rugby
        </p>
      </div>

      {/* Stats Summary */}
      <StatsSummary stats={stats} loading={matchesLoading || playersLoading} />

      {/* Recent Matches */}
      <AnimatedCard index={0} className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Partidos Recientes</h2>
          <Link
            to="/matches"
            className="text-sm font-medium text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors"
          >
            Ver todos
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {matchesLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 rounded-lg skeleton h-20" />
            ))}
          </div>
        ) : recentMatches.length === 0 ? (
          <div className="text-center py-8 text-dark-400">
            No hay partidos registrados
          </div>
        ) : (
          <div className="space-y-3">
            {recentMatches.map((match) => (
              <div key={match.id} className="p-0">
                <MatchCard match={match} />
              </div>
            ))}
          </div>
        )}
      </AnimatedCard>

      {/* Quick Actions - CTA Banner */}
      <AnimatedCard index={1}>
        <div className="card bg-gradient-to-r from-primary-700/80 to-primary-600/60 border-primary-600/50 relative overflow-hidden">
          {/* Diagonal stripe pattern */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)',
          }} />
          <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
                <Upload className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Importar nuevos datos
                </h2>
                <p className="text-primary-100/80 text-sm mt-1">
                  Sube un archivo Excel para agregar partidos y estadísticas
                </p>
              </div>
            </div>
            <Link to="/upload" className="btn bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 border border-white/20">
              Subir Excel
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </AnimatedCard>
    </AnimatedPage>
  )
}
```

**Step 5: Verify build**

Run: `cd frontend && pnpm build`
Expected: PASS

**Step 6: Commit**

```bash
git add frontend/src/pages/Dashboard.tsx
git commit -m "feat: remove rankings section and cards from dashboard"
```

---

### Task 4: Delete Rankings page file

**Files:**
- Delete: `frontend/src/pages/Rankings.tsx`

**Step 1: Delete file**

```bash
rm frontend/src/pages/Rankings.tsx
```

**Step 2: Verify build**

Run: `cd frontend && pnpm build`
Expected: PASS — no remaining references to Rankings page

**Step 3: Commit**

```bash
git add frontend/src/pages/Rankings.tsx
git commit -m "feat: delete rankings page component"
```

---

### Task 5: Final verification

**Step 1: Full build + lint**

Run: `cd frontend && pnpm build && pnpm lint`
Expected: Both pass with no errors

**Step 2: Manual check**

Run: `cd frontend && pnpm dev`
Verify:
- Dashboard shows 2 stat cards + full-width Partidos Recientes + CTA
- Sidebar has no "Rankings" link
- Navigating to `/rankings` shows blank/404 (no crash)
- `/matches/:id` still shows player stats table (RankingsTable still works)
- `/players/compare` still works
