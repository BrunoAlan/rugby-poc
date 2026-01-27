import apiClient from './client'
import type { ScoringConfig, ScoringConfigCreate, ScoringWeight, WeightUpdate } from '../types'

export const scoringApi = {
  getConfigurations: async (): Promise<ScoringConfig[]> => {
    const response = await apiClient.get('/scoring/configurations')
    return response.data
  },

  getActiveConfig: async (): Promise<ScoringConfig> => {
    const response = await apiClient.get('/scoring/configurations/active')
    return response.data
  },

  getConfigById: async (id: number): Promise<ScoringConfig> => {
    const response = await apiClient.get(`/scoring/configurations/${id}`)
    return response.data
  },

  createConfig: async (data: ScoringConfigCreate): Promise<ScoringConfig> => {
    const response = await apiClient.post('/scoring/configurations', data)
    return response.data
  },

  activateConfig: async (id: number): Promise<ScoringConfig> => {
    const response = await apiClient.post(`/scoring/configurations/${id}/activate`)
    return response.data
  },

  updateWeight: async (weightId: number, data: WeightUpdate): Promise<ScoringWeight> => {
    const response = await apiClient.put(`/scoring/weights/${weightId}`, data)
    return response.data
  },

  recalculateScores: async (): Promise<{ message: string; stats_updated: number }> => {
    const response = await apiClient.post('/scoring/recalculate')
    return response.data
  },
}
