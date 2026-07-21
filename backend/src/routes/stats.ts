import { Router, Request, Response } from 'express';
import { pool } from '../db';

export const statsRouter = Router();

statsRouter.get('/', async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    res.status(401).json({ error: 'Usuario requerido' });
    return;
  }
  const dollarRate = parseFloat((req.query.dollarRate as string) || '1200');

  try {
    const result = await pool.query(`
      SELECT
        COALESCE(SUM(cantidad * costo_dolar), 0)   AS inversion_total,
        COALESCE(SUM(cantidad * venta_pesos), 0)   AS venta_total,
        COUNT(*)                                    AS total_items
      FROM items
      WHERE user_id = $1
    `, [userId]);

    const row = result.rows[0];
    const inversionTotal = parseFloat(row.inversion_total);
    const ventaTotal = parseFloat(row.venta_total);
    const gananciaTotal = ventaTotal / dollarRate - inversionTotal;

    res.json({
      inversionTotal,
      ventaTotal,
      gananciaTotal,
      totalItems: parseInt(row.total_items),
      dollarRate,
    });
  } catch {
    res.status(500).json({ error: 'Error al calcular estadísticas' });
  }
});
