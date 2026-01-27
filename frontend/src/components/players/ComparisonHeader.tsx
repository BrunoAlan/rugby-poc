import { User, Calendar, Clock, TrendingUp } from 'lucide-react'
import type { PlayerSummary } from '../../types'

interface ComparisonHeaderProps {
  summaries: PlayerSummary[]
}

// Distinctive colors for each player
const PLAYER_COLORS = [
  { bg: 'bg-rugby-100', text: 'text-rugby-600', border: 'border-rugby-200' },
  { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' },
  { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200' },
  { bg: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-200' },
  { bg: 'bg-rose-100', text: 'text-rose-600', border: 'border-rose-200' },
]

export default function ComparisonHeader({ summaries }: ComparisonHeaderProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {summaries.map((summary, index) => {
        const colors = PLAYER_COLORS[index % PLAYER_COLORS.length]
        const isForward = summary.matches && summary.matches.length > 0
          ? summary.matches.some(m => m.puesto >= 1 && m.puesto <= 8)
          : false

        return (
          <div
            key={summary.player_name}
            className={`card border-2 ${colors.border}`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-full ${colors.bg}`}>
                <User className={`h-6 w-6 ${colors.text}`} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-gray-900 truncate">
                  {summary.player_name}
                </h3>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    isForward
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-purple-100 text-purple-700'
                  }`}
                >
                  {isForward ? 'Forward' : 'Back'}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span>Partidos</span>
                </div>
                <span className="font-semibold text-gray-900 tabular-nums">
                  {summary.matches_played}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="h-4 w-4" />
                  <span>Minutos</span>
                </div>
                <span className="font-semibold text-gray-900 tabular-nums">
                  {summary.total_minutes?.toFixed(0) || 0}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <TrendingUp className="h-4 w-4" />
                  <span>Promedio</span>
                </div>
                <span className={`font-bold tabular-nums ${colors.text}`}>
                  {summary.avg_puntuacion_final?.toFixed(2) || 0}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
