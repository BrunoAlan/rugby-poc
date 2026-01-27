import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, ChevronDown, ChevronRight } from 'lucide-react'
import { usePlayerSummary } from '../hooks/usePlayers'
import PlayerSummaryComponent from '../components/players/PlayerSummary'
import StatsChart from '../components/stats/StatsChart'
import type { MatchStat } from '../types'

// Stats organized by category
const statCategories = {
  tackles: {
    label: 'Tackles',
    stats: [
      { key: 'tackles_positivos', label: 'Positivos' },
      { key: 'tackles', label: 'Totales' },
      { key: 'tackles_errados', label: 'Errados' },
    ],
  },
  attack: {
    label: 'Ataque',
    stats: [
      { key: 'portador', label: 'Portador' },
      { key: 'quiebres', label: 'Quiebres' },
      { key: 'gana_contacto', label: 'Gana Contacto' },
      { key: 'try_', label: 'Tries' },
    ],
  },
  passing: {
    label: 'Pases',
    stats: [
      { key: 'pases', label: 'Pases' },
      { key: 'pases_malos', label: 'Pases Malos' },
    ],
  },
  other: {
    label: 'Otros',
    stats: [
      { key: 'ruck_ofensivos', label: 'Ruck Ofensivos' },
      { key: 'perdidas', label: 'Pérdidas' },
      { key: 'recuperaciones', label: 'Recuperaciones' },
      { key: 'penales', label: 'Penales' },
      { key: 'juego_pie', label: 'Juego Pie' },
      { key: 'recepcion_aire_buena', label: 'Recepción Aire (Buena)' },
      { key: 'recepcion_aire_mala', label: 'Recepción Aire (Mala)' },
    ],
  },
}

interface ExpandableMatchRowProps {
  match: MatchStat
  isExpanded: boolean
  onToggle: () => void
}

// Date formatter for consistent localization
const dateFormatter = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const shortDateFormatter = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: 'short',
})

function ExpandableMatchRow({ match, isExpanded, onToggle }: ExpandableMatchRowProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onToggle()
    }
  }

  return (
    <>
      <tr
        className="hover:bg-gray-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-rugby-500"
        onClick={onToggle}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-expanded={isExpanded}
      >
        <td className="table-cell px-4 py-3">
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-400" aria-hidden="true" />
            )}
            <Link
              to={`/matches/${match.match_id}`}
              className="font-medium text-gray-900 hover:text-rugby-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rugby-500 focus-visible:ring-offset-1 rounded"
              onClick={(e) => e.stopPropagation()}
            >
              vs {match.opponent}
            </Link>
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-rugby-100 text-rugby-700">
              {match.team}
            </span>
          </div>
        </td>
        <td className="table-cell px-4 py-3 text-gray-500 tabular-nums">
          {match.match_date ? dateFormatter.format(new Date(match.match_date)) : '-'}
        </td>
        <td className="table-cell px-4 py-3 text-center tabular-nums">#{match.puesto}</td>
        <td className="table-cell px-4 py-3 text-center tabular-nums">{match.tiempo_juego}'</td>
        <td className="table-cell px-4 py-3 text-right font-semibold text-rugby-600 tabular-nums">
          {(match.score || 0).toFixed(1)}
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-gray-50">
          <td colSpan={5} className="px-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(statCategories).map(([categoryKey, category]) => (
                <div key={categoryKey} className="bg-white rounded-lg p-4 border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 border-b pb-2">
                    {category.label}
                  </h4>
                  <div className="space-y-2">
                    {category.stats.map((stat) => (
                      <div key={stat.key} className="flex justify-between text-sm">
                        <span className="text-gray-500">{stat.label}</span>
                        <span className="font-medium text-gray-900 tabular-nums">
                          {(match as unknown as Record<string, number>)[stat.key] || 0}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export default function PlayerDetail() {
  const { name } = useParams<{ name: string }>()
  const decodedName = decodeURIComponent(name || '')
  const [expandedMatches, setExpandedMatches] = useState<Set<number>>(new Set())

  const { data: summary, isLoading } = usePlayerSummary(decodedName)

  const toggleMatch = (matchId: number) => {
    setExpandedMatches((prev) => {
      const next = new Set(prev)
      if (next.has(matchId)) {
        next.delete(matchId)
      } else {
        next.add(matchId)
      }
      return next
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="card animate-pulse">
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 rounded-full bg-gray-200" />
            <div className="flex-1">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/4" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500">Jugador no encontrado</p>
        <Link to="/players" className="btn-primary mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rugby-500 focus-visible:ring-offset-2">
          Volver a Jugadores
        </Link>
      </div>
    )
  }

  // Prepare chart data from match history
  const chartData = summary.matches.map((match) => ({
    name: `${match.opponent} (${match.team})`,
    value: match.score,
    date: match.match_date ? shortDateFormatter.format(new Date(match.match_date)) : '-',
  }))

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        to="/players"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rugby-500 focus-visible:ring-offset-1 rounded"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver a Jugadores
      </Link>

      {/* Player Summary */}
      <PlayerSummaryComponent summary={summary} />

      {/* Score Evolution Chart */}
      {chartData.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Evolución de Puntuación
          </h2>
          <StatsChart data={chartData} type="line" height={300} />
        </div>
      )}

      {/* Match History */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Historial de Partidos
          </h2>
          <p className="text-sm text-gray-500">
            Click en una fila para ver todas las estadísticas
          </p>
        </div>
        {summary.matches.length === 0 ? (
          <p className="text-center py-8 text-gray-500">
            No hay partidos registrados
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header px-4 py-3">Rival</th>
                  <th className="table-header px-4 py-3">Fecha</th>
                  <th className="table-header px-4 py-3 text-center">Puesto</th>
                  <th className="table-header px-4 py-3 text-center">Tiempo</th>
                  <th className="table-header px-4 py-3 text-right">Puntuación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {summary.matches.map((match, idx) => (
                  <ExpandableMatchRow
                    key={match.match_id || idx}
                    match={match}
                    isExpanded={expandedMatches.has(match.match_id)}
                    onToggle={() => toggleMatch(match.match_id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
