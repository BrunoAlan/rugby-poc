import apiClient from './client'
import type { Match, MatchCreate } from '../types'

interface PaginatedResponse<T> {
  items: T[]
  total: number
}

interface MatchFilters {
  skip?: number
  limit?: number
  team?: string
}

export const matchesApi = {
  getAll: async (filters: MatchFilters = {}): Promise<Match[]> => {
    const { skip = 0, limit = 100, team } = filters
    const response = await apiClient.get<PaginatedResponse<Match>>('/matches/', {
      params: { skip, limit, ...(team && { team }) }
    })
    return response.data.items
  },

  getTeams: async (): Promise<string[]> => {
    const response = await apiClient.get<string[]>('/matches/teams')
    return response.data
  },

  getById: async (id: number): Promise<Match> => {
    const response = await apiClient.get(`/matches/${id}`)
    return response.data
  },

  create: async (data: MatchCreate): Promise<Match> => {
    const response = await apiClient.post('/matches/', data)
    return response.data
  },

  update: async (id: number, data: Partial<MatchCreate>): Promise<Match> => {
    const response = await apiClient.put(`/matches/${id}`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/matches/${id}`)
  },
}
