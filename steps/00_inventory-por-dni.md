# Feature: Inventario por DNI

Permitir que cada usuario tenga su propio inventario identificado por DNI.
Al ingresar a la app se solicita el DNI; si ya existe se carga su inventario,
si no existe se registra nombre y apellido y se crea un inventario vacío.

---

## Contexto actual

- Tabla `items` única y global (sin ownership).
- No existe tabla de usuarios.
- El frontend no tiene ningún concepto de sesión o usuario activo.
- Todos los endpoints devuelven / modifican todos los items sin filtrar.

---

## Fase 1 — Base de datos

**Objetivo:** agregar la tabla `users` y vincular `items` a un usuario.

### Cambios

**`backend/src/db/index.ts`**

1. Crear tabla `users`:
   ```sql
   CREATE TABLE IF NOT EXISTS users (
     id         SERIAL PRIMARY KEY,
     dni        VARCHAR(20)  NOT NULL UNIQUE,
     nombre     VARCHAR(100) NOT NULL,
     apellido   VARCHAR(100) NOT NULL,
     created_at TIMESTAMPTZ  DEFAULT NOW()
   );
   ```

2. Agregar columna `user_id` a `items` (FK a `users`):
   ```sql
   ALTER TABLE items
     ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
   ```
   > Se usa `ADD COLUMN IF NOT EXISTS` para que sea idempotente en re-ejecuciones.

3. Ejecutar ambos DDL dentro de `initDB()`, en orden: primero `users`, luego el ALTER de `items`.

**Restricciones clave:**
- `dni` tiene `UNIQUE` constraint → la DB rechaza duplicados sin lógica extra.
- `ON DELETE CASCADE` → si se elimina un usuario, sus items se eliminan automáticamente.

---

## Fase 2 — Backend: rutas de usuarios

**Objetivo:** exponer endpoints para buscar / crear usuarios por DNI.

### Nuevo archivo `backend/src/routes/users.ts`

| Método | Ruta              | Descripción                                                                 |
|--------|-------------------|-----------------------------------------------------------------------------|
| GET    | `/api/users/:dni` | Devuelve el usuario si el DNI existe, 404 si no.                           |
| POST   | `/api/users`      | Crea un usuario nuevo. Body: `{ dni, nombre, apellido }`. Devuelve el user creado. |

**Lógica GET `/api/users/:dni`:**
- Query: `SELECT * FROM users WHERE dni = $1`
- Si `rows.length === 0` → 404 `{ error: 'Usuario no encontrado' }`
- Si existe → 200 con el objeto user

**Lógica POST `/api/users`:**
- Validar que `dni`, `nombre`, `apellido` estén presentes.
- Intentar INSERT. Si viola UNIQUE en `dni` → 409 `{ error: 'El DNI ya está registrado' }`
- Éxito → 201 con el objeto user creado

**`backend/src/index.ts`:**
- Importar y montar `usersRouter` en `/api/users`.

---

## Fase 3 — Backend: filtrar items y stats por usuario

**Objetivo:** que todos los endpoints de items y stats operen sobre el `user_id` del usuario activo.

### `backend/src/routes/items.ts`

Todos los endpoints reciben `userId` desde el header `x-user-id` (o query param en GET).

| Endpoint       | Cambio                                                                             |
|----------------|------------------------------------------------------------------------------------|
| `GET /`        | Agregar `WHERE user_id = $1` filtrando por `userId`.                              |
| `POST /`       | Incluir `user_id` en el INSERT tomado del body / header.                          |
| `PUT /:id`     | Agregar `AND user_id = $1` al WHERE para evitar que un user edite items ajenos.   |
| `DELETE /:id`  | Igual que PUT.                                                                     |

**Convención elegida — header `x-user-id`:**
- El frontend lo envía en cada request una vez que el usuario ingresó su DNI.
- Evita exponer el `userId` en URLs (ej. `/api/items?userId=3`).

### `backend/src/routes/stats.ts`

- Agregar `WHERE user_id = $1` a la query de agregación.
- Recibir `userId` desde header `x-user-id`.

### `backend/src/routes/upload.ts`

- Al hacer INSERT de cada fila del CSV, incluir el `user_id`.
- Recibir `userId` desde el body del form (campo oculto `userId`).

---

## Fase 4 — Frontend: contexto de usuario

**Objetivo:** mantener el usuario activo disponible en toda la app sin prop-drilling.

### Nuevo archivo `frontend/src/lib/userContext.tsx`

```ts
interface User {
  id: number;
  dni: string;
  nombre: string;
  apellido: string;
}
```

- Crear `UserContext` con `React.createContext`.
- Crear `UserProvider` que:
  - Lee `userId` de `sessionStorage` al montar (persistencia en la pestaña).
  - Expone `user`, `setUser`, `clearUser`.
