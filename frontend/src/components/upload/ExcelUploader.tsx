import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, File, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import type { UploadResult } from '../../types'

interface ExcelUploaderProps {
  onUpload: (file: File) => Promise<UploadResult>
  isLoading?: boolean
}

export default function ExcelUploader({ onUpload, isLoading }: ExcelUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0])
      setResult(null)
      setError(null)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
    disabled: isLoading,
  })

  const handleUpload = async () => {
    if (!file) return

    try {
      setError(null)
      const uploadResult = await onUpload(file)
      setResult(uploadResult)
      setFile(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir el archivo')
    }
  }

  const handleClear = () => {
    setFile(null)
    setResult(null)
    setError(null)
  }

  return (
    <div className="space-y-6">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`relative rounded-xl border-2 border-dashed p-12 text-center transition-all cursor-pointer ${
          isDragActive
            ? 'border-primary-500 bg-primary-900/20 shadow-[0_0_20px_rgba(233,169,10,0.15)]'
            : file
            ? 'border-green-500/50 bg-green-900/10'
            : 'border-dark-600 hover:border-dark-500 hover:bg-dark-800/50'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />

        {file ? (
          <div className="flex flex-col items-center">
            <File className="h-12 w-12 text-green-400 mb-4" />
            <p className="text-lg font-medium text-white">{file.name}</p>
            <p className="text-sm text-dark-300 mt-1">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleClear()
              }}
              className="mt-4 text-sm text-red-400 hover:text-red-300 transition-colors"
              disabled={isLoading}
            >
              Eliminar archivo
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Upload className="h-12 w-12 text-dark-400 mb-4" />
            <p className="text-lg font-medium text-white">
              {isDragActive
                ? 'Suelta el archivo aquí'
                : 'Arrastra y suelta tu archivo Excel'}
            </p>
            <p className="text-sm text-dark-300 mt-1">
              o haz clic para seleccionar
            </p>
            <p className="text-xs text-dark-500 mt-2">
              Formatos soportados: .xlsx, .xls
            </p>
          </div>
        )}
      </div>

      {/* Upload Button */}
      {file && !result && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleUpload}
            disabled={isLoading}
            className="btn-primary min-w-48"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Subiendo...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Subir e Importar
              </>
            )}
          </button>
        </div>
      )}

      {/* Success Result */}
      {result && (
        <div className="rounded-lg bg-green-900/20 border border-green-500/30 p-6">
          <div className="flex items-start gap-4">
            <CheckCircle className="h-6 w-6 text-green-400 shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-green-300">
                Importación completada
              </h3>
              <ul className="mt-2 text-sm text-green-400/80 space-y-1">
                <li>Jugadores creados: {result.players_created}</li>
                <li>Partidos creados: {result.matches_created}</li>
                <li>Estadísticas creadas: {result.stats_created}</li>
                <li>Hojas procesadas: {result.sheets_processed.join(', ')}</li>
              </ul>
              {result.ai_analysis_queued > 0 && (
                <p className="mt-3 text-sm text-purple-400 bg-purple-900/20 px-3 py-2 rounded-md border border-purple-500/20">
                  Generando análisis AI para {result.ai_analysis_queued} partido(s) en segundo plano...
                </p>
              )}
              <button
                type="button"
                onClick={handleClear}
                className="mt-4 text-sm font-medium text-green-400 hover:text-green-300 transition-colors"
              >
                Subir otro archivo
              </button>
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="text-green-400 hover:text-green-300 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-900/20 border border-red-500/30 p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="h-6 w-6 text-red-400 shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-300">Error en la importación</h3>
              <p className="mt-1 text-sm text-red-400/80">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-300 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-dark-800 border border-dark-700/50 rounded-xl p-8 flex flex-col items-center gap-4 shadow-xl">
            <Loader2 className="h-12 w-12 animate-spin text-primary-400" />
            <div className="text-center">
              <p className="text-lg font-medium text-white">
                Procesando archivo
              </p>
              <p className="text-sm text-dark-300 mt-1">
                Importando partidos y calculando puntuaciones...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
