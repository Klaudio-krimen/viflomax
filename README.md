# Agua Viflomax — Sistema Digital

Sistema digital completo para Agua Viflomax, empresa de distribución de agua purificada a domicilio en Maipú, Chile.

## ¿Qué incluye?

- **Sitio web público** — vitrina de productos y formulario de pedido
- **Panel de administración** — gestión de clientes, pedidos, inventario y precios
- **App PWA para choferes** — entregas, GPS y modo offline (Android)

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 14 (App Router) + TypeScript |
| Base de datos | Supabase (PostgreSQL) |
| Estilos | Tailwind CSS |
| Autenticación | Supabase Auth |
| PWA | @ducanh2912/next-pwa |
| Deploy | Vercel |

## Setup Local

### Prerrequisitos
- Node.js 18+
- Cuenta en [Supabase](https://supabase.com) (free tier)
- Cuenta en [Vercel](https://vercel.com) (free tier)

### Instalación

```bash
git clone <tu-repositorio>
cd viflomax
npm install
cp .env.local.example .env.local
```

### Configurar Supabase

1. Crear un nuevo proyecto en [supabase.com](https://supabase.com)
2. Ir a **Settings > API** y copiar:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`
3. Ejecutar las migraciones SQL en el **SQL Editor** de Supabase, en orden:
   - `supabase/migrations/001_schema_inicial.sql`
   - `supabase/migrations/002_precios.sql`
   - `supabase/migrations/003_seed_datos.sql`
   - `supabase/migrations/004_funciones_atomicas.sql`

### Ejecutar en desarrollo

```bash
npm run dev
# Abrir http://localhost:3000
```

## Estructura del Proyecto

```
viflomax/
├── app/
│   ├── (public)/          # Sitio web público
│   ├── (admin)/           # Panel de administración
│   ├── (chofer)/          # PWA para choferes
│   └── api/               # API Routes serverless
├── components/
│   ├── ui/                # Componentes base (Button, Card, etc.)
│   ├── public/            # Componentes del sitio público
│   ├── admin/             # Componentes del panel admin
│   └── chofer/            # Componentes de la app del chofer
├── lib/
│   ├── supabase/          # Clientes de Supabase
│   ├── precios/           # Motor de cálculo de precios
│   ├── types/             # Tipos TypeScript
│   └── utils/             # Helpers generales
└── supabase/
    └── migrations/        # Migraciones SQL
```

## Deploy en Vercel

1. Conectar el repositorio en [vercel.com](https://vercel.com)
2. Configurar las variables de entorno (usar los mismos nombres de `.env.local.example`)
3. Deploy automático en cada push a `main`

## Roles de Usuario

| Rol | Acceso | Cómo crear |
|-----|--------|-----------|
| `admin` | Panel completo | En Supabase Dashboard: Auth > Users > crear usuario, luego en SQL: `SELECT auth.admin_update_user_by_email('email', '{"app_metadata": {"role": "admin"}}')` |
| `chofer` | Solo app de entregas | Crear usuario + asignar rol `chofer` y `chofer_id` en app_metadata |
| `publico` | Solo sitio web | Sin cuenta — acceso libre |

### Crear un chofer nuevo

1. En Supabase Dashboard → **Authentication > Users** → Invite User
2. En el **SQL Editor**:

```sql
-- 1. Crear registro de chofer
INSERT INTO choferes (nombre, telefono, vehiculo)
VALUES ('Nombre Chofer', '+56912345678', 'Furgón Blanco')
RETURNING id;

-- 2. Asignar rol y chofer_id al usuario (reemplazar los UUIDs)
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data ||
  '{"role": "chofer", "chofer_id": "<uuid-del-chofer>"}'::jsonb
WHERE email = 'chofer@viflomax.cl';
```

## Sistema de Precios

Ver documentación en `/admin/precios`:
- **Mayoristas**: precios negociados por empresa y tramo de volumen
- **Detalle**: precios por sector geográfico y cantidad

Los tests del motor de precios se ejecutan con:

```bash
npx jest --config jest.config.js lib/precios/calcular.test.ts
```
