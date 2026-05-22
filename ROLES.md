# 📋 Guía de Roles y Control de Acceso — Agua Viflomax

## Resumen Ejecutivo

El sistema de Agua Viflomax implementa **control de acceso basado en roles (RBAC)** usando Supabase Auth. Cada usuario tiene un rol asignado en `app_metadata` que determina:
- A qué partes de la app puede acceder
- Qué funciones puede ejecutar
- Dónde se redirige después de iniciar sesión

---

## 1️⃣ Roles Disponibles

| Rol | Acceso | Ruta Principal | Descripción |
|---|---|---|---|
| **chofer** | PWA del chofer | `/chofer` | Choferes de distribución. Registran entregas, ven pedidos asignados, consultan inventario. |
| **admin** | Panel administrativo + acceso a chofer | `/admin/dashboard` | Administradores. Ven todas las órdenes, reportes, configuración. Pueden asumir rol de chofer si necesitan. |
| *(sin rol)* | Sitio público | `/` | Visitantes. Ven públicidad, pueden hacer pedidos por WhatsApp. |

---

## 2️⃣ Cómo Funciona la Autenticación

### Flujo de Login

```
Usuario escribe email + contraseña
        ↓
Login → Supabase Auth valida credenciales
        ↓
Supabase devuelve `user` con `app_metadata.role`
        ↓
Front-end lee el rol y redirige:
  • rol='admin'  → /admin/dashboard
  • rol='chofer' → /chofer
  • sin rol      → /
```

### Archivos Clave

**`app/login/page.tsx`** — Pantalla de login
```typescript
const rol = data.user.app_metadata?.role as string | undefined

if (rol === 'admin') {
  router.push('/admin/dashboard')
} else if (rol === 'chofer') {
  router.push('/chofer')
} else {
  router.push('/')
}
```

**`middleware.ts`** — Protección de rutas
```typescript
// Proteger /admin/* → solo rol 'admin'
if (pathname.startsWith('/admin')) {
  if (!user || rol !== 'admin') {
    // Redirigir a /login
  }
}

// Proteger /chofer/* → rol 'chofer' o 'admin'
if (pathname.startsWith('/chofer')) {
  if (!user || !['chofer', 'admin'].includes(rol ?? '')) {
    // Redirigir a /login
  }
}
```

---

## 3️⃣ Cómo Crear Usuarios con Roles en Supabase

### Opción A: Vía Supabase Dashboard (recomendado para admin)

1. **Ir a Supabase Dashboard**
   - URL: https://app.supabase.com → tu proyecto → **Authentication** → **Users**

2. **Crear usuario nuevo**
   - Click **"Invite"** o **"Create user"**
   - Email: `chofer1@viflomax.cl`
   - Password: genera una contraseña segura
   - **NO** marques "Auto confirm" — el usuario debe confirmar su email primero

3. **Asignar rol (via SQL)**
   - Ve a **SQL Editor** en Supabase
   - Ejecuta este query (reemplaza con el user_id correcto):

```sql
-- Obtener el user_id del usuario recién creado
SELECT id FROM auth.users WHERE email = 'chofer1@viflomax.cl';

-- Asignar rol 'chofer'
UPDATE auth.users 
SET app_metadata = jsonb_set(
  COALESCE(app_metadata, '{}'::jsonb),
  '{role}',
  '"chofer"'::jsonb
)
WHERE email = 'chofer1@viflomax.cl';

-- Verificar que se asignó correctamente
SELECT email, app_metadata->>'role' as rol 
FROM auth.users 
WHERE email = 'chofer1@viflomax.cl';
```

### Opción B: Vía Script Python (para bulk de choferes)

**Archivo: `scripts/create_users_bulk.py`**

