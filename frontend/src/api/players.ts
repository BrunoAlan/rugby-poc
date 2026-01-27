import apiClient from './client'
import type { Player, PlayerCreate, PlayerSummary, PlayerWithStats } from '../types'

interface PaginatedResponse<T> {
  items: T[]
  total: number
}

export const playersApi = {
  getAll: async (skip = 0, limit = 100): Promise<Player[]> => {
    const response = await apiClient.get<PaginatedResponse<Player>>('/players/', { params: { skip, limit } })
    return response.data.items
  },

  getAllWithStats: async (skip = 0, limit = 100): Promise<PlayerWithStats[]> => {
    const response = await apiClient.get<PaginatedResponse<PlayerWithStats>>('/players/with-stats', { params: { skip, limit } })
    return response.data.items
  },

  getById: async (id: number): Promise<Player> => {
    const response = await apiClient.get(`/players/${id}`)
    return response.data
  },

  getByName: async (name: string): Promise<Player> => {
    const response = await apiClient.get(`/players/name/${encodeURIComponent(name)}`)
    return response.data
  },

  getSummary: async (name: string): Promise<PlayerSummary> => {
    const response = await apiClient.get(`/players/name/${encodeURIComponent(name)}/summary`)
    return response.data
  },

  create: async (data: PlayerCreate): Promise<Player> => {
    const response = await apiClient.post('/players/', data)
    return response.data
  },

  update: async (id: number, data: Partial<PlayerCreate>): Promise<Player> => {
    const response = await apiClient.put(`/players/${id}`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/players/${id}`)
  },
}
