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