```python
import supabase
import json

# Configurar cliente Supabase
SUPABASE_URL = "https://your-project.supabase.co"
SUPABASE_KEY = "your-service-role-key"  # ⚠️ SECRETO — nunca commitear

client = supabase.create_client(SUPABASE_URL, SUPABASE_KEY)

# Lista de choferes a crear
choferes = [
    {"email": "chofer1@viflomax.cl", "nombre": "Juan García", "telefono": "9XXXXXXXX"},
    {"email": "chofer2@viflomax.cl", "nombre": "María López", "telefono": "9XXXXXXXX"},
    {"email": "chofer3@viflomax.cl", "nombre": "Carlos Martínez", "telefono": "9XXXXXXXX"},
]

for chofer in choferes:
    try:
        # 1. Crear usuario en Supabase Auth
        password = "TemporalPassword123!"  # El usuario debe cambiarla al primer login
        
        response = client.auth.admin.create_user({
            "email": chofer["email"],
            "password": password,
            "email_confirm": True,  # Confirmar automáticamente
            "app_metadata": {"role": "chofer"},
        })
        
        user_id = response.user.id
        print(f"✓ Usuario creado: {chofer['email']} (ID: {user_id})")
        
        # 2. Crear registro en tabla choferes
        client.table("choferes").insert({
            "user_id": user_id,
            "nombre": chofer["nombre"],
            "telefono": chofer["telefono"],
            "activo": True,
        }).execute()
        
        print(f"  ✓ Registro de chofer creado en BD")
        
    except Exception as e:
        print(f"✗ Error creando {chofer['email']}: {e}")
```

**Uso:**
```bash
# Instalar dependencias
pip install supabase python-dotenv

# Crear archivo .env.local con:
# SUPABASE_URL=https://...
# SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Ejecutar script
python scripts/create_users_bulk.py
```

---

## 4️⃣ Cómo Asignar Roles a Usuarios Existentes

### En Supabase SQL Editor

```sql
-- Cambiar un usuario de sin-rol a 'chofer'
UPDATE auth.users 
SET app_metadata = jsonb_set(
  COALESCE(app_metadata, '{}'::jsonb),
  '{role}',
  '"chofer"'::jsonb
)
WHERE email = 'usuario@viflomax.cl';

-- Cambiar a 'admin'
UPDATE auth.users 
SET app_metadata = jsonb_set(
  COALESCE(app_metadata, '{}'::jsonb),
  '{role}',
  '"admin"'::jsonb
)
WHERE email = 'usuario@viflomax.cl';

-- Remover rol (dejar vacío)
UPDATE auth.users 
SET app_metadata = jsonb_set(
  COALESCE(app_metadata, '{}'::jsonb),
  '{role}',
  'null'::jsonb
)
WHERE email = 'usuario@viflomax.cl';
```

---

## 5️⃣ Estructura de Base de Datos — Tabla `choferes`

Cada chofer debe tener un registro en la tabla `choferes` vinculado a su `user_id`:

```sql
CREATE TABLE choferes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  nombre TEXT NOT NULL,
  telefono TEXT,
  vehiculo TEXT,
  activo BOOLEAN DEFAULT true
);
```

**Insertar un chofer nuevo:**
```sql
INSERT INTO choferes (user_id, nombre, telefono, vehiculo, activo)
VALUES (
  'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',  -- User ID de auth.users
  'Juan García Pérez',
  '+56912345678',
  'Toyota Hiace 2020 — Patente ABCD-12',
  true
);
```

---

## 6️⃣ Protección de Rutas — Cómo Funciona

### Rutas Públicas (sin autenticación)
```
/                    → Home público
/pedir              → Formulario de pedido (público, puede mejorar con validación)
/login              → Pantalla de login
```

### Rutas Protegidas — Chofer
```
/chofer              → Require rol 'chofer' o 'admin'
/chofer/entrega/*    → Require rol 'chofer' o 'admin'
/chofer/inventario   → Require rol 'chofer' o 'admin'
```

**Middleware (`lib/supabase/middleware.ts`):**
```typescript
// Si intenta acceder a /chofer sin autenticación → /login
// Si intenta acceder a /chofer con rol 'admin' → permitir (admin puede asumir rol chofer)
// Si intenta acceder a /chofer con otro rol → /login
```

### Rutas Protegidas — Admin
```
/admin/dashboard     → Require rol 'admin' solo
/admin/*             → Require rol 'admin' solo
```

---

## 7️⃣ Checklist de Implementación

### Paso 1: Crear usuarios en Supabase
- [ ] Admin: crear al menos 1 usuario con rol `admin`
- [ ] Choferes: crear 2-3 usuarios con rol `chofer` para testing
- [ ] Verificar que `app_metadata.role` esté asignado correctamente en cada usuario

### Paso 2: Crear registros en tabla `choferes`
- [ ] Para cada chofer, insertar un registro en `choferes` con su `user_id`
- [ ] Incluir nombre, teléfono, vehículo

