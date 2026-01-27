import { useState, useMemo } from 'react'
import { Search, Calendar } from 'lucide-react'
import { useMatches } from '../hooks/useMatches'
import { useTeams } from '../hooks/useTeams'
import MatchList from '../components/matches/MatchList'

export default function Matches() {
  const [teamFilter, setTeamFilter] = useState<string | undefined>(undefined)
  const { data: teams } = useTeams()
  const { data: matches, isLoading } = useMatches({ team: teamFilter })
  const [searchTerm, setSearchTerm] = useState('')

  const filteredMatches = useMemo(() => {
    if (!matches) return []
    if (!searchTerm) return matches

    const term = searchTerm.toLowerCase()
    return matches.filter((match) =>
      match.opponent_name.toLowerCase().includes(term)
    )
  }, [matches, searchTerm])

  // Sort by date descending (most recent first), null dates go last
  const sortedMatches = useMemo(() => {
    return [...filteredMatches].sort((a, b) => {
      if (!a.match_date && !b.match_date) return 0
      if (!a.match_date) return 1
      if (!b.match_date) return -1
      return new Date(b.match_date).getTime() - new Date(a.match_date).getTime()
    })
  }, [filteredMatches])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Partidos</h1>
          <p className="mt-1 text-gray-500">
            {matches?.length || 0} partidos registrados
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="h-4 w-4" />
          Ordenados por fecha
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Team Filter */}
        <div className="sm:w-48">
          <select
            value={teamFilter || ''}
            onChange={(e) => setTeamFilter(e.target.value || undefined)}
            className="input"
          >
            <option value="">Todos los equipos</option>
            {teams?.map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>
        </div>
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por rival o ubicación..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {/* Matches List */}
      <MatchList matches={sortedMatches} loading={isLoading} />

      {/* No results */}
      {!isLoading && searchTerm && filteredMatches.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-500">
            No se encontraron partidos que coincidan con "{searchTerm}"
          </p>
        </div>
      )}
    </div>
  )
}
