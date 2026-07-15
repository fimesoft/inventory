import { Router, Request, Response } from 'express';

export const dollarRateRouter = Router();

interface DolarApiResponse {
  compra: number;
  venta: number;
}

dollarRateRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const resp = await fetch('https://dolarapi.com/v1/dolares/blue');
    if (!resp.ok) throw new Error('API no disponible');
    const data = (await resp.json()) as DolarApiResponse;
    const rate = (data.compra + data.venta) / 2;
    res.json({ rate: Math.round(rate * 100) / 100, compra: data.compra, venta: data.venta });
  } catch {
    res.status(503).json({ error: 'No se pudo obtener la cotización del dólar' });
  }
});
