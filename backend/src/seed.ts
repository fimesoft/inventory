import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { pool, initDB } from './db';
import dotenv from 'dotenv';

dotenv.config();

async function seed() {
  await initDB();

  const csvPath = path.join(__dirname, '../../inventory.csv');
  const content = fs.readFileSync(csvPath, 'utf-8');
  const rows = parse(content, { columns: true, skip_empty_lines: true, trim: true });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM items');
    for (const row of rows as any[]) {
      await client.query(
        'INSERT INTO items (cantidad, nombre, costo_dolar, venta_pesos) VALUES ($1,$2,$3,$4)',
        [parseInt(row.CANTIDAD), row.NOMBRE, parseFloat(row.COSTO_DOLAR), parseFloat(row.VENTA_PESOS)]
      );
    }
    await client.query('COMMIT');
    console.log(`Seed completado: ${rows.length} items insertados`);
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(console.error);