- Exportar hook `useUser()`.

**`frontend/src/app/layout.tsx`:**
- Envolver `{children}` con `<UserProvider>`.

---

## Fase 5 — Frontend: pantalla de ingreso por DNI

**Objetivo:** gate screen que bloquea el acceso hasta que el usuario ingrese su DNI.

### Nuevo componente `frontend/src/components/DniGate.tsx`

**Flujo:**

```
App carga
   │
   ├── ¿hay user en contexto?
   │       Sí → renderiza children (app normal)
   │       No → muestra DniGate
   │
DniGate — paso 1: campo DNI
   │
   ├── Submit → GET /api/users/:dni
   │       200 → setUser(data) → entra a la app
   │       404 → muestra paso 2 (registro)
   │
DniGate — paso 2: registro
   │   campos: nombre, apellido (DNI ya conocido)
   │
   └── Submit → POST /api/users { dni, nombre, apellido }
           201 → setUser(data) → entra a la app
           409 → mostrar error "DNI ya registrado"
```

**UX / diseño:**
- Pantalla full-screen dark, centrada, max-width 430px (mobile-first).
- Paso 1: input grande para DNI + botón "Ingresar".
- Paso 2: inputs nombre y apellido + botón "Registrarme" + link "← Volver".
- Mostrar spinner durante las requests.
- Validación inline: DNI solo números, mínimo 7 dígitos.

### `frontend/src/app/layout.tsx` (o un wrapper en `page.tsx`)

- Importar `DniGate` y usarlo como wrapper de la app:
  ```tsx
  <UserProvider>
    <DniGate>
      {children}
    </DniGate>
  </UserProvider>
  ```

---

## Fase 6 — Frontend: propagar userId en todas las llamadas API

**Objetivo:** que `api.ts` incluya el header `x-user-id` en cada fetch.

### `frontend/src/lib/api.ts`

- Crear helper `authHeaders(userId: number)` que devuelve `{ 'x-user-id': String(userId) }`.
- Actualizar todas las funciones (`getItems`, `getStats`, `createItem`, `updateItem`, `deleteItem`, `uploadCsv`) para:
  - Recibir `userId: number` como parámetro.
  - Incluir `authHeaders(userId)` en el header de cada request.

### Componentes afectados

| Componente        | Cambio                                                            |
|-------------------|-------------------------------------------------------------------|
| `Dashboard.tsx`   | Obtener `user` de `useUser()` y pasar `user.id` a `getStats()`.  |
| `ItemGrid.tsx`    | Obtener `user` de `useUser()` y pasar `user.id` a `getItems()`, `createItem()`, etc. |
| `CsvUploader.tsx` | Agregar campo `userId` al FormData antes de hacer POST.           |
| `AppLayout.tsx`   | Mostrar nombre del usuario y botón "Salir" (clearUser).           |

---

## Fase 7 — Cierre de sesión y UX final

**Objetivo:** permitir cambiar de usuario y pulir la experiencia.

### Cambios

- **`AppLayout.tsx`:** Agregar chip con `nombre apellido` del usuario activo + ícono de logout.
- **Logout:** llama a `clearUser()` del contexto → borra `sessionStorage` → vuelve a mostrar `DniGate`.
- **`HamburgerMenu.tsx`:** Agregar opción "Cambiar usuario" que llama al mismo logout.

---

## Fase 8 — Corrección del formulario de edición de items

**Objetivo:** corregir bugs existentes en `ItemGrid` / `ItemForm` y mejorar la UX de edición.

### Bugs identificados en el código actual

#### Bug 1 — Form no reinicializa al cambiar de ítem editado (`ItemGrid.tsx:158`)

`ItemForm` usa `useState` inicializado con `initial` prop:
```ts
const [form, setForm] = useState({ nombre: initial?.nombre ?? '', ... });
```
`useState` **solo usa el valor inicial en el primer montaje**. Si el usuario hace click en "editar ítem A", luego sin cerrar hace click en "editar ítem B", el form sigue mostrando los datos de A.

**Fix:** agregar `key={editItem?.id ?? 'new'}` al renderizar `ItemForm`. React desmonta y remonta el componente cuando la key cambia, reinicializando el estado:
```tsx
<ItemForm
  key={editItem?.id ?? 'new'}
  initial={editItem}
  onSave={handleSave}
  onCancel={...}
/>
```

#### Bug 2 — Sin feedback visual mientras se guarda (`ItemGrid.tsx:48`)

`handleSave` es async pero `ItemForm` no tiene ningún estado de carga. El usuario puede hacer click varias veces y lanzar múltiples requests en paralelo.

