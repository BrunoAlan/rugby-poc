interface GlowBadgeProps {
  variant: 'win' | 'loss' | 'draw'
  children: React.ReactNode
  className?: string
}

const variantStyles = {
  win: 'bg-green-500/20 text-green-400 border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.2)]',
  loss: 'bg-red-500/20 text-red-400 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]',
  draw: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.2)]',
}

export default function GlowBadge({ variant, children, className = '' }: GlowBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
