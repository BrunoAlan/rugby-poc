import { useQuery } from '@tanstack/react-query'
import { statsApi } from '../api/stats'

interface RankingsFilters {
  match_id?: number
  team?: string
  is_forward?: boolean
  limit?: number
}

export const useRankings = (filters: RankingsFilters = {}) => {
  return useQuery({
    queryKey: ['rankings', filters],
    queryFn: () => statsApi.getRankings(filters),
  })
}
