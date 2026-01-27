import { X } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { PlayerMatchStatsResponse, Player } from '../../types'

interface PlayerStatsModalProps {
  stats: PlayerMatchStatsResponse
  player: Player | undefined
  onClose: () => void
}

export default function PlayerStatsModal({ stats, player, onClose }: PlayerStatsModalProps) {
  const playerName = player?.name || `Jugador ${stats.player_id}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{playerName}</h2>
            <p className="text-sm text-gray-500">
              Puesto: #{stats.puesto} | Tiempo: {stats.tiempo_juego} min
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Stats Body */}
        <div className="p-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Tackles */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 border-b pb-1">
                Tackles
              </h3>
              <dl className="space-y-2">
                <StatRow label="Positivos" value={stats.tackles_positivos} />
                <StatRow label="Totales" value={stats.tackles} />
                <StatRow label="Errados" value={stats.tackles_errados} negative />
              </dl>
            </div>

            {/* Ataque */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 border-b pb-1">
                Ataque
              </h3>
              <dl className="space-y-2">
                <StatRow label="Portador" value={stats.portador} />
                <StatRow label="Quiebres" value={stats.quiebres} highlight />
                <StatRow label="Gana Contacto" value={stats.gana_contacto} />
                <StatRow label="Tries" value={stats.try_} highlight />
              </dl>
            </div>

            {/* Pases */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 border-b pb-1">
                Pases
              </h3>
              <dl className="space-y-2">
                <StatRow label="Pases" value={stats.pases} />
                <StatRow label="Pases Malos" value={stats.pases_malos} negative />
              </dl>
            </div>

            {/* Otros */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 border-b pb-1">
                Otros
              </h3>
              <dl className="space-y-2">
                <StatRow label="Ruck Ofensivos" value={stats.ruck_ofensivos} />
                <StatRow label="Pérdidas" value={stats.perdidas} negative />
                <StatRow label="Recuperaciones" value={stats.recuperaciones} highlight />
                <StatRow label="Penales" value={stats.penales} negative />
                <StatRow label="Juego Pie" value={stats.juego_pie} />
                <StatRow label="Recep. Aire (+)" value={stats.recepcion_aire_buena} />
                <StatRow label="Recep. Aire (-)" value={stats.recepcion_aire_mala} negative />
              </dl>
            </div>
          </div>

          {/* Score Section */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Puntuación Final:</span>
              <span className="text-2xl font-bold text-rugby-600">
                {stats.puntuacion_final?.toFixed(2) ?? '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <Link
            to={`/players/${encodeURIComponent(playerName)}`}
            className="btn-primary w-full text-center"
          >
            Ver perfil completo
          </Link>
        </div>
      </div>
    </div>
  )
}

interface StatRowProps {
  label: string
  value: number
  highlight?: boolean
  negative?: boolean
}

function StatRow({ label, value, highlight, negative }: StatRowProps) {
  let valueClass = 'text-gray-900'
  if (highlight && value > 0) valueClass = 'text-green-600 font-semibold'
  if (negative && value > 0) valueClass = 'text-red-600'

  return (
    <div className="flex justify-between">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className={`text-sm font-medium ${valueClass}`}>{value}</dd>
    </div>
  )
}
