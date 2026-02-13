import { useState } from 'react'
import { User, TrendingUp, Calendar, Clock, Pencil, Check, X, Weight, Ruler } from 'lucide-react'
import CountUp from '../ui/CountUp'
import { getPositionLabel } from '../../constants/positions'
import { useUpdatePlayer } from '../../hooks/usePlayers'
import type { PlayerSummary as PlayerSummaryType } from '../../types'

interface PlayerSummaryProps {
  summary: PlayerSummaryType
  playerId: number
  onNameChange?: (newName: string) => void
}

export default function PlayerSummary({ summary, playerId, onNameChange }: PlayerSummaryProps) {
  const { player_name, matches_played, total_minutes, avg_puntuacion_final, matches, weight_kg, height_cm } = summary

  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(player_name)
  const [editWeight, setEditWeight] = useState(weight_kg?.toString() || '')
  const [editHeight, setEditHeight] = useState(height_cm?.toString() || '')
  const [error, setError] = useState<string | null>(null)

  const updatePlayer = useUpdatePlayer()

  // Get most common position
  const primaryPosition = matches && matches.length > 0
    ? (() => {
        const counts: Record<number, number> = {}
        for (const m of matches) {
          counts[m.puesto] = (counts[m.puesto] || 0) + 1
        }
        return Number(Object.entries(counts).sort(([, a], [, b]) => b - a)[0][0])
      })()
    : null

  const isForward = primaryPosition !== null && primaryPosition <= 8

  const handleSave = async () => {
    try {
      setError(null)
      await updatePlayer.mutateAsync({
        id: playerId,
        data: {
          name: editName,
          weight_kg: editWeight ? parseFloat(editWeight) : null,
          height_cm: editHeight ? parseFloat(editHeight) : null,
        },
      })
      setIsEditing(false)
      if (editName !== player_name && onNameChange) {
        onNameChange(editName)
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { status?: number } }
      if (axiosError.response?.status === 409) {
        setError('Ya existe un jugador con ese nombre')
      } else {
        setError('Error al guardar los cambios')
      }
    }
  }

  const handleCancel = () => {
    setEditName(player_name)
    setEditWeight(weight_kg?.toString() || '')
    setEditHeight(height_cm?.toString() || '')
    setError(null)
    setIsEditing(false)
  }

  return (
    <div className="card">
      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 shadow-glow-primary">
          <User className="h-10 w-10 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          {isEditing ? (
            <>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="bg-dark-900/60 border border-dark-700/30 rounded-lg px-3 py-2 text-white text-3xl font-black focus:border-primary-500 focus:outline-none flex-1 min-w-0"
                />
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleSave}
                    disabled={updatePlayer.isPending}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary-500/15 px-3 py-1.5 text-sm font-medium text-primary-400 border border-primary-500/30 hover:bg-primary-500/25 hover:border-primary-400/50 transition-all"
                    title="Guardar"
                  >
                    <Check className="h-4 w-4" />
                    Guardar
                  </button>
                  <button
                    onClick={handleCancel}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-dark-700/50 px-3 py-1.5 text-sm font-medium text-dark-300 border border-dark-600/50 hover:bg-dark-700 hover:text-white transition-all"
                    title="Cancelar"
                  >
                    <X className="h-4 w-4" />
                    Cancelar
                  </button>
                </div>
              </div>
              {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Weight className="h-4 w-4 text-dark-400" />
                  <input
                    type="number"
                    value={editWeight}
                    onChange={(e) => setEditWeight(e.target.value)}
                    placeholder="Peso (kg)"
                    className="bg-dark-900/60 border border-dark-700/30 rounded-lg px-3 py-2 text-white text-sm focus:border-primary-500 focus:outline-none w-28"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Ruler className="h-4 w-4 text-dark-400" />
                  <input
                    type="number"
                    value={editHeight}
                    onChange={(e) => setEditHeight(e.target.value)}
                    placeholder="Altura (cm)"
                    className="bg-dark-900/60 border border-dark-700/30 rounded-lg px-3 py-2 text-white text-sm focus:border-primary-500 focus:outline-none w-28"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-black text-white flex-1 min-w-0 truncate">{player_name}</h2>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-dark-700/40 px-3 py-1.5 text-sm font-medium text-dark-300 border border-dark-600/30 hover:bg-dark-700 hover:text-primary-400 hover:border-primary-500/30 transition-all"
                    title="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                    Editar
                  </button>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                {primaryPosition !== null && (
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                      isForward
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    }`}
                  >
                    {getPositionLabel(primaryPosition)}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-sm text-dark-300">
                  <Weight className="h-4 w-4 text-dark-400" />
                  {weight_kg ? `${weight_kg} kg` : 'Sin datos'}
                </span>
                <span className="inline-flex items-center gap-1 text-sm text-dark-300">
                  <Ruler className="h-4 w-4 text-dark-400" />
                  {height_cm ? `${height_cm} cm` : 'Sin datos'}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg bg-dark-900/60 p-4 border border-dark-700/30">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-dark-400" />
            <span className="text-sm text-dark-300">Partidos Jugados</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-white">
            <CountUp end={matches_played} />
          </p>
        </div>

        <div className="rounded-lg bg-dark-900/60 p-4 border border-dark-700/30">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-dark-400" />
            <span className="text-sm text-dark-300">Minutos Totales</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-white">
            <CountUp end={total_minutes ? Math.round(total_minutes) : 0} />
          </p>
        </div>

        <div className="rounded-lg bg-dark-900/60 p-4 border border-dark-700/30">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-dark-400" />
            <span className="text-sm text-dark-300">Promedio por Partido</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-primary-400">
            <CountUp end={avg_puntuacion_final || 0} decimals={2} />
          </p>
        </div>
      </div>
    </div>
  )
}
