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
              ? 'ring-2 ring-rugby-500 bg-rugby-50'
              : 'hover:bg-gray-50'
          }`}
          onClick={() => {
            if (config.id !== activeConfigId && !isActivating) {
              onActivate(config.id)
            }
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">{config.name}</h3>
              {config.description && (
                <p className="text-sm text-gray-500 mt-0.5">{config.description}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                Creada: {new Date(config.created_at).toLocaleDateString('es-ES')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {config.id === activeConfigId ? (
                <span className="flex items-center gap-1 rounded-full bg-rugby-600 px-3 py-1 text-xs font-medium text-white">
                  <Check className="h-3 w-3" />
                  Activa
                </span>
              ) : isActivating && activatingId === config.id ? (
                <Loader2 className="h-5 w-5 animate-spin text-rugby-600" />
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
        className="w-full rounded-lg border-2 border-dashed border-gray-300 p-4 text-center hover:border-gray-400 hover:bg-gray-50 transition-colors"
      >
        <Plus className="h-6 w-6 mx-auto text-gray-400" />
        <span className="mt-2 block text-sm font-medium text-gray-600">
          Crear nueva configuración
        </span>
      </button>
    </div>
  )
}
