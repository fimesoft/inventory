import type { Metadata, Viewport } from 'next';
import './globals.css';
import { UserProvider } from '@/lib/userContext';
import { DniGate } from '@/components/DniGate';

export const metadata: Metadata = {
  title: 'Inventory',
  description: 'Gestión de inventario electrónico',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#111111',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <UserProvider>
          <DniGate>
            {children}
          </DniGate>
        </UserProvider>
      </body>
    </html>
  );
}
