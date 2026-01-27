import { useQuery } from '@tanstack/react-query'
import { matchesApi } from '../api/matches'

export const useTeams = () => {
  return useQuery({
    queryKey: ['teams'],
    queryFn: () => matchesApi.getTeams(),
  })
}
