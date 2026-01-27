import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { matchesApi } from '../api/matches'
import type { MatchCreate } from '../types'

interface MatchFilters {
  skip?: number
  limit?: number
  team?: string
}

export const useMatches = (filters: MatchFilters = {}) => {
  const { skip = 0, limit = 100, team } = filters
  return useQuery({
    queryKey: ['matches', skip, limit, team],
    queryFn: () => matchesApi.getAll({ skip, limit, team }),
  })
}

export const useMatch = (id: number) => {
  return useQuery({
    queryKey: ['match', id],
    queryFn: () => matchesApi.getById(id),
    enabled: !!id,
    refetchInterval: (query) => {
      const data = query.state.data;
      // Auto-refetch every 5 seconds while AI analysis is pending or processing
      if (data?.ai_analysis_status === 'pending' || data?.ai_analysis_status === 'processing') {
        return 5000;
      }
      return false;
    },
  })
}

export const useCreateMatch = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: MatchCreate) => matchesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] })
    },
  })
}

export const useUpdateMatch = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<MatchCreate> }) =>
      matchesApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['matches'] })
      queryClient.invalidateQueries({ queryKey: ['match', variables.id] })
    },
  })
}

export const useDeleteMatch = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => matchesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] })
    },
  })
}
