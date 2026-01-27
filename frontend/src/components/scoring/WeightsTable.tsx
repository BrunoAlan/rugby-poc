import { useState } from 'react'
import { Save, Loader2 } from 'lucide-react'
import type { ScoringWeight, WeightUpdate } from '../../types'
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
  const [pendingChanges, setPendingChanges] = useState<Record<number, WeightUpdate>>({})
  const [savingId, setSavingId] = useState<number | null>(null)

  const handleWeightChange = (weight: ScoringWeight, field: 'forwards_weight' | 'backs_weight', value: number) => {
    setPendingChanges((prev) => ({
      ...prev,
      [weight.id]: {
        forwards_weight: field === 'forwards_weight' ? value : (prev[weight.id]?.forwards_weight ?? weight.forwards_weight),
        backs_weight: field === 'backs_weight' ? value : (prev[weight.id]?.backs_weight ?? weight.backs_weight),
      },
    }))
  }

  const handleSave = async (weightId: number) => {
    const changes = pendingChanges[weightId]
    if (!changes) return

    setSavingId(weightId)
    try {
      await onUpdateWeight(weightId, changes)
      setPendingChanges((prev) => {
        const next = { ...prev }
        delete next[weightId]
        return next
      })
    } finally {
      setSavingId(null)
    }
  }

  const hasChanges = (weightId: number) => !!pendingChanges[weightId]

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="table-header px-4 py-3">Acción</th>
            <th className="table-header px-4 py-3 text-center">Peso Forwards</th>
            <th className="table-header px-4 py-3 text-center">Peso Backs</th>
            <th className="table-header px-4 py-3 w-24"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {weights.map((weight) => {
            const currentForwards = pendingChanges[weight.id]?.forwards_weight ?? weight.forwards_weight
            const currentBacks = pendingChanges[weight.id]?.backs_weight ?? weight.backs_weight

            return (
              <tr key={weight.id} className="hover:bg-gray-50">
                <td className="table-cell font-medium text-gray-900">
                  {ACTION_LABELS[weight.action_name] || weight.action_name}
                </td>
                <td className="table-cell text-center">
                  <WeightInput
                    value={currentForwards}
                    onChange={(value) => handleWeightChange(weight, 'forwards_weight', value)}
                    disabled={isUpdating || savingId === weight.id}
                  />
                </td>
                <td className="table-cell text-center">
                  <WeightInput
                    value={currentBacks}
                    onChange={(value) => handleWeightChange(weight, 'backs_weight', value)}
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
  )
}
