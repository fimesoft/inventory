'use client';

import { useState, useEffect, useCallback } from 'react';
import { getStats, fetchDollarRate } from '@/lib/api';
import type { Stats } from '@/lib/types';
import { StatCard } from './StatCard';
import styles from './Dashboard.module.css';

function fmt(n: number, prefix = '$', decimals = 0) {
  return `${prefix}${n.toLocaleString('es-AR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

export function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [dollarRate, setDollarRate] = useState<number>(0);
  const [inputRate, setInputRate] = useState<string>('');
  const [rateDetail, setRateDetail] = useState<{ compra: number; venta: number } | null>(null);
  const [rateError, setRateError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchingRate, setFetchingRate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async (rate: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getStats(rate);
      setStats(data);
    } catch {
      setError('Error al cargar estadísticas. Verificá que el backend esté corriendo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setFetchingRate(true);
      try {
        const data = await fetchDollarRate();
        setDollarRate(data.rate);
        setInputRate(String(data.rate));
        setRateDetail({ compra: data.compra, venta: data.venta });
        loadStats(data.rate);
      } catch {
        setRateError('No se pudo obtener la cotización. Ingresá el valor manualmente.');
        setLoading(false);
      } finally {
        setFetchingRate(false);
      }
    };
    init();
  }, [loadStats]);

  const handleRateChange = () => {
    const rate = parseFloat(inputRate);
    if (!isNaN(rate) && rate > 0) {
      setDollarRate(rate);
      loadStats(rate);
    }
  };

  const handleFetchRate = async () => {
    setFetchingRate(true);
    setRateError(null);
    try {
      const { rate, compra, venta } = await fetchDollarRate();
      setDollarRate(rate);
      setInputRate(String(rate));
      setRateDetail({ compra, venta });
      loadStats(rate);
    } catch {
      setRateError('No se pudo obtener la cotización. Verificá el backend.');
    } finally {
      setFetchingRate(false);
    }
  };

  return (
    <div className={styles.stack}>
      <div className={styles.rateCard}>
        <p className={styles.rateLabel}>Tipo de Cambio (ARS/USD)</p>
        <div className={styles.rateRow}>
          <div className={styles.rateInputWrap}>
            <span className={styles.rateSymbol}>$</span>
            <input
              type="number"
              value={inputRate}
              onChange={(e) => setInputRate(e.target.value)}
              onBlur={handleRateChange}
              onKeyDown={(e) => e.key === 'Enter' && handleRateChange()}
              className={styles.rateInput}
              inputMode="decimal"
            />
          </div>
          <button
            onClick={handleFetchRate}
            disabled={fetchingRate}
            className={styles.rateBtn}
          >
            {fetchingRate ? '...' : 'Blue hoy'}
          </button>
        </div>
        {rateDetail && (
          <p className={styles.rateDetail}>
            Compra ${rateDetail.compra.toLocaleString('es-AR')} · Venta ${rateDetail.venta.toLocaleString('es-AR')} · Promedio
          </p>
        )}
        {rateError && <p className={styles.rateErrorText}>{rateError}</p>}
      </div>

      {error && <div className={styles.errorBox}>{error}</div>}

      {loading ? (
        <div className={styles.skeletons}>
          {[1, 2, 3].map((i) => <div key={i} className={styles.skeleton} />)}
        </div>
      ) : stats ? (
        <>
          <div className={styles.statList}>
            <StatCard
              label="Inversión Total"
              value={fmt(stats.inversionTotal, 'USD ')}
              sub={`${stats.totalItems} productos en stock`}
              color="red"
              icon={<InvestIcon />}
            />
            <StatCard
              label="Venta Total"
              value={fmt(stats.ventaTotal, '$ ', 0)}
              sub="Suma de ventas en pesos"
              color="green"
              icon={<SaleIcon />}
            />
            <StatCard
              label="Ganancia Total"
              value={fmt(stats.gananciaTotal, 'USD ')}
              sub={`Al dólar $${dollarRate.toLocaleString('es-AR')}`}
              color="teal"
              icon={<ProfitIcon />}
            />
          </div>

          <button onClick={() => loadStats(dollarRate)} className={styles.refreshBtn}>
            Actualizar
          </button>
        </>
      ) : null}
    </div>
  );
}

function InvestIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </svg>
  );
}

function SaleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function ProfitIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}
