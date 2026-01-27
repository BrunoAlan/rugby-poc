import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { statsApi } from '../api/stats'
import type { PlayerStatsCreate } from '../types'

interface StatsFilters {
  match_id?: number
  player_id?: number
  skip?: number
  limit?: number
}

export const useStats = (filters: StatsFilters = {}) => {
  return useQuery({
    queryKey: ['stats', filters],
    queryFn: () => statsApi.getAll(filters),
  })
}

export const useMatchStats = (matchId: number) => {
  return useQuery({
    queryKey: ['match-stats', matchId],
    queryFn: () => statsApi.getMatchStats(matchId),
    enabled: !!matchId,
  })
}

export const useStat = (id: number) => {
  return useQuery({
    queryKey: ['stat', id],
    queryFn: () => statsApi.getById(id),
    enabled: !!id,
  })
}

export const useCreateStats = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: PlayerStatsCreate) => statsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      queryClient.invalidateQueries({ queryKey: ['rankings'] })
    },
  })
}

export const useUpdateStats = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<PlayerStatsCreate> }) =>
      statsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      queryClient.invalidateQueries({ queryKey: ['stat', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['rankings'] })
    },
  })
}

export const useDeleteStats = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => statsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      queryClient.invalidateQueries({ queryKey: ['rankings'] })
    },
  })
}
