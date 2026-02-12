import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowDown, ArrowLeft, ArrowUp, ChevronDown, ChevronRight, FileDown } from 'lucide-react'
import { usePlayerAnomalies, usePlayerSummary } from '../hooks/usePlayers'
import PlayerAlertsCard from '../components/players/PlayerAlertsCard'
import PlayerEvolutionCard from '../components/players/PlayerEvolutionCard'
import PlayerSummaryComponent from '../components/players/PlayerSummary'
import StatsChart from '../components/stats/StatsChart'
import AnimatedPage from '../components/ui/AnimatedPage'
import { getPositionLabel } from '../constants/positions'
import type { MatchStat, StatAnomaly } from '../types'

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
  anomalies?: Record<string, StatAnomaly>
}

const dateFormatter = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const shortDateFormatter = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: 'short',
})

function ExpandableMatchRow({ match, isExpanded, onToggle, anomalies }: ExpandableMatchRowProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onToggle()
    }
  }

  return (
    <>
      <tr
        className="hover:bg-dark-700/50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-400"
        onClick={onToggle}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-expanded={isExpanded}
      >
        <td className="table-cell px-4 py-3">
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-dark-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-dark-400" />
            )}
            <Link
              to={`/matches/${match.match_id}`}
              className="font-medium text-gray-200 hover:text-primary-400 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              vs {match.opponent}
            </Link>
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-primary-500/20 text-primary-400">
              {match.team}
            </span>
          </div>
        </td>
        <td className="table-cell px-4 py-3 text-dark-300 tabular-nums">
          {match.match_date ? dateFormatter.format(new Date(match.match_date + 'T12:00:00')) : '-'}
        </td>
        <td className="table-cell px-4 py-3 text-center tabular-nums text-sm">{getPositionLabel(match.puesto)}</td>
        <td className="table-cell px-4 py-3 text-center tabular-nums">{match.tiempo_juego}'</td>
        <td className="table-cell px-4 py-3 text-right font-semibold text-primary-400 tabular-nums">
          {(match.score || 0).toFixed(1)}
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-dark-900/40">
          <td colSpan={5} className="px-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(statCategories).map(([categoryKey, category]) => (
                <div key={categoryKey} className="bg-dark-800/60 rounded-lg p-4 border border-dark-700/30">
                  <h4 className="text-sm font-semibold text-primary-400 mb-3 border-b border-dark-700/30 pb-2">
                    {category.label}
                  </h4>
                  <div className="space-y-2">
                    {category.stats.map((stat) => (
                      <div key={stat.key} className="flex justify-between text-sm">
                        <span className="text-dark-300">{stat.label}</span>
                        <span className="font-medium text-gray-200 tabular-nums flex items-center gap-1">
                          {(match as unknown as Record<string, number>)[stat.key] || 0}
                          {anomalies?.[stat.key]?.alert === 'positive' && (
                            <ArrowUp className="h-3 w-3 text-green-400" />
                          )}
                          {anomalies?.[stat.key]?.alert === 'negative' && (
                            <ArrowDown className="h-3 w-3 text-red-400" />
                          )}
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
  const { data: anomaliesData } = usePlayerAnomalies(summary?.player_id || 0)

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
        <div className="card">
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 rounded-full skeleton" />
            <div className="flex-1">
              <div className="skeleton h-8 w-1/3 rounded mb-2" />
              <div className="skeleton h-4 w-1/4 rounded" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="card text-center py-12">
        <p className="text-dark-400">Jugador no encontrado</p>
        <Link to="/players" className="btn-primary mt-4">
          Volver a Jugadores
        </Link>
      </div>
    )
  }

  const chartData = summary.matches.map((match) => ({
    name: `${match.opponent} (${match.team})`,
    value: match.score,
    date: match.match_date ? shortDateFormatter.format(new Date(match.match_date + 'T12:00:00')) : '-',
  }))

  return (
    <AnimatedPage className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/players"
          className="inline-flex items-center gap-2 text-sm text-dark-400 hover:text-primary-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Jugadores
        </Link>
        {summary.player_id && (
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-primary-500/20 px-4 py-2 text-sm font-medium text-primary-400 hover:bg-primary-500/30 transition-colors border border-primary-500/30"
            onClick={() => window.open(`/api/exports/players/${summary.player_id}/report`, '_blank')}
          >
            <FileDown className="h-4 w-4" />
            Descargar Reporte PDF
          </button>
        )}
      </div>

      {/* Player Summary */}
      <PlayerSummaryComponent summary={summary} />

      {/* Player Alerts */}
      {summary.player_id && (
        <PlayerAlertsCard playerId={summary.player_id} />
      )}

      {/* AI Evolution Analysis */}
      {summary.player_id && (
        <PlayerEvolutionCard playerId={summary.player_id} />
      )}

      {/* Score Evolution Chart */}
      {chartData.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-6">
            Evolución de Puntuación
          </h2>
          <StatsChart data={chartData} type="line" height={300} />
        </div>
      )}

      {/* Match History */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">
            Historial de Partidos
          </h2>
          <p className="text-sm text-dark-400">
            Click en una fila para ver todas las estadísticas
          </p>
        </div>
        {summary.matches.length === 0 ? (
          <p className="text-center py-8 text-dark-400">
            No hay partidos registrados
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-dark-700/50">
              <thead>
                <tr>
                  <th className="table-header px-4 py-3">Rival</th>
                  <th className="table-header px-4 py-3">Fecha</th>
                  <th className="table-header px-4 py-3 text-center">Puesto</th>
                  <th className="table-header px-4 py-3 text-center">Tiempo</th>
                  <th className="table-header px-4 py-3 text-right">Puntuación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700/30">
                {summary.matches.map((match, idx) => (
                  <ExpandableMatchRow
                    key={match.match_id || idx}
                    match={match}
                    isExpanded={expandedMatches.has(match.match_id)}
                    onToggle={() => toggleMatch(match.match_id)}
                    anomalies={idx === summary.matches.length - 1 ? anomaliesData?.anomalies : undefined}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AnimatedPage>
  )
}
