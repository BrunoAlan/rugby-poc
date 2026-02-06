import type { ReactNode } from 'react'
import AnimatedCard from '../ui/AnimatedCard'
import CountUp from '../ui/CountUp'

interface StatItem {
  label: string
  value: string | number
  icon?: ReactNode
  change?: number
  color?: string
  iconBg?: string
  iconColor?: string
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
          <div key={i} className="card">
            <div className="skeleton h-4 w-1/2 rounded mb-3" />
            <div className="skeleton h-8 w-1/3 rounded" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <AnimatedCard key={index} index={index}>
          <div className={`card border-l-4 ${stat.color || 'border-primary-500'}`}>
            <div className="flex items-center gap-3">
              {stat.icon && (
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${stat.iconBg || 'from-primary-500/20 to-primary-600/10'} ${stat.iconColor || 'text-primary-400'}`}>
                  {stat.icon}
                </div>
              )}
              <div>
                <p className="text-sm text-dark-300">{stat.label}</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-white">
                    {typeof stat.value === 'number' ? (
                      <CountUp end={stat.value} />
                    ) : (
                      stat.value
                    )}
                  </p>
                  {stat.change !== undefined && (
                    <span
                      className={`text-sm font-medium ${
                        stat.change >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {stat.change >= 0 ? '+' : ''}{stat.change}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </AnimatedCard>
      ))}
    </div>
  )
}
