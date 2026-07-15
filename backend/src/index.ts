import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDB } from './db';
import { itemsRouter } from './routes/items';
import { statsRouter } from './routes/stats';
import { uploadRouter } from './routes/upload';
import { dollarRateRouter } from './routes/dollarRate';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/items', itemsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/dollar-rate', dollarRateRouter);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

if (process.env.DATABASE_URL) {
  initDB().catch((err) => console.error('Error iniciando DB:', err));
}

// Escucha local en desarrollo; en Vercel se exporta la app
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`Backend corriendo en http://localhost:${PORT}`));
}

export default app;
