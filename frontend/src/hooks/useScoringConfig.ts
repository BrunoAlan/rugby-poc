import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { scoringApi } from '../api/scoring'
import type { ScoringConfigCreate, WeightUpdate } from '../types'

export const useScoringConfigs = () => {
  return useQuery({
    queryKey: ['scoring', 'configs'],
    queryFn: () => scoringApi.getConfigurations(),
  })
}

export const useActiveConfig = () => {
  return useQuery({
    queryKey: ['scoring', 'active'],
    queryFn: () => scoringApi.getActiveConfig(),
  })
}

export const useScoringConfig = (id: number) => {
  return useQuery({
    queryKey: ['scoring', 'config', id],
    queryFn: () => scoringApi.getConfigById(id),
    enabled: !!id,
  })
}

export const useCreateConfig = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ScoringConfigCreate) => scoringApi.createConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scoring'] })
    },
  })
}

export const useActivateConfig = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => scoringApi.activateConfig(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scoring'] })
      queryClient.invalidateQueries({ queryKey: ['rankings'] })
    },
  })
}

export const useUpdateWeight = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ weightId, data }: { weightId: number; data: WeightUpdate }) =>
      scoringApi.updateWeight(weightId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scoring'] })
    },
  })
}

export const useRecalculateScores = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => scoringApi.recalculateScores(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rankings'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      queryClient.invalidateQueries({ queryKey: ['player'] })
    },
  })
}
