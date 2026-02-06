import type { Match } from '../../types'
import MatchCard from './MatchCard'
import AnimatedList, { listItem } from '../ui/AnimatedList'
import { motion } from 'framer-motion'

interface MatchListProps {
  matches: Match[]
  loading?: boolean
}

export default function MatchList({ matches, loading }: MatchListProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card">
            <div className="skeleton h-6 w-1/3 rounded mb-3" />
            <div className="skeleton h-4 w-1/4 rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (matches.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-dark-400">No hay partidos registrados</p>
      </div>
    )
  }

  return (
    <AnimatedList className="space-y-4">
      {matches.map((match) => (
        <motion.div key={match.id} variants={listItem}>
          <MatchCard match={match} />
        </motion.div>
      ))}
    </AnimatedList>
  )
}
