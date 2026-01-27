import { useState } from 'react'
import { Download, Loader2, AlertCircle } from 'lucide-react'
import { downloadMatchPDF } from '../../api/exports'

interface PDFDownloadButtonProps {
  matchId: number
}

export default function PDFDownloadButton({ matchId }: PDFDownloadButtonProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleDownload = async () => {
    setStatus('loading')
    setErrorMessage(null)

    try {
      await downloadMatchPDF(matchId)
      setStatus('idle')
    } catch (error) {
      setStatus('error')
      setErrorMessage(
        error instanceof Error ? error.message : 'Error al descargar el PDF'
      )
      // Reset error state after 5 seconds
      setTimeout(() => {
        setStatus('idle')
        setErrorMessage(null)
      }, 5000)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleDownload}
        disabled={status === 'loading'}
        className={`
          inline-flex items-center gap-2 px-4 py-2 rounded-lg
          text-sm font-medium transition-colors
          ${
            status === 'error'
              ? 'bg-red-100 text-red-700 hover:bg-red-200'
              : status === 'loading'
              ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
              : 'bg-rugby-600 text-white hover:bg-rugby-700'
          }
        `}
      >
        {status === 'loading' ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generando PDF...
          </>
        ) : status === 'error' ? (
          <>
            <AlertCircle className="h-4 w-4" />
            Error
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            Descargar Informe PDF
          </>
        )}
      </button>
      {errorMessage && (
        <span className="text-sm text-red-600">{errorMessage}</span>
      )}
    </div>
  )
}
