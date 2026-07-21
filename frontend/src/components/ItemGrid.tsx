'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { getItems, deleteItem, createItem, updateItem } from '@/lib/api';
import { useUser } from '@/lib/userContext';
import type { Item } from '@/lib/types';
import styles from './ItemGrid.module.css';

function fmt(n: number) {
  return n.toLocaleString('es-AR');
}

export function ItemGrid() {
  const { user } = useUser();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getItems(user.id);
      setItems(data);
    } catch {
      setError('Error al cargar items');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter((i) =>
    i.nombre.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: number) => {
    if (!user || !confirm('¿Eliminar este item?')) return;
    setError(null);
    try {
      await deleteItem(id, user.id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch {
      setError('Error al eliminar');
    }
  };

  const handleSave = async (data: Omit<Item, 'id' | 'user_id' | 'created_at'>): Promise<void> => {
    if (!user) return;
    setError(null);
    if (editItem) {
      const updated = await updateItem(editItem.id, data, user.id);
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    } else {
      const created = await createItem(data, user.id);
      setItems((prev) => [created, ...prev]);
    }
    setShowForm(false);
    setEditItem(null);
  };

  const openNew = () => { setEditItem(null); setShowForm(true); };
  const openEdit = (item: Item) => { setEditItem(item); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditItem(null); };

  const sheet = showForm && mounted ? (
    <>
      <div className={styles.sheetBackdrop} onClick={closeForm} />
      <aside className={styles.sheet}>
        <div className={styles.sheetHandle} />
        <ItemForm
          key={editItem?.id ?? 'new'}
          initial={editItem}
          onSave={handleSave}
          onCancel={closeForm}
        />
      </aside>
    </>
  ) : null;

  return (
    <div className={styles.stack}>
      <div className={styles.searchRow}>
        <div className={styles.searchWrap}>
          <SearchIcon />
          <input
            type="text"
            placeholder="Buscar producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <button
          onClick={openNew}
          className={styles.addBtn}
          aria-label="Agregar item"
        >
          +
        </button>
      </div>

      {error && <div className={styles.errorBox}>{error}</div>}

      {loading ? (
        <div className={styles.skeletons}>
          {[1, 2, 3, 4].map((i) => <div key={i} className={styles.skeleton} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>
          {search ? 'Sin resultados' : 'No hay items. Subí un CSV para empezar.'}
        </div>
      ) : (
        <div className={styles.list}>
          <p className={styles.count}>{filtered.length} items</p>
          {filtered.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onEdit={() => openEdit(item)}
              onDelete={() => handleDelete(item.id)}
            />
          ))}
        </div>
      )}

      {mounted && createPortal(sheet, document.body)}
    </div>
  );
}

function ItemCard({ item, onEdit, onDelete }: { item: Item; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.cardInfo}>
          <p className={styles.cardName}>{item.nombre}</p>
          <p className={styles.cardQty}>Cant: {item.cantidad}</p>
        </div>
        <div className={styles.cardActions}>
          <button onClick={onEdit} className={styles.actionBtn} aria-label="Editar">
            <EditIcon />
          </button>
          <button onClick={onDelete} className={`${styles.actionBtn} ${styles.actionBtnDelete}`} aria-label="Eliminar">
            <TrashIcon />
          </button>
        </div>
      </div>
      <div className={styles.priceGrid}>
        <div className={styles.priceCellCost}>
          <p className={styles.priceLbl}>Costo</p>
          <p className={styles.priceValCost}>USD {fmt(item.costo_dolar)}</p>
        </div>
        <div className={styles.priceCellSale}>
          <p className={styles.priceLbl}>Venta</p>
          <p className={styles.priceValSale}>$ {fmt(item.venta_pesos)}</p>
        </div>
      </div>
    </div>
  );
}

interface ItemFormProps {
  initial: Item | null;
  onSave: (data: Omit<Item, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  onCancel: () => void;
}

function ItemForm({ initial, onSave, onCancel }: ItemFormProps) {
  const [form, setForm] = useState({
    nombre: initial?.nombre ?? '',
    cantidad: String(initial?.cantidad ?? ''),
    costo_dolar: String(initial?.costo_dolar ?? ''),
    venta_pesos: String(initial?.venta_pesos ?? ''),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSave({
        nombre: form.nombre,
        cantidad: parseInt(form.cantidad),
        costo_dolar: parseFloat(form.costo_dolar),
        venta_pesos: parseFloat(form.venta_pesos),
      });
    } catch {
      setError('Error al guardar. Intentá de nuevo.');
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <p className={styles.formTitle}>{initial ? 'Editar Item' : 'Nuevo Item'}</p>
      <input
        type="text"
        placeholder="Nombre del producto"
        value={form.nombre}
        onChange={set('nombre')}
        required
        className={styles.textInput}
      />
      <div className={styles.numGrid}>
        <input
          type="number"
          placeholder="Cant."
          value={form.cantidad}
          onChange={set('cantidad')}
          required min="1"
          className={styles.textInput}
          inputMode="numeric"
        />
        <input
          type="number"
          placeholder="USD"
          value={form.costo_dolar}
          onChange={set('costo_dolar')}
          required min="0" step="any"
          className={styles.textInput}
          inputMode="decimal"
        />
        <input
          type="number"
          placeholder="Pesos"
          value={form.venta_pesos}
          onChange={set('venta_pesos')}
          required min="0" step="any"
          className={styles.textInput}
          inputMode="decimal"
        />
      </div>
      {error && <p className={styles.formError}>{error}</p>}
      <div className={styles.btnRow}>
        <button type="button" onClick={onCancel} disabled={saving} className={styles.cancelBtn}>
          Cancelar
        </button>
        <button type="submit" disabled={saving} className={styles.saveBtn}>
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.searchIcon}>
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  );
}
