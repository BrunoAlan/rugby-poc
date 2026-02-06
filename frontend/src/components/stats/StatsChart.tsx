import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts'

interface ChartData {
  name: string
  value: number
  [key: string]: string | number
}

interface StatsChartProps {
  data: ChartData[]
  type?: 'line' | 'bar'
  dataKey?: string
  xAxisKey?: string
  height?: number
  color?: string
}

export default function StatsChart({
  data,
  type = 'line',
  dataKey = 'value',
  xAxisKey = 'name',
  height = 300,
  color = '#fccf00',
}: StatsChartProps) {
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-dark-400"
        style={{ height }}
      >
        No hay datos para mostrar
      </div>
    )
  }

  const tooltipStyle = {
    backgroundColor: '#002d52',
    border: '1px solid #003f71',
    borderRadius: '8px',
    color: '#e5e7eb',
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      {type === 'line' ? (
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#003f71" />
          <XAxis
            dataKey={xAxisKey}
            tick={{ fill: '#7ab3eb', fontSize: 12 }}
            tickLine={{ stroke: '#003f71' }}
          />
          <YAxis
            tick={{ fill: '#7ab3eb', fontSize: 12 }}
            tickLine={{ stroke: '#003f71' }}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            dot={{ fill: color, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      ) : (
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#003f71" />
          <XAxis
            dataKey={xAxisKey}
            tick={{ fill: '#7ab3eb', fontSize: 12 }}
            tickLine={{ stroke: '#003f71' }}
          />
          <YAxis
            tick={{ fill: '#7ab3eb', fontSize: 12 }}
            tickLine={{ stroke: '#003f71' }}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ color: '#7ab3eb' }} />
          <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      )}
    </ResponsiveContainer>
  )
}
