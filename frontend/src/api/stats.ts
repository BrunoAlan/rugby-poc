import apiClient from './client'
import type { PlayerStats, PlayerStatsCreate, PlayerRanking, PlayerMatchStatsResponse } from '../types'

interface StatsFilters {
  match_id?: number
  player_id?: number
  skip?: number
  limit?: number
}

interface RankingsFilters {
  match_id?: number
  team?: string
  is_forward?: boolean
  limit?: number
}

interface MatchStatsResponse {
  items: PlayerMatchStatsResponse[]
  total: number
}

export const statsApi = {
  getAll: async (filters: StatsFilters = {}): Promise<PlayerStats[]> => {
    const response = await apiClient.get('/stats/', { params: filters })
    return response.data
  },

  getMatchStats: async (matchId: number): Promise<PlayerMatchStatsResponse[]> => {
    const response = await apiClient.get<MatchStatsResponse>('/stats/', { params: { match_id: matchId, limit: 100 } })
    return response.data.items
  },

  getById: async (id: number): Promise<PlayerStats> => {
    const response = await apiClient.get(`/stats/${id}`)
    return response.data
  },

  getRankings: async (filters: RankingsFilters = {}): Promise<PlayerRanking[]> => {
    const response = await apiClient.get('/stats/rankings', { params: filters })
    return response.data
  },

  create: async (data: PlayerStatsCreate): Promise<PlayerStats> => {
    const response = await apiClient.post('/stats/', data)
    return response.data
  },

  update: async (id: number, data: Partial<PlayerStatsCreate>): Promise<PlayerStats> => {
    const response = await apiClient.put(`/stats/${id}`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/stats/${id}`)
  },
}
