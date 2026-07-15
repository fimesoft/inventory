import type { Item, Stats } from './types';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function getItems(): Promise<Item[]> {
  const res = await fetch(`${BASE}/api/items`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Error al obtener items');
  return res.json();
}

export async function getStats(dollarRate: number): Promise<Stats> {
  const res = await fetch(`${BASE}/api/stats?dollarRate=${dollarRate}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Error al obtener estadísticas');
  return res.json();
}

export async function createItem(data: Omit<Item, 'id' | 'created_at'>): Promise<Item> {
  const res = await fetch(`${BASE}/api/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error al crear item');
  return res.json();
}

export async function updateItem(id: number, data: Omit<Item, 'id' | 'created_at'>): Promise<Item> {
  const res = await fetch(`${BASE}/api/items/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error al actualizar item');
  return res.json();
}

export async function deleteItem(id: number): Promise<void> {
  const res = await fetch(`${BASE}/api/items/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error al eliminar item');
}

export async function uploadCsv(file: File, replace: boolean): Promise<{ message: string; count: number }> {
  const form = new FormData();
  form.append('file', file);
  form.append('replace', String(replace));
  const res = await fetch(`${BASE}/api/upload`, { method: 'POST', body: form });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Error al subir CSV');
  }
  return res.json();
}

export async function fetchDollarRate(): Promise<{ rate: number; compra: number; venta: number }> {
  const res = await fetch(`${BASE}/api/dollar-rate`);
  if (!res.ok) throw new Error('No se pudo obtener la cotización');
  return res.json();
}
