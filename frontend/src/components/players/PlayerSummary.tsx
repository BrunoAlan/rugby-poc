import { User, TrendingUp, Calendar, Clock } from 'lucide-react'
import type { PlayerSummary as PlayerSummaryType } from '../../types'

interface PlayerSummaryProps {
  summary: PlayerSummaryType
}

export default function PlayerSummary({ summary }: PlayerSummaryProps) {
  const { player_name, matches_played, total_minutes, avg_puntuacion_final, matches } = summary

  // Determine if player is forward or back based on most common puesto
  const isForward = matches && matches.length > 0
    ? matches.some(m => m.puesto >= 1 && m.puesto <= 8)
    : false

  return (
    <div className="card">
      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-rugby-100">
          <User className="h-10 w-10 text-rugby-600" />
        </div>

        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">{player_name}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                isForward
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-purple-100 text-purple-700'
              }`}
            >
              {isForward ? 'Forward' : 'Back'}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg bg-gray-50 p-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-500">Partidos Jugados</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">{matches_played}</p>
        </div>

        <div className="rounded-lg bg-gray-50 p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-500">Minutos Totales</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">{total_minutes?.toFixed(0) || 0}</p>
        </div>

        <div className="rounded-lg bg-gray-50 p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-500">Promedio por Partido</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-rugby-600">{avg_puntuacion_final?.toFixed(2) || 0}</p>
        </div>
      </div>
    </div>
  )
}
