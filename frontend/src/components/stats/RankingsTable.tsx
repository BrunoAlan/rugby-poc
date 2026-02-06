import { Link } from 'react-router-dom'
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { PlayerRanking } from '../../types'

interface RankingsTableProps {
  rankings: PlayerRanking[]
  loading?: boolean
  compact?: boolean
  onPlayerClick?: (playerName: string) => void
}

export default function RankingsTable({ rankings, loading, compact = false, onPlayerClick }: RankingsTableProps) {
  const isAggregatedView = rankings.length > 0 && rankings[0].matches_played !== null

  if (loading) {
    return (
      <div className="overflow-hidden rounded-lg border border-dark-700/50">
        <table className="min-w-full divide-y divide-dark-700/50">
          <thead>
            <tr>
              <th className="table-header px-4 py-3">#</th>
              <th className="table-header px-4 py-3">Jugador</th>
              <th className="table-header px-4 py-3 text-right">Puntuación</th>
              {!compact && <th className="table-header px-4 py-3 text-right">Partidos</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-700/30">
            {[...Array(5)].map((_, i) => (
              <tr key={i}>
                <td className="table-cell"><div className="skeleton h-4 w-6 rounded" /></td>
                <td className="table-cell"><div className="skeleton h-4 w-32 rounded" /></td>
                <td className="table-cell text-right"><div className="skeleton h-4 w-12 rounded ml-auto" /></td>
                {!compact && <td className="table-cell text-right"><div className="skeleton h-4 w-8 rounded ml-auto" /></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (rankings.length === 0) {
    return (
      <div className="text-center py-8 text-dark-400">
        No hay rankings disponibles
      </div>
    )
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return (
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-[0_0_10px_rgba(234,179,8,0.3)]">
        <Trophy className="h-4 w-4 text-yellow-900" />
      </div>
    )
    if (rank === 2) return (
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 shadow-[0_0_8px_rgba(156,163,175,0.2)]">
        <Trophy className="h-4 w-4 text-gray-700" />
      </div>
    )
    if (rank === 3) return (
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 shadow-[0_0_8px_rgba(217,119,6,0.2)]">
        <Trophy className="h-4 w-4 text-amber-900" />
      </div>
    )
    return <span className="text-dark-400 font-medium tabular-nums">{rank}</span>
  }

  const getTrendIcon = (score: number) => {
    if (score >= 100) return <TrendingUp className="h-4 w-4 text-green-400" />
    if (score < 50) return <TrendingDown className="h-4 w-4 text-red-400" />
    return <Minus className="h-4 w-4 text-dark-400" />
  }

  return (
    <div className="overflow-hidden rounded-lg border border-dark-700/50">
      <table className="min-w-full divide-y divide-dark-700/50">
        <thead>
          <tr>
            <th className="table-header px-4 py-3 w-12">#</th>
            <th className="table-header px-4 py-3">Jugador</th>
            <th className="table-header px-4 py-3 text-right">
              {isAggregatedView ? 'Prom. Puntuación' : 'Puntuación'}
            </th>
            {!compact && isAggregatedView && (
              <th className="table-header px-4 py-3 text-right">Partidos</th>
            )}
            {!compact && !isAggregatedView && (
              <>
                <th className="table-header px-4 py-3">Rival</th>
                <th className="table-header px-4 py-3 text-right">Tiempo</th>
              </>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-dark-700/30">
          {rankings.map((player, index) => (
            <tr key={`${player.player_name}-${player.opponent || 'all'}-${index}`} className="hover:bg-dark-700/50 transition-colors">
              <td className="table-cell">
                <div className="flex items-center justify-center w-8 h-8">
                  {getRankBadge(player.rank)}
                </div>
              </td>
              <td className="table-cell">
                {onPlayerClick ? (
                  <button
                    type="button"
                    onClick={() => onPlayerClick(player.player_name)}
                    className="font-medium text-gray-200 hover:text-primary-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-1 focus-visible:ring-offset-dark-800 rounded cursor-pointer text-left transition-colors"
                  >
                    {player.player_name}
                  </button>
                ) : (
                  <Link
                    to={`/players/${encodeURIComponent(player.player_name)}`}
                    className="font-medium text-gray-200 hover:text-primary-400 transition-colors"
                  >
                    {player.player_name}
                  </Link>
                )}
                {player.puesto !== null && (
                  <span className="ml-2 inline-flex items-center rounded-full bg-dark-700/60 px-2 py-0.5 text-xs font-medium text-dark-300">
                    #{player.puesto}
                  </span>
                )}
              </td>
              <td className="table-cell text-right font-semibold text-white">
                <div className="flex items-center justify-end gap-1">
                  <span className="tabular-nums">{player.puntuacion_final.toFixed(1)}</span>
                  {getTrendIcon(player.puntuacion_final)}
                </div>
              </td>
              {!compact && isAggregatedView && (
                <td className="table-cell text-right text-dark-300 tabular-nums">
                  {player.matches_played}
                </td>
              )}
              {!compact && !isAggregatedView && (
                <>
                  <td className="table-cell text-dark-300">
                    {player.opponent}
                  </td>
                  <td className="table-cell text-right">
                    <span className="font-medium text-gray-200 tabular-nums">
                      {player.tiempo_juego}'
                    </span>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