**Fix:** agregar `isSaving` state a `ItemForm`:
- Al hacer submit, setear `isSaving(true)`.
- Deshabilitar el botón "Guardar" y mostrar texto "Guardando..." mientras `isSaving`.
- La prop `onSave` debe ser tipada como `Promise<void>` para que el form pueda esperar el resultado y manejar el loading.

Cambio de tipo en `ItemFormProps`:
```ts
onSave: (data: Omit<Item, 'id' | 'created_at'>) => Promise<void>;
```

#### Bug 3 — Error no se limpia al reintentar (`ItemGrid.tsx:18,86`)

El `error` state se setea en catch pero nunca se limpia. Si el usuario tiene un error visible y hace una acción exitosa, el error sigue mostrado.

**Fix:** agregar `setError(null)` al inicio de `handleSave` y `handleDelete`.

#### Bug 4 — UX en mobile: form aparece arriba, ítem editado queda fuera de vista

Cuando la lista tiene varios items y el usuario toca "editar" en un ítem que está abajo, el form se renderiza en la parte superior del stack y el usuario pierde contexto de qué estaba editando.

**Fix:** convertir el form en un **bottom sheet** (drawer desde abajo), similar al patrón ya usado en `HamburgerMenu.tsx`. Ventajas:
- El form aparece siempre en el mismo lugar (parte inferior de la pantalla).
- El usuario puede ver la lista detrás del backdrop.
- Consistente con el patrón UX existente de la app.

Estructura del bottom sheet:
```
backdrop (semitransparente) + aside deslizable desde abajo
├── drag handle (barra decorativa)
├── título: "Editar Item" / "Nuevo Item"
├── campos del form
└── botones Cancelar / Guardar
```

### Archivos modificados en esta fase

| Archivo                          | Cambio                                                          |
|----------------------------------|-----------------------------------------------------------------|
| `frontend/src/components/ItemGrid.tsx`       | Fixes bug 1, 2, 3 + refactor form a bottom sheet     |
| `frontend/src/components/ItemGrid.module.css`| Estilos del bottom sheet (backdrop, drawer, handle)   |

### Orden de cambios recomendado

1. Fix bug 1 (key prop) — 1 línea, máximo impacto.
2. Fix bug 3 (limpiar error) — 2 líneas.
3. Fix bug 2 (isSaving + tipo async) — cambio coordinado form + handleSave.
4. Bug 4 (bottom sheet) — refactor más grande, hacer en último lugar.

---

## Resumen de archivos a crear / modificar

| Archivo                                         | Acción    |
|-------------------------------------------------|-----------|
| `backend/src/db/index.ts`                       | Modificar |
| `backend/src/routes/users.ts`                   | Crear     |
| `backend/src/routes/items.ts`                   | Modificar |
| `backend/src/routes/stats.ts`                   | Modificar |
| `backend/src/routes/upload.ts`                  | Modificar |
| `backend/src/index.ts`                          | Modificar |
| `frontend/src/lib/userContext.tsx`              | Crear     |
| `frontend/src/lib/api.ts`                       | Modificar |
| `frontend/src/lib/types.ts`                     | Modificar |
| `frontend/src/components/DniGate.tsx`           | Crear     |
| `frontend/src/components/DniGate.module.css`    | Crear     |
| `frontend/src/app/layout.tsx`                   | Modificar |
| `frontend/src/components/AppLayout.tsx`         | Modificar |
| `frontend/src/components/Dashboard.tsx`         | Modificar |
| `frontend/src/components/ItemGrid.tsx`          | Modificar |
| `frontend/src/components/CsvUploader.tsx`       | Modificar |
| `frontend/src/components/ItemGrid.tsx`          | Modificar (Fase 8) |
| `frontend/src/components/ItemGrid.module.css`   | Modificar (Fase 8) |

---

## Orden de implementación recomendado

1. Fase 1 → DB (base de todo)
2. Fase 2 → rutas `/api/users` (se puede testear con curl antes de tocar el front)
3. Fase 3 → filtrado en items/stats/upload
4. Fase 4 → contexto de usuario en React
5. Fase 5 → DniGate (la pantalla de entrada)
6. Fase 6 → propagar userId en api.ts y componentes
7. Fase 7 → logout y UX de cierre
8. Fase 8 → corrección formulario de edición

---

## Decisiones a confirmar antes de implementar

- [ ] ¿El DNI puede contener letras (ej. extranjeros) o solo números?
- [ ] ¿Se persiste la sesión entre pestañas? (`localStorage` vs `sessionStorage`)
- [ ] ¿Los items existentes (sin `user_id`) se asignan a un usuario por defecto o se descartan?
- [ ] ¿Se necesita que un admin pueda ver todos los inventarios?
