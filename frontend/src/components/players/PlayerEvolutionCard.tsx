import { useEffect } from 'react'
import { Brain, RefreshCw, AlertCircle, Loader2 } from 'lucide-react'
import { usePlayerEvolutionAnalysis, useTriggerEvolutionAnalysis } from '../../hooks/usePlayers'

interface PlayerEvolutionCardProps {
  playerId: number
}

export default function PlayerEvolutionCard({ playerId }: PlayerEvolutionCardProps) {
  const { data, isLoading, refetch } = usePlayerEvolutionAnalysis(playerId)
  const triggerMutation = useTriggerEvolutionAnalysis()

  // Poll every 3 seconds while processing
  useEffect(() => {
    if (data?.status !== 'processing') return

    const interval = setInterval(() => {
      refetch()
    }, 3000)

    return () => clearInterval(interval)
  }, [data?.status, refetch])

  if (isLoading) {
    return (
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="h-5 w-5 text-primary-400" />
          <h2 className="text-lg font-semibold text-white">Analisis de Evolucion</h2>
        </div>
        <div className="skeleton h-32 rounded" />
      </div>
    )
  }

  if (!data) return null

  function handleGenerate() {
    triggerMutation.mutate(playerId)
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary-400" />
          <h2 className="text-lg font-semibold text-white">Analisis de Evolucion</h2>
        </div>

        {data.status === 'completed' && (
          <button
            className="flex items-center gap-1.5 text-xs text-dark-400 hover:text-primary-400 transition-colors"
            onClick={handleGenerate}
            disabled={triggerMutation.isPending}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${triggerMutation.isPending ? 'animate-spin' : ''}`} />
            Regenerar
          </button>
        )}
      </div>

      {data.is_stale && data.status === 'completed' && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 px-3 py-2">
          <AlertCircle className="h-4 w-4 text-yellow-400 flex-shrink-0" />
          <span className="text-sm text-yellow-300">
            Hay datos nuevos desde el ultimo analisis.
          </span>
          <button
            className="text-sm text-yellow-400 hover:text-yellow-300 font-medium ml-auto"
            onClick={handleGenerate}
          >
            Actualizar
          </button>
        </div>
      )}

      {data.status === 'pending' && (
        <div className="text-center py-8">
          <Brain className="h-12 w-12 text-dark-500 mx-auto mb-3" />
          <p className="text-dark-400 mb-4">
            No hay analisis generado todavia
          </p>
          <button
            className="btn-primary"
            onClick={handleGenerate}
            disabled={triggerMutation.isPending}
          >
            Generar Analisis de Evolucion
          </button>
        </div>
      )}

      {data.status === 'processing' && (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 text-primary-400 mx-auto mb-3 animate-spin" />
          <p className="text-dark-300">Generando analisis...</p>
        </div>
      )}

      {data.status === 'completed' && data.analysis && (
        <div className="prose prose-invert prose-sm max-w-none">
          {data.analysis.split('\n').map((line, i) => {
            const trimmed = line.trim()
            if (!trimmed) return <br key={i} />
            if (trimmed.startsWith('## ')) {
              return (
                <h3 key={i} className="text-base font-semibold text-primary-400 mt-4 mb-2">
                  {trimmed.replace('## ', '')}
                </h3>
              )
            }
            if (trimmed.startsWith('- ')) {
              return (
                <p key={i} className="text-sm text-dark-200 ml-4 mb-1">
                  {trimmed.replace('- ', '').replace(/\*\*([^*]+)\*\*/g, '$1')}
                </p>
              )
            }
            return (
              <p key={i} className="text-sm text-dark-200 mb-2">
                {trimmed.replace(/\*\*([^*]+)\*\*/g, '$1')}
              </p>
            )
          })}
        </div>
      )}

      {data.status === 'error' && (
        <div className="text-center py-8">
          <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-3" />
          <p className="text-red-300 mb-2">Error al generar el analisis</p>
          {data.error && (
            <p className="text-xs text-dark-400 mb-4">{data.error}</p>
          )}
          <button
            className="btn-primary"
            onClick={handleGenerate}
            disabled={triggerMutation.isPending}
          >
            Reintentar
          </button>
        </div>
      )}
    </div>
  )
}
