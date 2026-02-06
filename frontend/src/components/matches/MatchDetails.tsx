import { Calendar, MapPin, Trophy } from 'lucide-react'
import CountUp from '../ui/CountUp'
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
    <div className="card border-t-2 border-primary-500">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-white">
              vs {match.opponent_name}
            </h2>
            <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-primary-500/20 text-primary-400 border border-primary-500/30">
              {match.team}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-dark-300">
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
                ? 'bg-green-500/10 border border-green-500/30'
                : isDraw
                ? 'bg-yellow-500/10 border border-yellow-500/30'
                : 'bg-red-500/10 border border-red-500/30'
            }`}
          >
            <Trophy
              className={`h-8 w-8 ${
                isWin
                  ? 'text-green-400'
                  : isDraw
                  ? 'text-yellow-400'
                  : 'text-red-400'
              }`}
            />
            <div className="text-center">
              <span
                className={`text-5xl font-black ${
                  isWin
                    ? 'text-green-400'
                    : isDraw
                    ? 'text-yellow-400'
                    : 'text-red-400'
                }`}
              >
                <CountUp end={match.our_score!} /> - <CountUp end={match.opponent_score!} />
              </span>
              <p
                className={`text-sm font-medium ${
                  isWin
                    ? 'text-green-400/80'
                    : isDraw
                    ? 'text-yellow-400/80'
                    : 'text-red-400/80'
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
