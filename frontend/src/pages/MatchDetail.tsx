import { useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useMatch } from '../hooks/useMatches'
import { useMatchStats } from '../hooks/useStats'
import { useRankings } from '../hooks/useRankings'
import { usePlayers } from '../hooks/usePlayers'
import MatchDetails from '../components/matches/MatchDetails'
import AIAnalysisCard from '../components/matches/AIAnalysisCard'
import RankingsTable from '../components/stats/RankingsTable'
import PlayerStatsModal from '../components/players/PlayerStatsModal'
import PDFDownloadButton from '../components/matches/PDFDownloadButton'
import type { PlayerMatchStatsResponse, Player } from '../types'

export default function MatchDetail() {
  const { id } = useParams<{ id: string }>()
  const matchId = parseInt(id || '0', 10)

  const { data: match, isLoading: matchLoading } = useMatch(matchId)
  const { data: matchStats, isLoading: statsLoading } = useMatchStats(matchId)
  const { data: rankings, isLoading: rankingsLoading } = useRankings({ match_id: matchId })
  const { data: players } = usePlayers()

  const [selectedPlayerStats, setSelectedPlayerStats] = useState<PlayerMatchStatsResponse | null>(null)

  // Create a map of player_id to player for quick lookup
  const playerMap = useMemo(() => {
    if (!players) return new Map<number, Player>()
    return new Map(players.map(p => [p.id, p]))
  }, [players])

  // Create a map of player_name to stats for quick lookup
  const statsByPlayerName = useMemo(() => {
    if (!matchStats || !players) return new Map<string, PlayerMatchStatsResponse>()
    const map = new Map<string, PlayerMatchStatsResponse>()
    matchStats.forEach(stat => {
      const player = playerMap.get(stat.player_id)
      if (player) {
        map.set(player.name, stat)
      }
    })
    return map
  }, [matchStats, players, playerMap])

  const handlePlayerClick = (playerName: string) => {
    const stats = statsByPlayerName.get(playerName)
    if (stats) {
      setSelectedPlayerStats(stats)
    }
  }

  const handleCloseModal = () => {
    setSelectedPlayerStats(null)
  }

  if (matchLoading) {
    return (
      <div className="space-y-6">
        <div className="card animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="h-4 bg-gray-200 rounded w-1/4" />
        </div>
      </div>
    )
  }

  if (!match) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500">Partido no encontrado</p>
        <Link to="/matches" className="btn-primary mt-4">
          Volver a Partidos
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Link and PDF Download */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link
          to="/matches"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Partidos
        </Link>
        <PDFDownloadButton matchId={matchId} />
      </div>

      {/* Match Details */}
      <MatchDetails match={match} />

      {/* AI Analysis */}
      <AIAnalysisCard match={match} />

      {/* Stats Section */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          Rankings del Partido
        </h2>
        <RankingsTable
          rankings={rankings || []}
          loading={rankingsLoading || statsLoading}
          onPlayerClick={handlePlayerClick}
        />
      </div>

      {/* Player Stats Modal */}
      {selectedPlayerStats && (
        <PlayerStatsModal
          stats={selectedPlayerStats}
          player={playerMap.get(selectedPlayerStats.player_id)}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}
