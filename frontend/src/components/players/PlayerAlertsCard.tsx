import { useState } from 'react'
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
import { usePlayerAnomalies } from '../../hooks/usePlayers'

interface PlayerAlertsCardProps {
  playerId: number
}

const STAT_LABELS: Record<string, string> = {
  tackles_positivos: 'Tackles Positivos',
  tackles: 'Tackles Totales',
  tackles_errados: 'Tackles Errados',
  portador: 'Portador',
  ruck_ofensivos: 'Ruck Ofensivos',
  pases: 'Pases',
  pases_malos: 'Pases Malos',
  perdidas: 'Perdidas',
  recuperaciones: 'Recuperaciones',
  gana_contacto: 'Gana Contacto',
  quiebres: 'Quiebres',
  penales: 'Penales',
  juego_pie: 'Juego Pie',
  recepcion_aire_buena: 'Recepcion Aire (Buena)',
  recepcion_aire_mala: 'Recepcion Aire (Mala)',
  try_: 'Tries',
}

export default function PlayerAlertsCard({ playerId }: PlayerAlertsCardProps) {
  const [mode, setMode] = useState<'all' | 'recent'>('all')
  const { data: anomalies, isLoading } = usePlayerAnomalies(playerId, mode)

  if (isLoading || !anomalies) return null

  const positiveAlerts = Object.entries(anomalies.anomalies).filter(
    ([, v]) => v.alert === 'positive'
  )
  const negativeAlerts = Object.entries(anomalies.anomalies).filter(
    ([, v]) => v.alert === 'negative'
  )

  if (positiveAlerts.length === 0 && negativeAlerts.length === 0) return null

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-400" />
          <h2 className="text-lg font-semibold text-white">
            Alertas del Ultimo Partido
          </h2>
        </div>
        <div className="flex rounded-lg bg-dark-900/60 p-1">
          <button
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              mode === 'all'
                ? 'bg-primary-500/20 text-primary-400'
                : 'text-dark-400 hover:text-dark-200'
            }`}
            onClick={() => setMode('all')}
          >
            Historial completo
          </button>
          <button
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              mode === 'recent'
                ? 'bg-primary-500/20 text-primary-400'
                : 'text-dark-400 hover:text-dark-200'
            }`}
            onClick={() => setMode('recent')}
          >
            Ultimos 5
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {positiveAlerts.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-green-400 mb-2">Mejoras</h3>
            {positiveAlerts.map(([stat, data]) => (
              <div
                key={stat}
                className="flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/20 px-3 py-2"
              >
                <TrendingUp className="h-4 w-4 text-green-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-green-300 font-medium">
                    {STAT_LABELS[stat] || stat}
                  </span>
                  <span className="text-xs text-green-400/70 ml-2">
                    {data.last_value} (med. {data.median_all}, {data.deviation_pct > 0 ? '+' : ''}
                    {data.deviation_pct}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {negativeAlerts.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-red-400 mb-2">A mejorar</h3>
            {negativeAlerts.map(([stat, data]) => (
              <div
                key={stat}
                className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2"
              >
                <TrendingDown className="h-4 w-4 text-red-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-red-300 font-medium">
                    {STAT_LABELS[stat] || stat}
                  </span>
                  <span className="text-xs text-red-400/70 ml-2">
                    {data.last_value} (med. {data.median_all}, {data.deviation_pct > 0 ? '+' : ''}
                    {data.deviation_pct}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
