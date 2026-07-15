import { AppLayout } from '@/components/AppLayout';
import { Dashboard } from '@/components/Dashboard';

export default function HomePage() {
  return (
    <AppLayout title="Dashboard">
      <Dashboard />
    </AppLayout>
  );
}
