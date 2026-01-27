import { Link } from 'react-router-dom'
import { Calendar, Users, Trophy, TrendingUp, ArrowRight } from 'lucide-react'
import { useMatches } from '../hooks/useMatches'
import { usePlayers } from '../hooks/usePlayers'
import { useRankings } from '../hooks/useRankings'
import StatsSummary from '../components/stats/StatsSummary'
import RankingsTable from '../components/stats/RankingsTable'
import MatchCard from '../components/matches/MatchCard'

export default function Dashboard() {
  const { data: matches, isLoading: matchesLoading } = useMatches()
  const { data: players, isLoading: playersLoading } = usePlayers()
  const { data: rankings, isLoading: rankingsLoading } = useRankings({ limit: 5 })

  const recentMatches = matches?.slice(0, 3) || []
  const totalMatches = matches?.length || 0
  const totalPlayers = players?.length || 0

  const stats = [
    {
      label: 'Total Partidos',
      value: totalMatches,
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      label: 'Total Jugadores',
      value: totalPlayers,
      icon: <Users className="h-5 w-5" />,
    },
    {
      label: 'Top Score',
      value: rankings?.[0]?.puntuacion_final.toFixed(0) || '-',
      icon: <Trophy className="h-5 w-5" />,
    },
    {
      label: 'Mejor Jugador',
      value: rankings?.[0]?.player_name || '-',
      icon: <TrendingUp className="h-5 w-5" />,
    },
  ]

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-gray-500">
          Resumen general de estadísticas de rugby
        </p>
      </div>

      {/* Stats Summary */}
      <StatsSummary stats={stats} loading={matchesLoading || playersLoading} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Rankings */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Top 5 Rankings</h2>
            <Link
              to="/rankings"
              className="text-sm font-medium text-rugby-600 hover:text-rugby-700 flex items-center gap-1"
            >
              Ver todos
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <RankingsTable rankings={rankings || []} loading={rankingsLoading} compact />
        </div>

        {/* Recent Matches */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Partidos Recientes</h2>
            <Link
              to="/matches"
              className="text-sm font-medium text-rugby-600 hover:text-rugby-700 flex items-center gap-1"
            >
              Ver todos
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {matchesLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse p-4 rounded-lg bg-gray-50">
                  <div className="h-5 bg-gray-200 rounded w-1/3 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                </div>
              ))}
            </div>
          ) : recentMatches.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
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
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card bg-gradient-to-r from-rugby-600 to-rugby-700">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Importar nuevos datos
            </h2>
            <p className="text-rugby-100 text-sm mt-1">
              Sube un archivo Excel para agregar partidos y estadísticas
            </p>
          </div>
          <Link to="/upload" className="btn bg-white text-rugby-700 hover:bg-gray-100">
            Subir Excel
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
