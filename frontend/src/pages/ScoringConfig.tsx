import { useState } from 'react'
import { Settings, RefreshCw, Plus, X, Loader2 } from 'lucide-react'
import {
  useScoringConfigs,
  useActiveConfig,
  useActivateConfig,
  useUpdateWeight,
  useRecalculateScores,
  useCreateConfig,
} from '../hooks/useScoringConfig'
import ConfigSelector from '../components/scoring/ConfigSelector'
import WeightsTable from '../components/scoring/WeightsTable'

export default function ScoringConfig() {
  const [showNewConfigModal, setShowNewConfigModal] = useState(false)
  const [newConfigName, setNewConfigName] = useState('')
  const [newConfigDescription, setNewConfigDescription] = useState('')

  const { data: configs, isLoading: configsLoading } = useScoringConfigs()
  const { data: activeConfig, isLoading: activeLoading } = useActiveConfig()

  const activateMutation = useActivateConfig()
  const updateWeightMutation = useUpdateWeight()
  const recalculateMutation = useRecalculateScores()
  const createConfigMutation = useCreateConfig()

  const handleCreateConfig = async () => {
    if (!newConfigName.trim()) return

    await createConfigMutation.mutateAsync({
      name: newConfigName.trim(),
      description: newConfigDescription.trim() || undefined,
    })

    setShowNewConfigModal(false)
    setNewConfigName('')
    setNewConfigDescription('')
  }

  const handleUpdateWeight = async (weightId: number, data: { forwards_weight: number; backs_weight: number }) => {
    await updateWeightMutation.mutateAsync({ weightId, data })
  }

  const isLoading = configsLoading || activeLoading

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8 text-rugby-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configuración de Scoring</h1>
            <p className="mt-1 text-gray-500">
              Administra los pesos para el cálculo de puntuación
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => recalculateMutation.mutate()}
          disabled={recalculateMutation.isPending}
          className="btn-primary"
        >
          {recalculateMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Recalculando...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Recalcular Scores
            </>
          )}
        </button>
      </div>

      {/* Recalculate Success Message */}
      {recalculateMutation.isSuccess && (
        <div className="card bg-green-50 border-green-200">
          <p className="text-green-800">
            Scores recalculados exitosamente. {recalculateMutation.data?.stats_updated} estadísticas actualizadas.
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-4" />
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded" />
              ))}
            </div>
          </div>
          <div className="lg:col-span-2 card animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
            <div className="h-96 bg-gray-200 rounded" />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Config Selector */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Configuraciones
            </h2>
            <ConfigSelector
              configs={configs || []}
              activeConfigId={activeConfig?.id}
              onActivate={(id) => activateMutation.mutate(id)}
              onCreateNew={() => setShowNewConfigModal(true)}
              isActivating={activateMutation.isPending}
              activatingId={activateMutation.variables}
            />
          </div>

          {/* Weights Table */}
          <div className="lg:col-span-2 card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Pesos de Puntuación
              {activeConfig && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({activeConfig.name})
                </span>
              )}
            </h2>

            {activeConfig?.weights && activeConfig.weights.length > 0 ? (
              <WeightsTable
                weights={activeConfig.weights}
                onUpdateWeight={handleUpdateWeight}
                isUpdating={updateWeightMutation.isPending}
              />
            ) : (
              <div className="text-center py-8 text-gray-500">
                No hay configuración activa seleccionada
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Config Modal */}
      {showNewConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50">
          <div className="card w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Nueva Configuración
              </h3>
              <button
                type="button"
                onClick={() => setShowNewConfigModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={newConfigName}
                  onChange={(e) => setNewConfigName(e.target.value)}
                  className="input"
                  placeholder="Ej: Config 2024"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción (opcional)
                </label>
                <input
                  type="text"
                  value={newConfigDescription}
                  onChange={(e) => setNewConfigDescription(e.target.value)}
                  className="input"
                  placeholder="Ej: Configuración para la temporada 2024"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowNewConfigModal(false)}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateConfig}
                disabled={!newConfigName.trim() || createConfigMutation.isPending}
                className="btn-primary"
              >
                {createConfigMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Crear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
