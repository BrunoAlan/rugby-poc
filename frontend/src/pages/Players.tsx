import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, X, GitCompare } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePlayersWithStats } from '../hooks/usePlayers'
import AnimatedPage from '../components/ui/AnimatedPage'

const POSITIONS = Array.from({ length: 15 }, (_, i) => i + 1)

export default function Players() {
  const { data: players, isLoading } = usePlayersWithStats()
  const [searchTerm, setSearchTerm] = useState('')
  const [positionFilter, setPositionFilter] = useState<number | null>(null)
  const [selectedPlayers, setSelectedPlayers] = useState<Set<number>>(new Set())
  const navigate = useNavigate()

  const filteredPlayers = useMemo(() => {
    if (!players) return []

    let result = [...players]

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter((player) =>
        player.name.toLowerCase().includes(term)
      )
    }

    if (positionFilter !== null) {
      result = result.filter((player) => player.primary_position === positionFilter)
    }

    return result.sort((a, b) => b.avg_score - a.avg_score)
  }, [players, searchTerm, positionFilter])

  const togglePlayer = (playerId: number) => {
    setSelectedPlayers((prev) => {
      const next = new Set(prev)
      if (next.has(playerId)) {
        next.delete(playerId)
      } else {
        next.add(playerId)
      }
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedPlayers.size === filteredPlayers.length) {
      setSelectedPlayers(new Set())
    } else {
      setSelectedPlayers(new Set(filteredPlayers.map((p) => p.id)))
    }
  }

  const clearSelection = () => {
    setSelectedPlayers(new Set())
  }

  const handleCompare = () => {
    const selectedPlayerNames = filteredPlayers
      .filter((p) => selectedPlayers.has(p.id))
      .map((p) => p.name)

    const params = new URLSearchParams()
    selectedPlayerNames.forEach((name) => params.append('player', name))
    navigate(`/players/compare?${params.toString()}`)
  }

  const isAllSelected = filteredPlayers.length > 0 && selectedPlayers.size === filteredPlayers.length
  const isSomeSelected = selectedPlayers.size > 0 && selectedPlayers.size < filteredPlayers.length

  return (
    <AnimatedPage className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Jugadores</h1>
        <p className="mt-1 text-dark-300">
          {players?.length || 0} jugadores registrados
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-dark-400" />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>

        <select
          value={positionFilter ?? ''}
          onChange={(e) => setPositionFilter(e.target.value ? Number(e.target.value) : null)}
          className="input w-full sm:w-48"
        >
          <option value="">Todas las posiciones</option>
          {POSITIONS.map((pos) => (
            <option key={pos} value={pos}>
              #{pos} - {pos <= 8 ? 'Forward' : 'Back'}
            </option>
          ))}
        </select>
      </div>

      {/* Players Table */}
      {isLoading ? (
        <div className="card overflow-hidden">
          <table className="min-w-full divide-y divide-dark-700/50">
            <thead>
              <tr>
                <th className="table-header px-4 py-3 w-12"></th>
                <th className="table-header px-4 py-3">Jugador</th>
                <th className="table-header px-4 py-3 text-center">Posicion</th>
                <th className="table-header px-4 py-3 text-center">Partidos</th>
                <th className="table-header px-4 py-3 text-right">Promedio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700/30">
              {[...Array(6)].map((_, i) => (
                <tr key={i}>
                  <td className="table-cell px-4 py-3"><div className="skeleton h-4 w-4 rounded" /></td>
                  <td className="table-cell px-4 py-3"><div className="skeleton h-4 w-32 rounded" /></td>
                  <td className="table-cell px-4 py-3 text-center"><div className="skeleton h-4 w-8 rounded mx-auto" /></td>
                  <td className="table-cell px-4 py-3 text-center"><div className="skeleton h-4 w-8 rounded mx-auto" /></td>
                  <td className="table-cell px-4 py-3 text-right"><div className="skeleton h-4 w-12 rounded ml-auto" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : filteredPlayers.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-dark-400">
            {searchTerm || positionFilter !== null
              ? 'No se encontraron jugadores con los filtros aplicados'
              : 'No hay jugadores registrados'}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-dark-700/50">
              <thead>
                <tr>
                  <th className="table-header px-4 py-3 w-12">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = isSomeSelected
                      }}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-dark-600 bg-dark-900 text-primary-500 focus:ring-primary-400"
                    />
                  </th>
                  <th className="table-header px-4 py-3">Jugador</th>
                  <th className="table-header px-4 py-3 text-center">Posicion</th>
                  <th className="table-header px-4 py-3 text-center">Partidos</th>
                  <th className="table-header px-4 py-3 text-right">Promedio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700/30">
                {filteredPlayers.map((player) => {
                  const isSelected = selectedPlayers.has(player.id)
                  return (
                    <tr
                      key={player.id}
                      className={`hover:bg-dark-700/50 transition-colors ${isSelected ? 'bg-primary-900/30 border-l-2 border-primary-500' : ''}`}
                    >
                      <td className="table-cell px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => togglePlayer(player.id)}
                          className="h-4 w-4 rounded border-dark-600 bg-dark-900 text-primary-500 focus:ring-primary-400"
                        />
                      </td>
                      <td className="table-cell px-4 py-3">
                        <Link
                          to={`/players/${encodeURIComponent(player.name)}`}
                          className="font-medium text-gray-200 hover:text-primary-400 transition-colors"
                        >
                          {player.name}
                        </Link>
                      </td>
                      <td className="table-cell px-4 py-3 text-center text-dark-300 tabular-nums">
                        {player.primary_position ? `#${player.primary_position}` : '-'}
                      </td>
                      <td className="table-cell px-4 py-3 text-center text-dark-300 tabular-nums">
                        {player.matches_played}
                      </td>
                      <td className="table-cell px-4 py-3 text-right font-semibold text-primary-400 tabular-nums">
                        {player.avg_score.toFixed(1)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Floating Action Bar */}
      <AnimatePresence>
        {selectedPlayers.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-dark-800/95 backdrop-blur-md rounded-lg shadow-lg border border-dark-700/50 px-4 py-3 flex items-center gap-4 z-50"
          >
            <span className="text-sm text-dark-300">
              {selectedPlayers.size} jugador{selectedPlayers.size !== 1 ? 'es' : ''} seleccionado{selectedPlayers.size !== 1 ? 's' : ''}
            </span>
            <button
              onClick={clearSelection}
              className="inline-flex items-center gap-1 text-sm text-dark-400 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
              Limpiar
            </button>
            <button
              onClick={handleCompare}
              disabled={selectedPlayers.size < 2}
              className="btn-primary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <GitCompare className="h-4 w-4" />
              Comparar
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatedPage>
  )
}
