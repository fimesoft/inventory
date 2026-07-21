import type { Item, Stats, User } from './types';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

function userHeaders(userId: number): HeadersInit {
  return { 'x-user-id': String(userId) };
}

export async function getUser(dni: string): Promise<User | null> {
  const res = await fetch(`${BASE}/api/users/${encodeURIComponent(dni)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Error al buscar usuario');
  return res.json();
}

export async function createUser(data: { dni: string; nombre: string; apellido: string }): Promise<User> {
  const res = await fetch(`${BASE}/api/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (res.status === 409) throw new Error('El DNI ya está registrado');
  if (!res.ok) throw new Error('Error al crear usuario');
  return res.json();
}

export async function getItems(userId: number): Promise<Item[]> {
  const res = await fetch(`${BASE}/api/items`, {
    cache: 'no-store',
    headers: userHeaders(userId),
  });
  if (!res.ok) throw new Error('Error al obtener items');
  return res.json();
}

export async function getStats(dollarRate: number, userId: number): Promise<Stats> {
  const res = await fetch(`${BASE}/api/stats?dollarRate=${dollarRate}`, {
    cache: 'no-store',
    headers: userHeaders(userId),
  });
  if (!res.ok) throw new Error('Error al obtener estadísticas');
  return res.json();
}

export async function createItem(data: Omit<Item, 'id' | 'user_id' | 'created_at'>, userId: number): Promise<Item> {
  const res = await fetch(`${BASE}/api/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...userHeaders(userId) },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error al crear item');
  return res.json();
}

export async function updateItem(id: number, data: Omit<Item, 'id' | 'user_id' | 'created_at'>, userId: number): Promise<Item> {
  const res = await fetch(`${BASE}/api/items/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...userHeaders(userId) },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error al actualizar item');
  return res.json();
}

export async function deleteItem(id: number, userId: number): Promise<void> {
  const res = await fetch(`${BASE}/api/items/${id}`, {
    method: 'DELETE',
    headers: userHeaders(userId),
  });
  if (!res.ok) throw new Error('Error al eliminar item');
}

export async function uploadCsv(file: File, replace: boolean, userId: number): Promise<{ message: string; count: number }> {
  const form = new FormData();
  form.append('file', file);
  form.append('replace', String(replace));
  const res = await fetch(`${BASE}/api/upload`, {
    method: 'POST',
    headers: userHeaders(userId),
    body: form,
  });
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
