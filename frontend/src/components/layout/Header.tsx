import { Menu, Bell } from 'lucide-react'

interface HeaderProps {
  onMenuClick: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:px-6 lg:px-8">
      <button
        type="button"
        className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
        onClick={onMenuClick}
      >
        <span className="sr-only">Abrir menú</span>
        <Menu className="h-6 w-6" />
      </button>

      <div className="flex flex-1 items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <h1 className="text-lg font-semibold text-gray-900">Rugby Stats Dashboard</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          >
            <span className="sr-only">Ver notificaciones</span>
            <Bell className="h-5 w-5" />
          </button>

          <div className="h-8 w-8 rounded-full bg-rugby-600 flex items-center justify-center">
            <span className="text-sm font-medium text-white">RC</span>
          </div>
        </div>
      </div>
    </header>
  )
}
