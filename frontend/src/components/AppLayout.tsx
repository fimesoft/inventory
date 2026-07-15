'use client';

import Link from 'next/link';
import { HamburgerMenu } from './HamburgerMenu';
import styles from './AppLayout.module.css';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function AppLayout({ children, title }: AppLayoutProps) {
  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <HamburgerMenu />
        <Link href="/" className={styles.titleLink}>
          <h1 className={styles.title}>{title || 'Inventory'}</h1>
        </Link>
        <div className={styles.spacer} />
      </header>

      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}
