'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './HamburgerMenu.module.css';

const NAV_ITEMS = [
  { href: '/upload', label: 'Upload CSV', icon: UploadIcon },
  { href: '/items', label: 'Listado de Items', icon: ListIcon },
];

export function HamburgerMenu() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setMounted(true); }, []);

  const overlay = (
    <>
      {open && (
        <div className={styles.backdrop} onClick={() => setOpen(false)} />
      )}
      <aside className={`${styles.drawer} ${open ? styles.drawerOpen : styles.drawerClosed}`}>
        <div className={styles.drawerHeader}>
          <span className={styles.drawerTitle}>Menú</span>
          <button
            onClick={() => setOpen(false)}
            className={styles.closeBtn}
            aria-label="Cerrar menú"
          >
            <CloseIcon />
          </button>
        </div>

        <nav className={styles.nav}>
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`${styles.navLink} ${active ? styles.navLinkActive : ''}`}
              >
                <Icon />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className={styles.drawerFooter}>
          <p className={styles.footerText}>
            Inventopy App <HeartIcon />
          </p>
          <span className={styles.betaBadge}>v1.0.0</span>
          <p className={styles.footerBy}>By: Petizo</p>
        </div>
      </aside>
    </>
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={styles.trigger}
        aria-label="Abrir menú"
      >
        <HamburgerIcon />
      </button>

      {mounted && createPortal(overlay, document.body)}
    </>
  );
}

function HeartIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ display: 'inline', verticalAlign: 'middle', color: '#f87171' }}>
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>
  );
}

function HamburgerIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="19" y2="6" />
      <line x1="3" y1="11" x2="19" y2="11" />
      <line x1="3" y1="16" x2="19" y2="16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="4" y1="4" x2="16" y2="16" />
      <line x1="16" y1="4" x2="4" y2="16" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}
