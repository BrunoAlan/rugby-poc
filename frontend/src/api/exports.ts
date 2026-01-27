import apiClient from './client'

/**
 * Download a PDF report for a specific match.
 * Creates a blob from the response and triggers a download.
 */
export async function downloadMatchPDF(matchId: number): Promise<void> {
  const response = await apiClient.get(`/exports/matches/${matchId}/pdf`, {
    responseType: 'blob',
  })

  // Get filename from Content-Disposition header if available
  const contentDisposition = response.headers['content-disposition']
  let filename = `informe_partido_${matchId}.pdf`

  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="?([^";\n]+)"?/)
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1]
    }
  }

  // Create blob URL and trigger download
  const blob = new Blob([response.data], { type: 'application/pdf' })
  const url = window.URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()

  // Cleanup
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}
