export interface User {
  id: number;
  dni: string;
  nombre: string;
  apellido: string;
  created_at: string;
}

export interface Item {
  id: number;
  user_id: number;
  cantidad: number;
  nombre: string;
  costo_dolar: number;
  venta_pesos: number;
  created_at: string;
}

export interface Stats {
  inversionTotal: number;
  ventaTotal: number;
  gananciaTotal: number;
  totalItems: number;
  dollarRate: number;
}
