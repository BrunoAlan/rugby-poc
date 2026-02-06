import { Check, Plus, Loader2 } from 'lucide-react'
import type { ScoringConfig } from '../../types'

interface ConfigSelectorProps {
  configs: ScoringConfig[]
  activeConfigId?: number
  onActivate: (id: number) => void
  onCreateNew: () => void
  isActivating?: boolean
  activatingId?: number
}

export default function ConfigSelector({
  configs,
  activeConfigId,
  onActivate,
  onCreateNew,
  isActivating,
  activatingId,
}: ConfigSelectorProps) {
  return (
    <div className="space-y-3">
      {configs.map((config) => (
        <div
          key={config.id}
          className={`card cursor-pointer transition-all ${
            config.id === activeConfigId
              ? 'ring-2 ring-primary-500 bg-primary-900/20'
              : 'hover:bg-dark-700/50'
          }`}
          onClick={() => {
            if (config.id !== activeConfigId && !isActivating) {
              onActivate(config.id)
            }
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-white">{config.name}</h3>
              {config.description && (
                <p className="text-sm text-dark-300 mt-0.5">{config.description}</p>
              )}
              <p className="text-xs text-dark-500 mt-1">
                Creada: {new Date(config.created_at).toLocaleDateString('es-ES')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {config.id === activeConfigId ? (
                <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-primary-500 to-primary-400 px-3 py-1 text-xs font-medium text-dark-900">
                  <Check className="h-3 w-3" />
                  Activa
                </span>
              ) : isActivating && activatingId === config.id ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary-400" />
              ) : (
                <button
                  type="button"
                  className="btn-secondary py-1 px-3 text-xs"
                  onClick={(e) => {
                    e.stopPropagation()
                    onActivate(config.id)
                  }}
                  disabled={isActivating}
                >
                  Activar
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={onCreateNew}
        className="w-full rounded-lg border-2 border-dashed border-dark-600 p-4 text-center hover:border-primary-500/50 hover:bg-dark-800/50 transition-colors"
      >
        <Plus className="h-6 w-6 mx-auto text-dark-400" />
        <span className="mt-2 block text-sm font-medium text-dark-300">
          Crear nueva configuración
        </span>
      </button>
    </div>
  )
}
