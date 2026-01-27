import { Link } from 'react-router-dom'
import { Calendar, MapPin, ChevronRight } from 'lucide-react'
import type { Match } from '../../types'

interface MatchCardProps {
  match: Match
}

export default function MatchCard({ match }: MatchCardProps) {
  const matchDate = match.match_date
    ? new Date(match.match_date).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

  const hasScore = match.our_score !== null && match.opponent_score !== null
  const isWin = hasScore && match.our_score! > match.opponent_score!
  const isLoss = hasScore && match.our_score! < match.opponent_score!

  return (
    <Link
      to={`/matches/${match.id}`}
      className="block rounded-xl bg-white p-5 shadow-sm border border-gray-200 hover:shadow-md hover:border-rugby-200 transition-all duration-200 group"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-rugby-600 transition-colors">
              vs {match.opponent_name}
            </h3>
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-rugby-100 text-rugby-700">
              {match.team}
            </span>
            {match.result && (
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  match.result === 'Victoria'
                    ? 'bg-green-100 text-green-700'
                    : match.result === 'Derrota'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {match.result}
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-500">
            {matchDate && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 flex-shrink-0 text-gray-400" />
                <span>{matchDate}</span>
              </span>
            )}
            {match.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 flex-shrink-0 text-gray-400" />
                <span>{match.location}</span>
              </span>
            )}
          </div>
        </div>

        {hasScore && (
          <div className="flex-shrink-0 text-right">
            <div
              className={`text-2xl font-bold tabular-nums ${
                isWin ? 'text-green-600' : isLoss ? 'text-red-600' : 'text-gray-700'
              }`}
            >
              {match.our_score} - {match.opponent_score}
            </div>
          </div>
        )}

        <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-rugby-600 transition-colors flex-shrink-0" />
      </div>
    </Link>
  )
}
