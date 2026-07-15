import { Router, Request, Response } from 'express';
import multer from 'multer';
import { parse } from 'csv-parse';
import { pool } from '../db';

export const uploadRouter = Router();

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

interface CsvRow {
  CANTIDAD: string;
  NOMBRE: string;
  COSTO_DOLAR: string;
  VENTA_PESOS: string;
}

uploadRouter.post('/', upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No se recibió ningún archivo' });
    return;
  }

  const replace = req.body.replace === 'true';

  try {
    const rows = await new Promise<CsvRow[]>((resolve, reject) => {
      parse(
        req.file!.buffer,
        { columns: true, skip_empty_lines: true, trim: true },
        (err, records) => (err ? reject(err) : resolve(records))
      );
    });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      if (replace) await client.query('DELETE FROM items');

      for (const row of rows) {
        const cantidad = parseInt(row.CANTIDAD);
        const costoDolar = parseFloat(row.COSTO_DOLAR);
        const ventaPesos = parseFloat(row.VENTA_PESOS);

        if (!row.NOMBRE || isNaN(cantidad) || isNaN(costoDolar) || isNaN(ventaPesos)) {
          continue;
        }

        await client.query(
          'INSERT INTO items (cantidad, nombre, costo_dolar, venta_pesos) VALUES ($1,$2,$3,$4)',
          [cantidad, row.NOMBRE, costoDolar, ventaPesos]
        );
      }

      await client.query('COMMIT');
      res.json({ message: `${rows.length} items procesados correctamente`, count: rows.length });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    res.status(500).json({ error: 'Error al procesar el CSV' });
  }
});
