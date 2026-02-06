import { motion } from 'framer-motion'

interface ProgressBarProps {
  value: number
  max?: number
  color?: string
  className?: string
}

export default function ProgressBar({ value, max = 100, color = 'bg-primary-500', className = '' }: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100)

  return (
    <div className={`h-2 w-full rounded-full bg-dark-700 overflow-hidden ${className}`}>
      <motion.div
        className={`h-full rounded-full ${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </div>
  )
}
