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

const PLAYER_COLORS = [
  '#fccf00', // primary yellow
  '#3b82f6', // blue
  '#a855f7', // purple
  '#f59e0b', // amber
  '#f43f5e', // rose
]

const shortDateFormatter = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: 'short',
})

export default function ComparisonChart({ summaries }: ComparisonChartProps) {
  const allMatchDates = new Set<string>()

  for (const summary of summaries) {
    for (const match of summary.matches) {
      if (match.match_date) {
        allMatchDates.add(match.match_date)
      }
    }
  }

  const sortedDates = Array.from(allMatchDates).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  )

  const chartData = sortedDates.map(date => {
    const dataPoint: Record<string, string | number | null> = {
      date,
      displayDate: shortDateFormatter.format(new Date(date)),
    }

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
        <h2 className="text-lg font-semibold text-white mb-6">
          Evolución de Puntuación
        </h2>
        <div className="flex items-center justify-center h-64 text-dark-400">
          No hay datos para mostrar
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-white mb-6">
        Evolución de Puntuación
      </h2>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#003f71" />
          <XAxis
            dataKey="displayDate"
            tick={{ fill: '#7ab3eb', fontSize: 12 }}
            tickLine={{ stroke: '#003f71' }}
          />
          <YAxis
            tick={{ fill: '#7ab3eb', fontSize: 12 }}
            tickLine={{ stroke: '#003f71' }}
            domain={['auto', 'auto']}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#002d52',
              border: '1px solid #003f71',
              borderRadius: '8px',
              color: '#e5e7eb',
            }}
            formatter={(value: number, name: string) => [value?.toFixed(1) ?? '-', name]}
            labelFormatter={(label) => `Fecha: ${label}`}
          />
          <Legend wrapperStyle={{ color: '#7ab3eb' }} />
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
