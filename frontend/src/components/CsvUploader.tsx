'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { uploadCsv } from '@/lib/api';
import styles from './CsvUploader.module.css';

export function CsvUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [replace, setReplace] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (!f.name.endsWith('.csv')) {
      setStatus({ type: 'error', msg: 'Solo se aceptan archivos .csv' });
      return;
    }
    setFile(f);
    setStatus(null);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const onInput = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setStatus(null);
    try {
      const res = await uploadCsv(file, replace);
      setStatus({ type: 'success', msg: res.message });
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  const dropzoneClass = dragging
    ? styles.dropzoneDragging
    : file
    ? styles.dropzoneHasFile
    : styles.dropzoneDefault;

  return (
    <div className={styles.stack}>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`${styles.dropzone} ${dropzoneClass}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          onChange={onInput}
          className={styles.hiddenInput}
        />
        <UploadCloud className={file ? styles.cloudIconActive : styles.cloudIconDefault} />
        {file ? (
          <>
            <p className={styles.fileName}>{file.name}</p>
            <p className={styles.fileSize}>{(file.size / 1024).toFixed(1)} KB</p>
          </>
        ) : (
          <>
            <p className={styles.dropText}>Seleccioná o arrastrá tu CSV</p>
            <p className={styles.dropHint}>Formato: CANTIDAD, NOMBRE, COSTO_DOLAR, VENTA_PESOS</p>
          </>
        )}
      </div>

      <label className={styles.optionLabel}>
        <div className={`${styles.checkbox} ${replace ? styles.checkboxChecked : styles.checkboxUnchecked}`}>
          {replace && <CheckIcon />}
        </div>
        <input
          type="checkbox"
          className={styles.hiddenInput}
          checked={replace}
          onChange={(e) => setReplace(e.target.checked)}
        />
        <div>
          <p className={styles.optionTitle}>Reemplazar inventario</p>
          <p className={styles.optionHint}>Borra todos los items antes de importar</p>
        </div>
      </label>

      {status && (
        <div className={`${styles.statusBox} ${status.type === 'success' ? styles.statusSuccess : styles.statusError}`}>
          {status.msg}
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || loading}
        className={styles.uploadBtn}
      >
        {loading ? 'Cargando...' : 'Importar CSV'}
      </button>
    </div>
  );
}

function UploadCloud({ className }: { className: string }) {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="2 6 5 9 10 3" />
    </svg>
  );
}
