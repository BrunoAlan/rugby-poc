import { User, Calendar, Clock, TrendingUp } from 'lucide-react'
import AnimatedCard from '../ui/AnimatedCard'
import type { PlayerSummary } from '../../types'

interface ComparisonHeaderProps {
  summaries: PlayerSummary[]
}

const PLAYER_COLORS = [
  { bg: 'from-primary-500/20 to-primary-600/10', text: 'text-primary-400', border: 'border-primary-500/40', ring: 'from-primary-500 to-primary-700' },
  { bg: 'from-blue-500/20 to-blue-600/10', text: 'text-blue-400', border: 'border-blue-500/40', ring: 'from-blue-500 to-blue-700' },
  { bg: 'from-purple-500/20 to-purple-600/10', text: 'text-purple-400', border: 'border-purple-500/40', ring: 'from-purple-500 to-purple-700' },
  { bg: 'from-amber-500/20 to-amber-600/10', text: 'text-amber-400', border: 'border-amber-500/40', ring: 'from-amber-500 to-amber-700' },
  { bg: 'from-rose-500/20 to-rose-600/10', text: 'text-rose-400', border: 'border-rose-500/40', ring: 'from-rose-500 to-rose-700' },
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
          <AnimatedCard key={summary.player_name} index={index}>
            <div className={`card border ${colors.border}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${colors.ring}`}>
                  <User className="h-6 w-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-white truncate">
                    {summary.player_name}
                  </h3>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      isForward
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-purple-500/20 text-purple-400'
                    }`}
                  >
                    {isForward ? 'Forward' : 'Back'}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-dark-300">
                    <Calendar className="h-4 w-4" />
                    <span>Partidos</span>
                  </div>
                  <span className="font-semibold text-white tabular-nums">
                    {summary.matches_played}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-dark-300">
                    <Clock className="h-4 w-4" />
                    <span>Minutos</span>
                  </div>
                  <span className="font-semibold text-white tabular-nums">
                    {summary.total_minutes?.toFixed(0) || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-dark-300">
                    <TrendingUp className="h-4 w-4" />
                    <span>Promedio</span>
                  </div>
                  <span className={`font-bold tabular-nums ${colors.text}`}>
                    {summary.avg_puntuacion_final?.toFixed(2) || 0}
                  </span>
                </div>
              </div>
            </div>
          </AnimatedCard>
        )
      })}
    </div>
  )
}
