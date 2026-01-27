import type { ReactNode } from 'react'

interface StatItem {
  label: string
  value: string | number
  icon?: ReactNode
  change?: number
}

interface StatsSummaryProps {
  stats: StatItem[]
  loading?: boolean
}

export default function StatsSummary({ stats, loading }: StatsSummaryProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
            <div className="h-8 bg-gray-200 rounded w-1/3" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div key={index} className="card">
          <div className="flex items-center gap-3">
            {stat.icon && (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rugby-100 text-rugby-600">
                {stat.icon}
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">{stat.label}</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                {stat.change !== undefined && (
                  <span
                    className={`text-sm font-medium ${
                      stat.change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {stat.change >= 0 ? '+' : ''}{stat.change}%
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
