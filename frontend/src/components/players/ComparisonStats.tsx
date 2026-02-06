import type { PlayerSummary, MatchStat } from '../../types'

interface ComparisonStatsProps {
  summaries: PlayerSummary[]
}

const statCategories = {
  tackles: {
    label: 'Tackles',
    stats: [
      { key: 'tackles_positivos', label: 'Positivos', positive: true },
      { key: 'tackles', label: 'Totales', positive: true },
      { key: 'tackles_errados', label: 'Errados', positive: false },
    ],
  },
  attack: {
    label: 'Ataque',
    stats: [
      { key: 'portador', label: 'Portador', positive: true },
      { key: 'quiebres', label: 'Quiebres', positive: true },
      { key: 'gana_contacto', label: 'Gana Contacto', positive: true },
      { key: 'try_', label: 'Tries', positive: true },
    ],
  },
  passing: {
    label: 'Pases',
    stats: [
      { key: 'pases', label: 'Pases', positive: true },
      { key: 'pases_malos', label: 'Pases Malos', positive: false },
    ],
  },
  other: {
    label: 'Otros',
    stats: [
      { key: 'ruck_ofensivos', label: 'Ruck Ofensivos', positive: true },
      { key: 'perdidas', label: 'Pérdidas', positive: false },
      { key: 'recuperaciones', label: 'Recuperaciones', positive: true },
      { key: 'penales', label: 'Penales', positive: false },
      { key: 'juego_pie', label: 'Juego Pie', positive: true },
      { key: 'recepcion_aire_buena', label: 'Recepción Aire (Buena)', positive: true },
      { key: 'recepcion_aire_mala', label: 'Recepción Aire (Mala)', positive: false },
    ],
  },
}

const PLAYER_TEXT_COLORS = [
  'text-primary-400',
  'text-blue-400',
  'text-purple-400',
  'text-amber-400',
  'text-rose-400',
]

const PLAYER_BG_COLORS = [
  'bg-primary-500/10',
  'bg-blue-500/10',
  'bg-purple-500/10',
  'bg-amber-500/10',
  'bg-rose-500/10',
]

function calculateAverages(matches: MatchStat[]): Record<string, number> {
  if (matches.length === 0) return {}

  const totals: Record<string, number> = {}
  const statKeys = Object.values(statCategories).flatMap(cat => cat.stats.map(s => s.key))

  for (const key of statKeys) {
    totals[key] = 0
  }

  for (const match of matches) {
    for (const key of statKeys) {
      totals[key] += (match as unknown as Record<string, number>)[key] || 0
    }
  }

  const averages: Record<string, number> = {}
  for (const key of statKeys) {
    averages[key] = totals[key] / matches.length
  }

  return averages
}

export default function ComparisonStats({ summaries }: ComparisonStatsProps) {
  const playerAverages = summaries.map(s => calculateAverages(s.matches))

  const findBestIndex = (statKey: string, isPositive: boolean): number => {
    const values = playerAverages.map(avg => avg[statKey] || 0)
    if (isPositive) {
      const max = Math.max(...values)
      return values.indexOf(max)
    } else {
      const min = Math.min(...values)
      return values.indexOf(min)
    }
  }

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-white mb-6">
        Estadísticas Promedio por Partido
      </h2>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-dark-700/50">
          <thead>
            <tr>
              <th className="table-header px-4 py-3 text-left">Estadística</th>
              {summaries.map((summary, index) => (
                <th
                  key={summary.player_name}
                  className={`table-header px-4 py-3 text-center ${PLAYER_TEXT_COLORS[index % PLAYER_TEXT_COLORS.length]}`}
                >
                  {summary.player_name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-700/30">
            {Object.entries(statCategories).map(([categoryKey, category]) => (
              <>
                <tr key={categoryKey} className="bg-dark-900/40">
                  <td
                    colSpan={summaries.length + 1}
                    className="px-4 py-2 text-sm font-semibold text-dark-300"
                  >
                    {category.label}
                  </td>
                </tr>
                {category.stats.map(stat => {
                  const bestIndex = findBestIndex(stat.key, stat.positive)
                  return (
                    <tr key={stat.key} className="hover:bg-dark-700/30">
                      <td className="table-cell px-4 py-3 text-dark-300">
                        {stat.label}
                      </td>
                      {playerAverages.map((avg, index) => {
                        const isBest = index === bestIndex
                        return (
                          <td
                            key={index}
                            className={`table-cell px-4 py-3 text-center tabular-nums ${
                              isBest
                                ? `font-bold ${PLAYER_TEXT_COLORS[index % PLAYER_TEXT_COLORS.length]} ${PLAYER_BG_COLORS[index % PLAYER_BG_COLORS.length]}`
                                : 'text-gray-300'
                            }`}
                          >
                            {(avg[stat.key] || 0).toFixed(1)}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
