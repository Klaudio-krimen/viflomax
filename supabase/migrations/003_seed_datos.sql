-- =======================================
-- MIGRACIÓN 003: SEED DE DATOS INICIALES
-- Proyecto: Agua Viflomax
-- =======================================

-- =======================================
-- 1. PRODUCTOS (catálogo completo)
-- =======================================
INSERT INTO productos (nombre, descripcion, categoria, precio_base, activo)
VALUES
  ('Envase 20 Litros',         'Botellón de agua purificada 20 litros',       'envase',      5500,  true),
  ('Envase 10 Litros',         'Botellón de agua purificada 10 litros',       'envase',      3500,  true),
  ('Recarga 20 Litros',        'Recarga de agua purificada en envase 20L',    'recarga',     2500,  true),
  ('Recarga 10 Litros',        'Recarga de agua purificada en envase 10L',    'recarga',     1800,  true),
  ('Dispensador Bomba USB',    'Dispensador eléctrico con bomba USB',         'dispensador', 25000, true),
  ('Dispensador Básico Sobremesa', 'Dispensador manual de sobremesa básico',  'dispensador', 15000, true),
  ('Dispensador USB Sobremesa','Dispensador USB de sobremesa',                'dispensador', 20000, true),
  ('Hielo Purificado (bolsa)', 'Bolsa de hielo purificado',                  'accesorio',   2000,  true),
  ('Manilla Transportadora',   'Manilla para transporte de botellones',       'accesorio',   1500,  true)
ON CONFLICT DO NOTHING;

-- =======================================
-- 2. INVENTARIO INICIAL (en 0 para cada producto)
-- =======================================
INSERT INTO inventario (producto_id, stock_bodega, stock_vacios_bodega, stock_en_ruta, stock_minimo_alerta)
SELECT
  p.id,
  0,  -- stock_bodega
  0,  -- stock_vacios_bodega
  0,  -- stock_en_ruta
  5   -- stock_minimo_alerta
FROM productos p
ON CONFLICT (producto_id) DO NOTHING;

-- =======================================
-- 3. EMPRESA MAYORISTA DE EJEMPLO
-- =======================================
INSERT INTO empresas (razon_social, rut, activo)
VALUES ('Empresa Demo SA', '76.000.001-0', true)
ON CONFLICT DO NOTHING;

-- =======================================
-- 4. CLIENTE DE PRUEBA
-- =======================================
INSERT INTO clientes (nombre, telefono, sector, comuna, tipo_cliente, activo)
VALUES ('Cliente Demo', '56912345678', 'centro', 'Maipú', 'detalle', true)
ON CONFLICT DO NOTHING;

-- =======================================
-- 5. PRECIOS MAYORISTA DE EJEMPLO
--    Para empresa "Empresa Demo SA":
--      - Recarga 20L: 1-10 unid = 2200 CLP, 11+ = 1900 CLP
--      - Recarga 10L: 1-10 unid = 1500 CLP, 11+ = 1300 CLP
-- =======================================
WITH
  empresa AS (
    SELECT id FROM empresas WHERE rut = '76.000.001-0' LIMIT 1
  ),
  prod_r20 AS (
    SELECT id FROM productos WHERE nombre = 'Recarga 20 Litros' LIMIT 1
  ),
  prod_r10 AS (
    SELECT id FROM productos WHERE nombre = 'Recarga 10 Litros' LIMIT 1
  )
INSERT INTO precios_mayorista (empresa_id, producto_id, volumen_minimo, volumen_maximo, precio, notas)
SELECT empresa.id, prod_r20.id, 1,    10,   2200, 'Recarga 20L tramo 1-10 unidades'  FROM empresa, prod_r20
UNION ALL
SELECT empresa.id, prod_r20.id, 11,   NULL, 1900, 'Recarga 20L tramo 11+ unidades'   FROM empresa, prod_r20
UNION ALL
SELECT empresa.id, prod_r10.id, 1,    10,   1500, 'Recarga 10L tramo 1-10 unidades'  FROM empresa, prod_r10
UNION ALL
SELECT empresa.id, prod_r10.id, 11,   NULL, 1300, 'Recarga 10L tramo 11+ unidades'   FROM empresa, prod_r10
ON CONFLICT (empresa_id, producto_id, volumen_minimo) DO NOTHING;

-- =======================================
-- 6. PRECIOS DETALLE DE EJEMPLO
--    Para sector 'centro':
--      - Recarga 20L: cantidad 1+ = 2500 CLP
--      - Recarga 10L: cantidad 1+ = 1800 CLP
-- =======================================
WITH
  prod_r20 AS (
    SELECT id FROM productos WHERE nombre = 'Recarga 20 Litros' LIMIT 1
  ),
  prod_r10 AS (
    SELECT id FROM productos WHERE nombre = 'Recarga 10 Litros' LIMIT 1
  )
INSERT INTO precios_detalle (producto_id, sector, cantidad_minima, cantidad_maxima, precio, notas)
SELECT prod_r20.id, 'centro', 1, NULL, 2500, 'Recarga 20L sector centro' FROM prod_r20
UNION ALL
SELECT prod_r10.id, 'centro', 1, NULL, 1800, 'Recarga 10L sector centro' FROM prod_r10;
