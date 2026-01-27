import type { PlayerSummary, MatchStat } from '../../types'

interface ComparisonStatsProps {
  summaries: PlayerSummary[]
}

// Stats organized by category
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

// Player colors matching ComparisonHeader
const PLAYER_TEXT_COLORS = [
  'text-rugby-600',
  'text-blue-600',
  'text-purple-600',
  'text-amber-600',
  'text-rose-600',
]

const PLAYER_BG_COLORS = [
  'bg-rugby-50',
  'bg-blue-50',
  'bg-purple-50',
  'bg-amber-50',
  'bg-rose-50',
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
  // Calculate averages for each player
  const playerAverages = summaries.map(s => calculateAverages(s.matches))

  // Find best value for each stat (for highlighting)
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
      <h2 className="text-lg font-semibold text-gray-900 mb-6">
        Estadísticas Promedio por Partido
      </h2>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
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
          <tbody className="divide-y divide-gray-100 bg-white">
            {Object.entries(statCategories).map(([categoryKey, category]) => (
              <>
                {/* Category Header */}
                <tr key={categoryKey} className="bg-gray-50">
                  <td
                    colSpan={summaries.length + 1}
                    className="px-4 py-2 text-sm font-semibold text-gray-700"
                  >
                    {category.label}
                  </td>
                </tr>
                {/* Stats in category */}
                {category.stats.map(stat => {
                  const bestIndex = findBestIndex(stat.key, stat.positive)
                  return (
                    <tr key={stat.key} className="hover:bg-gray-50">
                      <td className="table-cell px-4 py-3 text-gray-600">
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
                                : 'text-gray-900'
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
