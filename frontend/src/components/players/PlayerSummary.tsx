import { User, TrendingUp, Calendar, Clock } from 'lucide-react'
import CountUp from '../ui/CountUp'
import { getPositionLabel } from '../../constants/positions'
import type { PlayerSummary as PlayerSummaryType } from '../../types'

interface PlayerSummaryProps {
  summary: PlayerSummaryType
}

export default function PlayerSummary({ summary }: PlayerSummaryProps) {
  const { player_name, matches_played, total_minutes, avg_puntuacion_final, matches } = summary

  // Get most common position
  const primaryPosition = matches && matches.length > 0
    ? (() => {
        const counts: Record<number, number> = {}
        for (const m of matches) {
          counts[m.puesto] = (counts[m.puesto] || 0) + 1
        }
        return Number(Object.entries(counts).sort(([, a], [, b]) => b - a)[0][0])
      })()
    : null

  const isForward = primaryPosition !== null && primaryPosition <= 8

  return (
    <div className="card">
      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 shadow-glow-primary">
          <User className="h-10 w-10 text-white" />
        </div>

        <div className="flex-1">
          <h2 className="text-3xl font-black text-white">{player_name}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            {primaryPosition !== null && (
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                  isForward
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                }`}
              >
                {getPositionLabel(primaryPosition)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg bg-dark-900/60 p-4 border border-dark-700/30">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-dark-400" />
            <span className="text-sm text-dark-300">Partidos Jugados</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-white">
            <CountUp end={matches_played} />
          </p>
        </div>

        <div className="rounded-lg bg-dark-900/60 p-4 border border-dark-700/30">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-dark-400" />
            <span className="text-sm text-dark-300">Minutos Totales</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-white">
            <CountUp end={total_minutes ? Math.round(total_minutes) : 0} />
          </p>
        </div>

        <div className="rounded-lg bg-dark-900/60 p-4 border border-dark-700/30">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-dark-400" />
            <span className="text-sm text-dark-300">Promedio por Partido</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-primary-400">
            <CountUp end={avg_puntuacion_final || 0} decimals={2} />
          </p>
        </div>
      </div>
    </div>
  )
}
