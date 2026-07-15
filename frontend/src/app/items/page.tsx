import { AppLayout } from '@/components/AppLayout';
import { ItemGrid } from '@/components/ItemGrid';

export default function ItemsPage() {
  return (
    <AppLayout title="Listado de Items">
      <ItemGrid />
    </AppLayout>
  );
}
