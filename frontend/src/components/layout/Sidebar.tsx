import { NavLink } from 'react-router-dom'
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
  { name: 'Rankings', href: '/rankings', icon: Trophy },
  { name: 'Subir Excel', href: '/upload', icon: Upload },
  { name: 'Configuración', href: '/scoring', icon: Settings },
]

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/80 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-gray-900 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rugby-600">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Rugby Stats</span>
          </div>
          <button
            className="lg:hidden text-gray-400 hover:text-white"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col px-4 py-4">
          <ul className="flex flex-1 flex-col gap-1">
            {navigation.map((item) => (
              <li key={item.name}>
                <NavLink
                  to={item.href}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-rugby-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`
                  }
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {item.name}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-800 px-6 py-4">
          <p className="text-xs text-gray-500">
            Rugby Stats Dashboard v0.1.0
          </p>
        </div>
      </div>
    </>
  )
}
