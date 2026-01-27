import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { PlayerSummary } from '../../types'

interface ComparisonChartProps {
  summaries: PlayerSummary[]
}

// Recharts-compatible hex colors
const PLAYER_COLORS = [
  '#16a34a', // rugby green
  '#2563eb', // blue
  '#9333ea', // purple
  '#d97706', // amber
  '#e11d48', // rose
]

// Date formatter for consistent localization
const shortDateFormatter = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: 'short',
})

export default function ComparisonChart({ summaries }: ComparisonChartProps) {
  // Build unified chart data with all matches
  // Each data point has: date, opponent, and score for each player (if they played)
  const allMatchDates = new Set<string>()

  // Collect all unique match dates
  for (const summary of summaries) {
    for (const match of summary.matches) {
      if (match.match_date) {
        allMatchDates.add(match.match_date)
      }
    }
  }

  // Sort dates chronologically
  const sortedDates = Array.from(allMatchDates).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  )

  // Build chart data
  const chartData = sortedDates.map(date => {
    const dataPoint: Record<string, string | number | null> = {
      date,
      displayDate: shortDateFormatter.format(new Date(date)),
    }

    // Find each player's score for this date
    for (const summary of summaries) {
      const match = summary.matches.find(m => m.match_date === date)
      dataPoint[summary.player_name] = match ? match.score : null
      if (match) {
        dataPoint[`${summary.player_name}_opponent`] = match.opponent
      }
    }

    return dataPoint
  })

  if (chartData.length === 0) {
    return (
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          Evolución de Puntuación
        </h2>
        <div className="flex items-center justify-center h-64 text-gray-500">
          No hay datos para mostrar
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">
        Evolución de Puntuación
      </h2>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="displayDate"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickLine={{ stroke: '#e5e7eb' }}
            domain={['auto', 'auto']}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
            formatter={(value: number, name: string) => [value?.toFixed(1) ?? '-', name]}
            labelFormatter={(label) => `Fecha: ${label}`}
          />
          <Legend />
          {summaries.map((summary, index) => (
            <Line
              key={summary.player_name}
              type="monotone"
              dataKey={summary.player_name}
              name={summary.player_name}
              stroke={PLAYER_COLORS[index % PLAYER_COLORS.length]}
              strokeWidth={2}
              dot={{ fill: PLAYER_COLORS[index % PLAYER_COLORS.length], strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
              connectNulls={true}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
