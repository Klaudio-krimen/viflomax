-- ============================================================================
-- SCRIPT: Configuración Inicial de Roles — Agua Viflomax
-- ============================================================================
-- Uso: Ejecutar en Supabase SQL Editor para crear usuarios de demo
-- ⚠️  IMPORTANTE: Cambiar emails y contraseñas antes de producción
-- ============================================================================

-- ============================================================================
-- 1. CREAR ADMIN
-- ============================================================================
-- Opción A: Via SQL directo (requiere admin client)
-- INSERT INTO auth.users (...) — no soportado en SQL Editor público

-- Opción B: Vía dashboard, luego ejecutar este query para asignar rol
-- 1. Ir a Supabase Dashboard → Auth → Users → Create user
-- 2. Email: admin@viflomax.cl
-- 3. Password: (generar contraseña segura)
-- 4. Auto confirm: ✓ (sí, para testing)
-- 5. Ejecutar este query:

UPDATE auth.users
SET app_metadata = jsonb_set(
  COALESCE(app_metadata, '{}'::jsonb),
  '{role}',
  '"admin"'::jsonb
)
WHERE email = 'admin@viflomax.cl';

-- Verificar
SELECT email, app_metadata->>'role' as rol
FROM auth.users
WHERE email = 'admin@viflomax.cl';

-- ============================================================================
-- 2. CREAR CHOFERES
-- ============================================================================
-- Paso 1: Crear usuarios en Auth (vía dashboard como el admin anterior)
--
-- Crear 3 choferes de prueba:
-- - chofer1@viflomax.cl
-- - chofer2@viflomax.cl
-- - chofer3@viflomax.cl

-- Paso 2: Asignar rol 'chofer' a todos

UPDATE auth.users
SET app_metadata = jsonb_set(
  COALESCE(app_metadata, '{}'::jsonb),
  '{role}',
  '"chofer"'::jsonb
)
WHERE email IN ('chofer1@viflomax.cl', 'chofer2@viflomax.cl', 'chofer3@viflomax.cl');

-- Verificar
SELECT email, app_metadata->>'role' as rol
FROM auth.users
WHERE email LIKE 'chofer%@viflomax.cl'
ORDER BY email;

-- ============================================================================
-- 3. CREAR REGISTROS EN TABLA CHOFERES
-- ============================================================================
-- Obtener los user_id de los choferes recién creados

SELECT id, email FROM auth.users WHERE email LIKE 'chofer%@viflomax.cl';

-- Luego, insertar registros en tabla choferes
-- (Reemplazar user_id con los valores de arriba)

INSERT INTO choferes (user_id, nombre, telefono, vehiculo, activo) VALUES
(
  'USER_ID_AQUI_1',  -- Obtener del SELECT anterior
  'Juan García',
  '+56912345678',
  'Toyota Hiace Blanca — Patente ABC-123',
  true
),
(
  'USER_ID_AQUI_2',
  'María López',
  '+56912345679',
  'Toyota Hiace Gris — Patente ABC-124',
  true
),
(
  'USER_ID_AQUI_3',
  'Carlos Martínez',
  '+56912345680',
  'Toyota Hiace Azul — Patente ABC-125',
  true
);

-- Verificar choferes creados
SELECT
  c.nombre,
  c.telefono,
  c.vehiculo,
  u.email,
  u.app_metadata->>'role' as rol
FROM choferes c
LEFT JOIN auth.users u ON c.user_id = u.id
ORDER BY c.nombre;

-- ============================================================================
-- 4. LISTAR TODOS LOS USUARIOS Y SUS ROLES
-- ============================================================================

SELECT
  id,
  email,
  app_metadata->>'role' as rol,
  created_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;

-- ============================================================================
-- 5. CAMBIAR ROL DE UN USUARIO (ejemplo)
-- ============================================================================
-- Si necesitas cambiar a chofer1 de 'chofer' a 'admin':

UPDATE auth.users
SET app_metadata = jsonb_set(
  COALESCE(app_metadata, '{}'::jsonb),
  '{role}',
  '"admin"'::jsonb
)
WHERE email = 'chofer1@viflomax.cl';

-- ============================================================================
-- 6. REMOVER ROL DE UN USUARIO (dejar sin rol)
-- ============================================================================

UPDATE auth.users
SET app_metadata = jsonb_set(
  COALESCE(app_metadata, '{}'::jsonb),
  '{role}',
  'null'::jsonb
)
WHERE email = 'chofer1@viflomax.cl';

-- ============================================================================
-- PRÓXIMOS PASOS
-- ============================================================================
-- 1. Ejecutar paso por paso en Supabase SQL Editor
-- 2. Copiar los user_id del SELECT anterior
-- 3. Reemplazar 'USER_ID_AQUI_1' etc. en INSERT de choferes
-- 4. Ir a https://viflomax.vercel.app/login
-- 5. Probar login como:
--    - admin@viflomax.cl → debe ir a /admin/dashboard
--    - chofer1@viflomax.cl → debe ir a /chofer
