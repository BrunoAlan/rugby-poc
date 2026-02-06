import { useState } from 'react'
import { Download, Loader2, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'
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
      setTimeout(() => {
        setStatus('idle')
        setErrorMessage(null)
      }, 5000)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <motion.button
        onClick={handleDownload}
        disabled={status === 'loading'}
        whileTap={{ scale: 0.95 }}
        className={`
          inline-flex items-center gap-2 px-4 py-2 rounded-lg
          text-sm font-medium transition-all duration-200
          ${
            status === 'error'
              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
              : status === 'loading'
              ? 'bg-dark-700 text-dark-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-primary-500 to-primary-400 text-dark-900 hover:from-primary-400 hover:to-primary-300 shadow-lg hover:shadow-glow-primary'
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
      </motion.button>
      {errorMessage && (
        <span className="text-sm text-red-400">{errorMessage}</span>
      )}
    </div>
  )
}
