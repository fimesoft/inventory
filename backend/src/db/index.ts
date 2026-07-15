import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function initDB(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS items (
      id        SERIAL PRIMARY KEY,
      cantidad  INTEGER        NOT NULL,
      nombre    VARCHAR(255)   NOT NULL,
      costo_dolar DECIMAL(10,2) NOT NULL,
      venta_pesos DECIMAL(10,2) NOT NULL,
      created_at TIMESTAMPTZ   DEFAULT NOW()
    )
  `);
  console.log('Database initialized');
}
