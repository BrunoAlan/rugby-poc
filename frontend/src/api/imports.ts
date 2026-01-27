import apiClient from './client'
import type { UploadResult } from '../types'

export const importsApi = {
  uploadExcel: async (file: File): Promise<UploadResult> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await apiClient.post('/imports/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  downloadTemplate: async (): Promise<void> => {
    const response = await apiClient.get('/imports/template', {
      responseType: 'blob',
    })

    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'Template.xlsx')
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },
}
