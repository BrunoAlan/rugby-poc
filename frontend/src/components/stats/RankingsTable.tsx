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
  // Determine if we're showing aggregated view (all matches) or specific match view
  const isAggregatedView = rankings.length > 0 && rankings[0].matches_played !== null

  if (loading) {
    return (
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="table-header px-4 py-3">#</th>
              <th className="table-header px-4 py-3">Jugador</th>
              <th className="table-header px-4 py-3 text-right">Puntuación</th>
              {!compact && <th className="table-header px-4 py-3 text-right">Partidos</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="animate-pulse">
                <td className="table-cell"><div className="h-4 w-6 bg-gray-200 rounded" /></td>
                <td className="table-cell"><div className="h-4 w-32 bg-gray-200 rounded" /></td>
                <td className="table-cell text-right"><div className="h-4 w-12 bg-gray-200 rounded ml-auto" /></td>
                {!compact && <td className="table-cell text-right"><div className="h-4 w-8 bg-gray-200 rounded ml-auto" /></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (rankings.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No hay rankings disponibles
      </div>
    )
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" aria-hidden="true" />
    if (rank === 2) return <Trophy className="h-5 w-5 text-gray-400" aria-hidden="true" />
    if (rank === 3) return <Trophy className="h-5 w-5 text-amber-600" aria-hidden="true" />
    return <span className="text-gray-500 font-medium tabular-nums">{rank}</span>
  }

  const getTrendIcon = (score: number) => {
    if (score >= 100) return <TrendingUp className="h-4 w-4 text-green-500" aria-hidden="true" />
    if (score < 50) return <TrendingDown className="h-4 w-4 text-red-500" aria-hidden="true" />
    return <Minus className="h-4 w-4 text-gray-400" aria-hidden="true" />
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
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
        <tbody className="divide-y divide-gray-100 bg-white">
          {rankings.map((player, index) => (
            <tr key={`${player.player_name}-${player.opponent || 'all'}-${index}`} className="hover:bg-gray-50 transition-colors">
              <td className="table-cell">
                <div className="flex items-center justify-center w-8 h-8">
                  {getRankIcon(player.rank)}
                </div>
              </td>
              <td className="table-cell">
                {onPlayerClick ? (
                  <button
                    type="button"
                    onClick={() => onPlayerClick(player.player_name)}
                    className="font-medium text-gray-900 hover:text-rugby-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rugby-500 focus-visible:ring-offset-1 rounded cursor-pointer text-left"
                  >
                    {player.player_name}
                  </button>
                ) : (
                  <Link
                    to={`/players/${encodeURIComponent(player.player_name)}`}
                    className="font-medium text-gray-900 hover:text-rugby-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rugby-500 focus-visible:ring-offset-1 rounded"
                  >
                    {player.player_name}
                  </Link>
                )}
                {player.puesto !== null && (
                  <span className="ml-2 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                    #{player.puesto}
                  </span>
                )}
              </td>
              <td className="table-cell text-right font-semibold text-gray-900">
                <div className="flex items-center justify-end gap-1">
                  <span className="tabular-nums">{player.puntuacion_final.toFixed(1)}</span>
                  {getTrendIcon(player.puntuacion_final)}
                </div>
              </td>
              {!compact && isAggregatedView && (
                <td className="table-cell text-right text-gray-500 tabular-nums">
                  {player.matches_played}
                </td>
              )}
              {!compact && !isAggregatedView && (
                <>
                  <td className="table-cell text-gray-500">
                    {player.opponent}
                  </td>
                  <td className="table-cell text-right">
                    <span className="font-medium text-gray-900 tabular-nums">
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
