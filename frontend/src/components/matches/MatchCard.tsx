import { Link } from 'react-router-dom'
import { Calendar, MapPin, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import GlowBadge from '../ui/GlowBadge'
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
    <Link to={`/matches/${match.id}`}>
      <motion.div
        className="block rounded-xl bg-dark-800/70 p-5 border border-dark-700/50 hover:border-dark-600 transition-all duration-200 group shadow-card hover:shadow-card-hover"
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="text-lg font-semibold text-white group-hover:text-primary-400 transition-colors">
                vs {match.opponent_name}
              </h3>
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-primary-500/20 text-primary-400 border border-primary-500/30">
                {match.team}
              </span>
              {match.result && (
                <GlowBadge
                  variant={match.result === 'Victoria' ? 'win' : match.result === 'Derrota' ? 'loss' : 'draw'}
                >
                  {match.result}
                </GlowBadge>
              )}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-dark-300">
              {matchDate && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 flex-shrink-0 text-dark-400" />
                  <span>{matchDate}</span>
                </span>
              )}
              {match.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 flex-shrink-0 text-dark-400" />
                  <span>{match.location}</span>
                </span>
              )}
            </div>
          </div>

          {hasScore && (
            <div className="flex-shrink-0 text-right">
              <div
                className={`text-2xl font-black tabular-nums ${
                  isWin ? 'text-green-400' : isLoss ? 'text-red-400' : 'text-gray-300'
                }`}
              >
                {match.our_score} - {match.opponent_score}
              </div>
            </div>
          )}

          <ChevronRight className="h-5 w-5 text-dark-500 group-hover:text-primary-400 transition-colors flex-shrink-0" />
        </div>
      </motion.div>
    </Link>
  )
}
