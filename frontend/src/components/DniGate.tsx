'use client';

import { useState } from 'react';
import { useUser } from '@/lib/userContext';
import { getUser, createUser } from '@/lib/api';
import styles from './DniGate.module.css';

export function DniGate({ children }: { children: React.ReactNode }) {
  const { user, initialized, setUser } = useUser();
  const [step, setStep] = useState<'dni' | 'register'>('dni');
  const [dni, setDni] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!initialized) {
    return (
      <div className={styles.splash}>
        <div className={styles.spinner} />
      </div>
    );
  }

  if (user) return <>{children}</>;

  const handleDniSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{7,10}$/.test(dni)) {
      setError('El DNI debe tener entre 7 y 10 dígitos');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const found = await getUser(dni);
      if (found) {
        setUser(found);
      } else {
        setStep('register');
      }
    } catch {
      setError('Error al buscar el DNI. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const created = await createUser({ dni, nombre: nombre.trim(), apellido: apellido.trim() });
      setUser(created);
    } catch (err: any) {
      setError(err.message ?? 'Error al registrar. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    setStep('dni');
    setNombre('');
    setApellido('');
    setError(null);
  };

  return (
    <div className={styles.gate}>
      <div className={styles.card}>
        <div className={styles.logoRow}>
          <span className={styles.logoText}>Inventopy</span>
        </div>

        {step === 'dni' ? (
          <form onSubmit={handleDniSubmit} className={styles.form}>
            <p className={styles.title}>Ingresá tu DNI</p>
            <p className={styles.subtitle}>Para acceder a tu inventario personal</p>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Número de DNI"
              value={dni}
              onChange={(e) => { setDni(e.target.value.replace(/\D/g, '')); setError(null); }}
              maxLength={10}
              required
              autoFocus
              className={styles.input}
            />
            {error && <p className={styles.error}>{error}</p>}
            <button
              type="submit"
              disabled={loading || dni.length < 7}
              className={styles.btn}
            >
              {loading ? 'Buscando...' : 'Ingresar'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className={styles.form}>
            <button type="button" onClick={goBack} className={styles.back}>
              ← Volver
            </button>
            <p className={styles.title}>Crear cuenta</p>
            <p className={styles.subtitle}>DNI {dni} · Primera vez en la app</p>
            <input
              type="text"
              placeholder="Nombre"
              value={nombre}
              onChange={(e) => { setNombre(e.target.value); setError(null); }}
              required
              autoFocus
              className={styles.input}
            />
            <input
              type="text"
              placeholder="Apellido"
              value={apellido}
              onChange={(e) => { setApellido(e.target.value); setError(null); }}
              required
              className={styles.input}
            />
            {error && <p className={styles.error}>{error}</p>}
            <button
              type="submit"
              disabled={loading || !nombre.trim() || !apellido.trim()}
              className={styles.btn}
            >
              {loading ? 'Creando...' : 'Crear inventario'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
