# Inventory

Aplicación de gestión de inventario de artículos electrónicos. Diseño 100% mobile-first con soporte para importación de CSV, visualización de métricas financieras y CRUD de productos.

---

## Stack

| Capa       | Tecnología                              |
|------------|-----------------------------------------|
| Frontend   | Next.js 14 (App Router) + CSS Modules  |
| Backend    | Express + TypeScript                    |
| Base de datos | PostgreSQL                           |
| Tipado     | TypeScript en ambos lados               |

---

## Requisitos previos

- [Node.js](https://nodejs.org/) v18 o superior
- [Docker](https://www.docker.com/) (para levantar PostgreSQL localmente)
- npm v9 o superior

---

## Estructura del proyecto

```
inventory/
├── backend/                  # API Express
│   ├── src/
│   │   ├── db/index.ts       # Conexión y migración de tabla
│   │   ├── routes/
│   │   │   ├── items.ts      # CRUD de productos
│   │   │   ├── stats.ts      # Métricas del dashboard
│   │   │   ├── upload.ts     # Importación de CSV
│   │   │   └── dollarRate.ts # Cotización del dólar blue
│   │   ├── seed.ts           # Script para cargar datos iniciales
│   │   └── index.ts          # Entry point
│   ├── .env.example
│   └── package.json
├── frontend/                 # Next.js app
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx          # Dashboard (raíz)
│   │   │   ├── upload/page.tsx   # Importar CSV
│   │   │   └── items/page.tsx    # Listado de productos
│   │   ├── components/           # UI con CSS Modules
│   │   └── lib/                  # API client y tipos
│   ├── .env.local.example
│   └── package.json
├── inventory.csv             # Datos de ejemplo (seed)
├── docker-compose.yml        # PostgreSQL local
└── package.json              # Runner con concurrently
```

---

## Configuración

### 1. Variables de entorno

**Backend** — copiar y editar:

```bash
cp backend/.env.example backend/.env
```

```env
DATABASE_URL=postgresql://inventory:inventory@localhost:5432/inventory
PORT=3001
```

**Frontend** — copiar y editar:

```bash
cp frontend/.env.local.example frontend/.env.local
```

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 2. Instalar dependencias

```bash
# Dependencias del runner raíz
npm install

# Backend
cd backend && npm install && cd ..

# Frontend
cd frontend && npm install && cd ..
```

---

## Levantar la base de datos (local)

```bash
docker-compose up -d
```

Esto levanta un PostgreSQL en `localhost:5432` con:
- **Usuario:** `inventory`
- **Contraseña:** `inventory`
- **Base de datos:** `inventory`

La tabla `items` se crea automáticamente cuando arranca el backend por primera vez.

---

## Cargar datos iniciales (seed)

Para poblar la base de datos con el archivo `inventory.csv` incluido en el proyecto:

```bash
cd backend && npm run seed
```

Esto borra los datos existentes e inserta los registros del CSV.

---

## Levantar el proyecto

### Opción A — Backend y frontend juntos

Desde la raíz del proyecto:

```bash
npm run dev
```

Esto corre ambos servidores en paralelo:
- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **Backend:** [http://localhost:3001](http://localhost:3001)

### Opción B — Por separado

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

---

## Funcionalidades

### Dashboard (`/`)

Pantalla principal con tres métricas calculadas sobre todo el inventario:

| Métrica | Descripción |
|---|---|
| **Inversión Total** | `SUM(cantidad × costo_dolar)` — total invertido en USD |
| **Venta Total** | `SUM(cantidad × venta_pesos)` — ingresos proyectados en ARS |
| **Ganancia Total** | `(Venta Total / tipo_cambio) − Inversión Total` — ganancia neta en USD |

El tipo de cambio se puede ingresar manualmente o consultar en tiempo real desde el botón **"Blue hoy"**, que obtiene el valor del [dólar blue](https://bluelytics.com.ar/) automáticamente.

---

### Upload CSV (`/upload`)

Importación masiva de productos desde un archivo `.csv`.

**Formato esperado:**

```csv
CANTIDAD,NOMBRE,COSTO_DOLAR,VENTA_PESOS
2,Auricular Logitech G535,85,220000
1,Notebook HP Victus,785,1600000
```

- Soporta **drag & drop** o selección de archivo
- Opción para **reemplazar todo el inventario** o agregar los nuevos registros sobre los existentes
- Muestra confirmación con la cantidad de items procesados

---

### Listado de Items (`/items`)

Grilla de todos los productos cargados en el inventario.

- **Búsqueda** en tiempo real por nombre de producto
- **Agregar** nuevos items desde un formulario inline
- **Editar** cualquier campo de un item existente
- **Eliminar** con confirmación

Cada card muestra: nombre, cantidad, costo en USD y precio de venta en ARS.

---

## API Endpoints

Base URL: `http://localhost:3001`

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/items` | Lista todos los productos |
| `POST` | `/api/items` | Crea un producto |
| `PUT` | `/api/items/:id` | Actualiza un producto |
| `DELETE` | `/api/items/:id` | Elimina un producto |
| `GET` | `/api/stats?dollarRate=1200` | Métricas del dashboard |
| `POST` | `/api/upload` | Importa un CSV (multipart/form-data) |
| `GET` | `/api/dollar-rate` | Cotización actual del dólar blue |
| `GET` | `/api/health` | Health check |

---

## Despliegue en Vercel

El frontend puede desplegarse directamente en Vercel. El backend requiere un servicio compatible con Node.js (Railway, Render, etc.). Configurar la variable `NEXT_PUBLIC_API_URL` en Vercel con la URL del backend desplegado.

Para la base de datos, se puede usar [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) configurando la variable `DATABASE_URL` en el backend.
