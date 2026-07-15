import { AppLayout } from '@/components/AppLayout';
import { CsvUploader } from '@/components/CsvUploader';

export default function UploadPage() {
  return (
    <AppLayout title="Upload CSV">
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white">Importar inventario</h2>
          <p className="text-sm text-text-secondary mt-1">
            Subí un archivo CSV con las columnas: CANTIDAD, NOMBRE, COSTO_DOLAR, VENTA_PESOS
          </p>
        </div>
        <CsvUploader />
      </div>
    </AppLayout>
  );
}
