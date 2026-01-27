import { useState, useMemo } from 'react'
import { Trophy } from 'lucide-react'
import { useRankings } from '../hooks/useRankings'
import { useMatches } from '../hooks/useMatches'
import { useTeams } from '../hooks/useTeams'
import RankingsTable from '../components/stats/RankingsTable'

export default function Rankings() {
  const [matchFilter, setMatchFilter] = useState<number | undefined>(undefined)
  const [teamFilter, setTeamFilter] = useState<string | undefined>(undefined)

  const { data: teams } = useTeams()
  const { data: matches } = useMatches({ team: teamFilter })

  const { data: rankings, isLoading } = useRankings({
    match_id: matchFilter,
    team: teamFilter,
    limit: 100,
  })

  const sortedMatches = useMemo(() => {
    if (!matches) return []
    return [...matches].sort((a, b) => {
      if (!a.match_date && !b.match_date) return 0
      if (!a.match_date) return 1
      if (!b.match_date) return -1
      return new Date(b.match_date).getTime() - new Date(a.match_date).getTime()
    })
  }, [matches])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <Trophy className="h-8 w-8 text-rugby-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rankings</h1>
          <p className="mt-1 text-gray-500">
            Clasificación de jugadores por puntuación
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Team Filter */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtrar por Equipo
            </label>
            <select
              value={teamFilter || ''}
              onChange={(e) => {
                setTeamFilter(e.target.value || undefined)
                setMatchFilter(undefined) // Reset match filter when team changes
              }}
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
          {/* Match Filter */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtrar por Partido
            </label>
            <select
              value={matchFilter || ''}
              onChange={(e) => setMatchFilter(e.target.value ? parseInt(e.target.value, 10) : undefined)}
              className="input"
            >
              <option value="">Todos los partidos</option>
              {sortedMatches.map((match) => (
                <option key={match.id} value={match.id}>
                  vs {match.opponent_name}
                  {match.match_date && ` - ${new Date(match.match_date).toLocaleDateString('es-ES')}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Rankings Table */}
      <div className="card">
        <RankingsTable rankings={rankings || []} loading={isLoading} />
      </div>
    </div>
  )
}
