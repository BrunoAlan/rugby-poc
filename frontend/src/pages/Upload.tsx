import { Upload as UploadIcon, FileSpreadsheet, Info, Download } from 'lucide-react'
import { useUploadExcel } from '../hooks/useUpload'
import ExcelUploader from '../components/upload/ExcelUploader'
import { importsApi } from '../api/imports'

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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <UploadIcon className="h-8 w-8 text-rugby-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subir Excel</h1>
          <p className="mt-1 text-gray-500">
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
      <div className="card bg-blue-50 border-blue-200">
        <div className="flex gap-4">
          <Info className="h-6 w-6 text-blue-600 shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-900">
              Formato del archivo Excel
            </h3>
            <div className="mt-3 text-sm text-blue-800 space-y-3">
              <p>
                El archivo debe contener hojas con el formato esperado por el sistema.
                Cada hoja representará un partido con las estadísticas de los jugadores.
              </p>
              <div className="flex items-start gap-3">
                <FileSpreadsheet className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Estructura esperada:</p>
                  <ul className="mt-1 list-disc list-inside space-y-1 text-blue-700">
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
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
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
        <div className="card">
          <h4 className="font-medium text-gray-900">Jugadores</h4>
          <p className="mt-1 text-sm text-gray-500">
            Los jugadores nuevos se crean automáticamente
          </p>
        </div>
        <div className="card">
          <h4 className="font-medium text-gray-900">Partidos</h4>
          <p className="mt-1 text-sm text-gray-500">
            Cada hoja crea un nuevo partido con el rival indicado
          </p>
        </div>
        <div className="card">
          <h4 className="font-medium text-gray-900">Estadísticas</h4>
          <p className="mt-1 text-sm text-gray-500">
            Los scores se calculan automáticamente con la config activa
          </p>
        </div>
      </div>
    </div>
  )
}
