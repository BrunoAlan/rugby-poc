import type { Match } from '../../types'
import MatchCard from './MatchCard'

interface MatchListProps {
  matches: Match[]
  loading?: boolean
}

export default function MatchList({ matches, loading }: MatchListProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-3" />
            <div className="h-4 bg-gray-200 rounded w-1/4" />
          </div>
        ))}
      </div>
    )
  }

  if (matches.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500">No hay partidos registrados</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {matches.map((match) => (
        <MatchCard key={match.id} match={match} />
      ))}
    </div>
  )
}
