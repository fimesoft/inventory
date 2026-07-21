import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function initDB(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id         SERIAL PRIMARY KEY,
      dni        VARCHAR(20)  NOT NULL UNIQUE,
      nombre     VARCHAR(100) NOT NULL,
      apellido   VARCHAR(100) NOT NULL,
      created_at TIMESTAMPTZ  DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS items (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER        REFERENCES users(id) ON DELETE CASCADE,
      cantidad    INTEGER        NOT NULL,
      nombre      VARCHAR(255)   NOT NULL,
      costo_dolar DECIMAL(10,2)  NOT NULL,
      venta_pesos DECIMAL(10,2)  NOT NULL,
      created_at  TIMESTAMPTZ    DEFAULT NOW()
    )
  `);

  await pool.query(`
    ALTER TABLE items
    ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
  `);

  console.log('Database initialized');
}
