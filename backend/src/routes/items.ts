import { Router, Request, Response } from 'express';
import { pool } from '../db';

export const itemsRouter = Router();

itemsRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM items ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener items' });
  }
});

itemsRouter.post('/', async (req: Request, res: Response) => {
  const { cantidad, nombre, costo_dolar, venta_pesos } = req.body;
  if (!cantidad || !nombre || !costo_dolar || !venta_pesos) {
    res.status(400).json({ error: 'Todos los campos son requeridos' });
    return;
  }
  try {
    const result = await pool.query(
      'INSERT INTO items (cantidad, nombre, costo_dolar, venta_pesos) VALUES ($1,$2,$3,$4) RETURNING *',
      [cantidad, nombre, costo_dolar, venta_pesos]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear item' });
  }
});

itemsRouter.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { cantidad, nombre, costo_dolar, venta_pesos } = req.body;
  try {
    const result = await pool.query(
      'UPDATE items SET cantidad=$1, nombre=$2, costo_dolar=$3, venta_pesos=$4 WHERE id=$5 RETURNING *',
      [cantidad, nombre, costo_dolar, venta_pesos, id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Item no encontrado' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar item' });
  }
});

itemsRouter.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM items WHERE id=$1', [id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar item' });
  }
});
