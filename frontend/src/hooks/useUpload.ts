import { useMutation, useQueryClient } from '@tanstack/react-query'
import { importsApi } from '../api/imports'

export const useUploadExcel = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => importsApi.uploadExcel(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] })
      queryClient.invalidateQueries({ queryKey: ['players'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      queryClient.invalidateQueries({ queryKey: ['rankings'] })
    },
  })
}
