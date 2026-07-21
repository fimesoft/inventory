import { Router, Request, Response } from 'express';
import { pool } from '../db';

export const usersRouter = Router();

usersRouter.get('/:dni', async (req: Request, res: Response) => {
  const { dni } = req.params;
  try {
    const result = await pool.query('SELECT * FROM users WHERE dni = $1', [dni]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Error al buscar usuario' });
  }
});

usersRouter.post('/', async (req: Request, res: Response) => {
  const { dni, nombre, apellido } = req.body;
  if (!dni || !nombre || !apellido) {
    res.status(400).json({ error: 'DNI, nombre y apellido son requeridos' });
    return;
  }
  try {
    const result = await pool.query(
      'INSERT INTO users (dni, nombre, apellido) VALUES ($1, $2, $3) RETURNING *',
      [dni, nombre, apellido]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    if (err.code === '23505') {
      res.status(409).json({ error: 'El DNI ya está registrado' });
      return;
    }
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});
