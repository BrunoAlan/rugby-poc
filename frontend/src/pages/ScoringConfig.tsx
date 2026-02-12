import { useState } from 'react'
import { Settings, RefreshCw, Plus, X, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
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
import AnimatedPage from '../components/ui/AnimatedPage'

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

  const handleUpdateWeight = async (weightId: number, data: { weight: number }) => {
    await updateWeightMutation.mutateAsync({ weightId, data })
  }

  const isLoading = configsLoading || activeLoading

  return (
    <AnimatedPage className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 shadow-glow-primary">
            <Settings className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Configuración de Scoring</h1>
            <p className="mt-1 text-dark-300">
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
        <div className="card bg-green-900/20 border-green-500/30">
          <p className="text-green-400">
            Scores recalculados exitosamente. {recalculateMutation.data?.stats_updated} estadísticas actualizadas.
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card">
            <div className="skeleton h-6 w-1/2 rounded mb-4" />
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="skeleton h-20 rounded" />
              ))}
            </div>
          </div>
          <div className="lg:col-span-2 card">
            <div className="skeleton h-6 w-1/3 rounded mb-4" />
            <div className="skeleton h-96 rounded" />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Config Selector */}
          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-4">
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
            <h2 className="text-lg font-semibold text-white mb-4">
              Pesos de Puntuación
              {activeConfig && (
                <span className="ml-2 text-sm font-normal text-dark-400">
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
              <div className="text-center py-8 text-dark-400">
                No hay configuración activa seleccionada
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Config Modal */}
      <AnimatePresence>
        {showNewConfigModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="card w-full max-w-md mx-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Nueva Configuración
                </h3>
                <button
                  type="button"
                  onClick={() => setShowNewConfigModal(false)}
                  className="text-dark-400 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1">
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
                  <label className="block text-sm font-medium text-dark-300 mb-1">
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
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AnimatedPage>
  )
}
