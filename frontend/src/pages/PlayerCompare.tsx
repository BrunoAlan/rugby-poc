import { useSearchParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { usePlayerSummary } from '../hooks/usePlayers'
import ComparisonHeader from '../components/players/ComparisonHeader'
import ComparisonStats from '../components/players/ComparisonStats'
import ComparisonChart from '../components/players/ComparisonChart'
import type { PlayerSummary } from '../types'

// Custom hook to fetch multiple player summaries in parallel
function useMultiplePlayerSummaries(names: string[]) {
  // Create individual queries for each player
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
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Jugadores
        </Link>
        <div className="card text-center py-12">
          <p className="text-gray-500">
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
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Jugadores
        </Link>
        <div className="card animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {playerNames.map((_, i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-lg">
                <div className="h-6 w-32 bg-gray-200 rounded mb-4" />
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-gray-200 rounded" />
                  <div className="h-4 w-20 bg-gray-200 rounded" />
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
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Jugadores
        </Link>
        <div className="card text-center py-12">
          <p className="text-gray-500">
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
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        to="/players"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a Jugadores
      </Link>

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Comparación de Jugadores</h1>
        <p className="mt-1 text-gray-500">
          Comparando {summaries.length} jugadores
        </p>
      </div>

      {/* Player Cards */}
      <ComparisonHeader summaries={summaries} />

      {/* Stats Comparison Table */}
      <ComparisonStats summaries={summaries} />

      {/* Evolution Chart */}
      <ComparisonChart summaries={summaries} />
    </div>
  )
}
