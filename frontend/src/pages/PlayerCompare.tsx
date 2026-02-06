import { useSearchParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { usePlayerSummary } from '../hooks/usePlayers'
import ComparisonHeader from '../components/players/ComparisonHeader'
import ComparisonStats from '../components/players/ComparisonStats'
import ComparisonChart from '../components/players/ComparisonChart'
import AnimatedPage from '../components/ui/AnimatedPage'
import type { PlayerSummary } from '../types'

function useMultiplePlayerSummaries(names: string[]) {
  const queries = names.map(name => usePlayerSummary(name))

  const isLoading = queries.some(q => q.isLoading)
  const isError = queries.some(q => q.isError)
  const data = queries.map(q => q.data).filter((d): d is PlayerSummary => d !== undefined)

  return { data, isLoading, isError }
}

export default function PlayerCompare() {
  const [searchParams] = useSearchParams()
  const playerNames = searchParams.getAll('player')

  const { data: summaries, isLoading, isError } = useMultiplePlayerSummaries(playerNames)

  if (playerNames.length < 2) {
    return (
      <div className="space-y-6">
        <Link
          to="/players"
          className="inline-flex items-center gap-2 text-sm text-dark-400 hover:text-primary-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Jugadores
        </Link>
        <div className="card text-center py-12">
          <p className="text-dark-400">
            Selecciona al menos 2 jugadores para comparar.
          </p>
          <Link to="/players" className="btn-primary mt-4 inline-block">
            Ir a Jugadores
          </Link>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Link
          to="/players"
          className="inline-flex items-center gap-2 text-sm text-dark-400 hover:text-primary-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Jugadores
        </Link>
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {playerNames.map((_, i) => (
              <div key={i} className="p-4 bg-dark-900/40 rounded-lg">
                <div className="skeleton h-6 w-32 rounded mb-4" />
                <div className="space-y-2">
                  <div className="skeleton h-4 w-24 rounded" />
                  <div className="skeleton h-4 w-20 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (isError || summaries.length < 2) {
    return (
      <div className="space-y-6">
        <Link
          to="/players"
          className="inline-flex items-center gap-2 text-sm text-dark-400 hover:text-primary-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Jugadores
        </Link>
        <div className="card text-center py-12">
          <p className="text-dark-400">
            Error al cargar los datos de los jugadores.
          </p>
          <Link to="/players" className="btn-primary mt-4 inline-block">
            Volver a Jugadores
          </Link>
        </div>
      </div>
    )
  }

  return (
    <AnimatedPage className="space-y-6">
      {/* Back Link */}
      <Link
        to="/players"
        className="inline-flex items-center gap-2 text-sm text-dark-400 hover:text-primary-400 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a Jugadores
      </Link>

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Comparación de Jugadores</h1>
        <p className="mt-1 text-dark-300">
          Comparando {summaries.length} jugadores
        </p>
      </div>

      {/* Player Cards */}
      <ComparisonHeader summaries={summaries} />

      {/* Stats Comparison Table */}
      <ComparisonStats summaries={summaries} />

      {/* Evolution Chart */}
      <ComparisonChart summaries={summaries} />
    </AnimatedPage>
  )
}
