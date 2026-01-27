import { Calendar, MapPin, Trophy } from 'lucide-react'
import type { Match } from '../../types'

interface MatchDetailsProps {
  match: Match
}

export default function MatchDetails({ match }: MatchDetailsProps) {
  const matchDate = match.match_date
    ? new Date(match.match_date).toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Fecha no disponible'

  const hasScore = match.our_score !== undefined && match.opponent_score !== undefined
  const isWin = hasScore && match.our_score! > match.opponent_score!
  const isDraw = hasScore && match.our_score === match.opponent_score

  return (
    <div className="card">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900">
              vs {match.opponent_name}
            </h2>
            <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-rugby-100 text-rugby-700">
              {match.team}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-gray-500">
            <span className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {matchDate}
            </span>
            {match.location && (
              <span className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {match.location}
              </span>
            )}
          </div>
        </div>

        {hasScore && (
          <div
            className={`flex items-center gap-3 rounded-xl px-6 py-4 ${
              isWin
                ? 'bg-green-100'
                : isDraw
                ? 'bg-yellow-100'
                : 'bg-red-100'
            }`}
          >
            <Trophy
              className={`h-8 w-8 ${
                isWin
                  ? 'text-green-600'
                  : isDraw
                  ? 'text-yellow-600'
                  : 'text-red-600'
              }`}
            />
            <div className="text-center">
              <span
                className={`text-3xl font-bold ${
                  isWin
                    ? 'text-green-800'
                    : isDraw
                    ? 'text-yellow-800'
                    : 'text-red-800'
                }`}
              >
                {match.our_score} - {match.opponent_score}
              </span>
              <p
                className={`text-sm font-medium ${
                  isWin
                    ? 'text-green-700'
                    : isDraw
                    ? 'text-yellow-700'
                    : 'text-red-700'
                }`}
              >
                {isWin ? 'Victoria' : isDraw ? 'Empate' : 'Derrota'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
