import { Router, Request, Response } from 'express';
import { pool } from '../db';

export const itemsRouter = Router();

function getUserId(req: Request): string | null {
  return (req.headers['x-user-id'] as string) ?? null;
}

itemsRouter.get('/', async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: 'Usuario requerido' });
    return;
  }
  try {
    const result = await pool.query(
      'SELECT * FROM items WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Error al obtener items' });
  }
});

itemsRouter.post('/', async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: 'Usuario requerido' });
    return;
  }
  const { cantidad, nombre, costo_dolar, venta_pesos } = req.body;
  if (!cantidad || !nombre || !costo_dolar || !venta_pesos) {
    res.status(400).json({ error: 'Todos los campos son requeridos' });
    return;
  }
  try {
    const result = await pool.query(
      'INSERT INTO items (user_id, cantidad, nombre, costo_dolar, venta_pesos) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [userId, cantidad, nombre, costo_dolar, venta_pesos]
    );
    res.status(201).json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Error al crear item' });
  }
});

itemsRouter.put('/:id', async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: 'Usuario requerido' });
    return;
  }
  const { id } = req.params;
  const { cantidad, nombre, costo_dolar, venta_pesos } = req.body;
  try {
    const result = await pool.query(
      'UPDATE items SET cantidad=$1, nombre=$2, costo_dolar=$3, venta_pesos=$4 WHERE id=$5 AND user_id=$6 RETURNING *',
      [cantidad, nombre, costo_dolar, venta_pesos, id, userId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Item no encontrado' });
      return;
    }
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Error al actualizar item' });
  }
});

itemsRouter.delete('/:id', async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: 'Usuario requerido' });
    return;
  }
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM items WHERE id=$1 AND user_id=$2', [id, userId]);
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Error al eliminar item' });
  }
});
