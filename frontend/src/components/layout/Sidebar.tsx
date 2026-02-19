import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Trophy,
  Users,
  Calendar,
  Upload,
  Settings,
  X,
} from 'lucide-react'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Partidos', href: '/matches', icon: Calendar },
  { name: 'Jugadores', href: '/players', icon: Users },
  { name: 'Subir Excel', href: '/upload', icon: Upload },
  { name: 'Configuración', href: '/scoring', icon: Settings },
]

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-dark-950 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex h-20 shrink-0 items-center justify-between px-6 bg-gradient-to-b from-primary-900/20 to-transparent">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 shadow-glow-primary">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="block text-lg font-black uppercase tracking-[0.15em] text-white">
                Rugby Stats
              </span>
              <span className="block text-[10px] uppercase tracking-[0.2em] text-primary-400/80">
                Performance Analytics
              </span>
            </div>
          </div>
          <button
            className="lg:hidden text-dark-400 hover:text-white transition-colors"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col px-4 py-6">
          <ul className="flex flex-1 flex-col gap-1">
            {navigation.map((item) => (
              <li key={item.name}>
                <NavLink
                  to={item.href}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'border-l-[3px] border-primary-400 bg-primary-900/40 text-primary-300 ml-0 pl-[9px]'
                        : 'text-dark-300 hover:bg-dark-800/60 hover:text-white border-l-[3px] border-transparent ml-0 pl-[9px]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <motion.div
                      className="flex items-center gap-3"
                      whileHover={{ x: 4 }}
                      transition={{ duration: 0.2 }}
                    >
                      <item.icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-primary-400' : ''}`} />
                      {item.name}
                    </motion.div>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-dark-800 px-6 py-4">
          <p className="text-xs text-dark-500">
            Rugby Stats Dashboard v0.1.0
          </p>
        </div>
      </div>
    </>
  )
}
