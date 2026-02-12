import { useState } from 'react'
import { Save, Loader2 } from 'lucide-react'
import type { ScoringWeight, WeightUpdate } from '../../types'
import { ALL_POSITIONS, getPositionLabel } from '../../constants/positions'
import WeightInput from './WeightInput'

interface WeightsTableProps {
  weights: ScoringWeight[]
  onUpdateWeight: (weightId: number, data: WeightUpdate) => Promise<void>
  isUpdating?: boolean
}

const ACTION_LABELS: Record<string, string> = {
  tackles_positivos: 'Tackles Positivos',
  tackles: 'Tackles',
  tackles_errados: 'Tackles Errados',
  portador: 'Portador',
  ruck_ofensivos: 'Ruck Ofensivos',
  pases: 'Pases',
  pases_malos: 'Pases Malos',
  perdidas: 'Pérdidas',
  recuperaciones: 'Recuperaciones',
  gana_contacto: 'Gana Contacto',
  quiebres: 'Quiebres',
  penales: 'Penales',
  juego_pie: 'Juego al Pie',
  recepcion_aire_buena: 'Recepción Aérea Buena',
  recepcion_aire_mala: 'Recepción Aérea Mala',
  try_: 'Try',
}

export default function WeightsTable({ weights, onUpdateWeight, isUpdating }: WeightsTableProps) {
  const [selectedPosition, setSelectedPosition] = useState(1)
  const [pendingChanges, setPendingChanges] = useState<Record<number, number>>({})
  const [savingId, setSavingId] = useState<number | null>(null)

  // Filter weights for selected position
  const positionWeights = weights.filter((w) => w.position === selectedPosition)

  const handleWeightChange = (weightId: number, value: number) => {
    setPendingChanges((prev) => ({ ...prev, [weightId]: value }))
  }

  const handleSave = async (weightId: number) => {
    const newWeight = pendingChanges[weightId]
    if (newWeight === undefined) return

    setSavingId(weightId)
    try {
      await onUpdateWeight(weightId, { weight: newWeight })
      setPendingChanges((prev) => {
        const next = { ...prev }
        delete next[weightId]
        return next
      })
    } finally {
      setSavingId(null)
    }
  }

  const hasChanges = (weightId: number) => pendingChanges[weightId] !== undefined

  return (
    <div className="space-y-4">
      {/* Position Tabs */}
      <div className="flex flex-wrap gap-1">
        {ALL_POSITIONS.map((pos) => (
          <button
            key={pos}
            type="button"
            onClick={() => setSelectedPosition(pos)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedPosition === pos
                ? 'bg-primary-500 text-white'
                : 'bg-dark-700/50 text-dark-300 hover:bg-dark-700 hover:text-white'
            }`}
          >
            {getPositionLabel(pos)}
          </button>
        ))}
      </div>

      {/* Weights Table */}
      <div className="overflow-hidden rounded-lg border border-dark-700/50">
        <table className="min-w-full divide-y divide-dark-700/50">
          <thead>
            <tr>
              <th className="table-header px-4 py-3">Acción</th>
              <th className="table-header px-4 py-3 text-center">Peso</th>
              <th className="table-header px-4 py-3 w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-700/30">
            {positionWeights.map((weight) => {
              const currentValue = pendingChanges[weight.id] ?? weight.weight

              return (
                <tr key={weight.id} className="hover:bg-dark-700/30">
                  <td className="table-cell font-medium text-gray-200">
                    {ACTION_LABELS[weight.action_name] || weight.action_name}
                  </td>
                  <td className="table-cell text-center">
                    <WeightInput
                      value={currentValue}
                      onChange={(value) => handleWeightChange(weight.id, value)}
                      disabled={isUpdating || savingId === weight.id}
                    />
                  </td>
                  <td className="table-cell text-center">
                    {hasChanges(weight.id) && (
                      <button
                        type="button"
                        onClick={() => handleSave(weight.id)}
                        disabled={savingId === weight.id}
                        className="btn-primary py-1 px-2 text-xs"
                      >
                        {savingId === weight.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Save className="h-3 w-3" />
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
