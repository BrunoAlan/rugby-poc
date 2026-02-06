import { Menu, Bell } from 'lucide-react'

interface HeaderProps {
  onMenuClick: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-4 bg-dark-800/90 backdrop-blur-md border-b border-dark-700/50 px-4 sm:px-6 lg:px-8">
      <button
        type="button"
        className="-m-2.5 p-2.5 text-dark-400 hover:text-white transition-colors lg:hidden"
        onClick={onMenuClick}
      >
        <span className="sr-only">Abrir menú</span>
        <Menu className="h-6 w-6" />
      </button>

      <div className="flex flex-1 items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <h1 className="text-lg font-semibold text-white">Rugby Stats Dashboard</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            className="relative rounded-full p-2 text-dark-400 hover:bg-dark-700/50 hover:text-white transition-colors"
          >
            <span className="sr-only">Ver notificaciones</span>
            <Bell className="h-5 w-5" />
          </button>

          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center ring-2 ring-primary-500/30">
            <span className="text-sm font-medium text-white">RC</span>
          </div>
        </div>
      </div>

      {/* Gold accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-primary-500/50 via-primary-500/20 to-transparent" />
    </header>
  )
}
