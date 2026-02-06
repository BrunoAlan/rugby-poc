import { Upload as UploadIcon, FileSpreadsheet, Info, Download } from 'lucide-react'
import { useUploadExcel } from '../hooks/useUpload'
import ExcelUploader from '../components/upload/ExcelUploader'
import { importsApi } from '../api/imports'
import AnimatedPage from '../components/ui/AnimatedPage'
import AnimatedCard from '../components/ui/AnimatedCard'

export default function Upload() {
  const uploadMutation = useUploadExcel()

  const handleDownloadTemplate = async () => {
    try {
      await importsApi.downloadTemplate()
    } catch (error) {
      console.error('Error downloading template:', error)
    }
  }

  return (
    <AnimatedPage className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 shadow-glow-primary">
          <UploadIcon className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Subir Excel</h1>
          <p className="mt-1 text-dark-300">
            Importa datos de partidos y estadísticas desde un archivo Excel
          </p>
        </div>
      </div>

      {/* Upload Card */}
      <div className="card">
        <ExcelUploader
          onUpload={uploadMutation.mutateAsync}
          isLoading={uploadMutation.isPending}
        />
      </div>

      {/* Instructions */}
      <div className="card bg-blue-900/20 border-blue-500/30">
        <div className="flex gap-4">
          <Info className="h-6 w-6 text-blue-400 shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-300">
              Formato del archivo Excel
            </h3>
            <div className="mt-3 text-sm text-blue-300/80 space-y-3">
              <p>
                El archivo debe contener hojas con el formato esperado por el sistema.
                Cada hoja representará un partido con las estadísticas de los jugadores.
              </p>
              <div className="flex items-start gap-3">
                <FileSpreadsheet className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-300">Estructura esperada:</p>
                  <ul className="mt-1 list-disc list-inside space-y-1 text-blue-300/70">
                    <li>Nombre de la hoja: nombre del rival</li>
                    <li>Primera fila: encabezados de columnas</li>
                    <li>Columnas de estadísticas: tries, tackles, metros, etc.</li>
                  </ul>
                </div>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm font-medium"
                >
                  <Download className="h-4 w-4" />
                  Descargar Plantilla
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: 'Jugadores', desc: 'Los jugadores nuevos se crean automáticamente' },
          { title: 'Partidos', desc: 'Cada hoja crea un nuevo partido con el rival indicado' },
          { title: 'Estadísticas', desc: 'Los scores se calculan automáticamente con la config activa' },
        ].map((tip, i) => (
          <AnimatedCard key={tip.title} index={i}>
            <div className="card">
              <h4 className="font-medium text-white">{tip.title}</h4>
              <p className="mt-1 text-sm text-dark-300">{tip.desc}</p>
            </div>
          </AnimatedCard>
        ))}
      </div>
    </AnimatedPage>
  )
}