### Paso 3: Probar flujo de login
- [ ] Login como admin → debe ir a `/admin/dashboard`
- [ ] Login como chofer → debe ir a `/chofer`
- [ ] Login sin rol → debe ir a `/` (o quedar atrapado si intenta acceder a ruta protegida)

### Paso 4: Probar protección de rutas
- [ ] Chofer intenta acceder a `/admin` → debe redirigir a `/login`
- [ ] Admin accede a `/chofer` → debe funcionar (admin incluido en whitelist)
- [ ] Usuario sin rol intenta acceder a `/chofer` → debe redirigir a `/login`

---

## 8️⃣ Permisos de Datos — ¿Quién Ve Qué?

### Chofer
```
✓ Ve:
  - Sus propios pedidos asignados
  - Su propio inventario
  - Su propio historial de entregas
  
✗ No ve:
  - Pedidos de otros choferes
  - Panel administrativo completo
  - Reportes de otros
  - Precios mayorista
```

### Admin
```
✓ Ve:
  - TODOS los pedidos
  - TODOS los choferes
  - TODAS las entregas
  - TODOS los reportes
  - Puede asumir rol 'chofer' si lo necesita
  
✓ Puede:
  - Crear/editar productos
  - Crear/editar clientes
  - Asignar pedidos a choferes
  - Ver reportes de cobranza
```

---

## 9️⃣ Variables de Entorno Requeridas

Asegurar que en `.env.local` (nunca commitear) estén:

```env
# Supabase — públicas
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...

# Supabase — secreto (solo backend)
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...  # ⚠️ SECRETO
```

**.gitignore debe incluir:**
```
.env.local
.env*.local
```

---

## 🔟 Scripts útiles

### Ver todos los usuarios y sus roles

```sql
SELECT 
  id,
  email,
  app_metadata->>'role' as rol,
  created_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;
```

### Contar usuarios por rol

```sql
SELECT 
  app_metadata->>'role' as rol,
  COUNT(*) as cantidad
FROM auth.users
GROUP BY app_metadata->>'role';
```

### Listar choferes activos con su usuario

```sql
SELECT 
  c.id,
  c.nombre,
  c.telefono,
  c.vehiculo,
  c.activo,
  u.email,
  u.app_metadata->>'role' as rol
FROM choferes c
LEFT JOIN auth.users u ON c.user_id = u.id
WHERE c.activo = true
ORDER BY c.nombre;
```

---

## 1️⃣1️⃣ Troubleshooting

### ❌ "Usuario logueado pero no ve el dashboard"
- **Causa:** Rol no asignado correctamente
- **Solución:** Verificar `app_metadata` en Supabase → Auth → Users
- **Revisar:**
  ```sql
  SELECT email, app_metadata FROM auth.users WHERE email = 'tu@email.cl';
  ```

### ❌ "Redirige a login infinitamente"
- **Causa:** Middleware no actualiza sesión correctamente
- **Solución:** Limpiar cookies y reintentar login
- **Verificar:** Network tab → ver si `middleware` está retornando 302

### ❌ "Chofer no ve sus pedidos"
- **Causa:** Datos filtrados por `chofer_id` en API
- **Solución:** Verificar que el registro en tabla `choferes` existe y tiene `user_id` correcto

### ❌ "No puedo crear usuario via script Python"
- **Causa:** `SUPABASE_SERVICE_ROLE_KEY` inválida o expirada
- **Solución:** Regenerar la key en Supabase Dashboard → Settings → API Keys → copy "Service role"

---

## 1️⃣2️⃣ Próximos Pasos (Futuro)

- [ ] **Email verification:** Requerir que choferes confirmen email antes de acceder
- [ ] **2FA (Two-Factor Auth):** Para admin
- [ ] **Password reset:** Implementar flujo de recuperación de contraseña
- [ ] **Audit logs:** Registrar quién accedió qué y cuándo (compliance)
- [ ] **Row-level security (RLS):** Choferes solo ven sus propios datos vía RLS
- [ ] **Session timeout:** Auto-logout después de 1 hora de inactividad

---

**Última actualización:** 22 de mayo, 2026  
**Versión:** 1.0  
**Mantenedor:** Equipo Viflomax
