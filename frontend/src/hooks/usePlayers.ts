import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { playersApi } from '../api/players'
import type { PlayerCreate } from '../types'

export const usePlayers = (skip = 0, limit = 100) => {
  return useQuery({
    queryKey: ['players', skip, limit],
    queryFn: () => playersApi.getAll(skip, limit),
  })
}

export const usePlayersWithStats = (skip = 0, limit = 100) => {
  return useQuery({
    queryKey: ['players', 'with-stats', skip, limit],
    queryFn: () => playersApi.getAllWithStats(skip, limit),
  })
}

export const usePlayer = (id: number) => {
  return useQuery({
    queryKey: ['player', id],
    queryFn: () => playersApi.getById(id),
    enabled: !!id,
  })
}

export const usePlayerByName = (name: string) => {
  return useQuery({
    queryKey: ['player', 'name', name],
    queryFn: () => playersApi.getByName(name),
    enabled: !!name,
  })
}

export const usePlayerSummary = (name: string) => {
  return useQuery({
    queryKey: ['player', 'summary', name],
    queryFn: () => playersApi.getSummary(name),
    enabled: !!name,
  })
}

export const useCreatePlayer = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: PlayerCreate) => playersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] })
    },
  })
}

export const useUpdatePlayer = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<PlayerCreate> }) =>
      playersApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['players'] })
      queryClient.invalidateQueries({ queryKey: ['player', variables.id] })
    },
  })
}

export const useDeletePlayer = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => playersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] })
    },
  })
}

export const usePlayerAnomalies = (playerId: number, mode: 'all' | 'recent' = 'all') => {
  return useQuery({
    queryKey: ['player', 'anomalies', playerId, mode],
    queryFn: () => playersApi.getAnomalies(playerId, mode),
    enabled: !!playerId,
  })
}

export const usePlayerEvolutionAnalysis = (playerId: number) => {
  return useQuery({
    queryKey: ['player', 'evolution-analysis', playerId],
    queryFn: () => playersApi.getEvolutionAnalysis(playerId),
    enabled: !!playerId,
  })
}

export const useTriggerEvolutionAnalysis = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (playerId: number) => playersApi.triggerEvolutionAnalysis(playerId),
    onSuccess: (_, playerId) => {
      queryClient.invalidateQueries({ queryKey: ['player', 'evolution-analysis', playerId] })
    },
  })
}

export const usePlayerPositionComparison = (playerId: number) => {
  return useQuery({
    queryKey: ['player', 'position-comparison', playerId],
    queryFn: () => playersApi.getPositionComparison(playerId),
    enabled: !!playerId,
  })
}
