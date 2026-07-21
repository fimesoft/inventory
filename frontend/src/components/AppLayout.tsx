'use client';

import Link from 'next/link';
import { HamburgerMenu } from './HamburgerMenu';
import { useUser } from '@/lib/userContext';
import styles from './AppLayout.module.css';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function AppLayout({ children, title }: AppLayoutProps) {
  const { user, clearUser } = useUser();

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <HamburgerMenu />
        <Link href="/" className={styles.titleLink}>
          <h1 className={styles.title}>{title || 'Inventory'}</h1>
        </Link>
        {user ? (
          <button
            onClick={clearUser}
            className={styles.userBtn}
            title={`${user.nombre} ${user.apellido} — Salir`}
            aria-label="Cerrar sesión"
          >
            <span className={styles.userInitial}>
              {user.nombre[0].toUpperCase()}
            </span>
          </button>
        ) : (
          <div className={styles.spacer} />
        )}
      </header>

      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}
