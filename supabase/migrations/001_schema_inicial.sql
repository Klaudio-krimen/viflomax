-- =======================================
-- MIGRACIÓN 001: ESQUEMA INICIAL
-- Proyecto: Agua Viflomax
-- =======================================

-- Habilitar extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =======================================
-- EMPRESAS MAYORISTAS
-- =======================================
CREATE TABLE IF NOT EXISTS empresas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  razon_social TEXT NOT NULL,
  rut TEXT,
  contacto TEXT,
  telefono TEXT,
  email TEXT,
  direccion TEXT,
  activo BOOLEAN DEFAULT true,
  notas_comerciales TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =======================================
-- PRODUCTOS
-- =======================================
CREATE TABLE IF NOT EXISTS productos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  categoria TEXT CHECK (categoria IN ('envase', 'recarga', 'dispensador', 'accesorio')),
  precio_base NUMERIC(10,2),
  activo BOOLEAN DEFAULT true
);

-- =======================================
-- CLIENTES
-- =======================================
CREATE TABLE IF NOT EXISTS clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  telefono TEXT,
  email TEXT,
  direccion TEXT,
  comuna TEXT,
  sector TEXT,
  tipo_cliente TEXT CHECK (tipo_cliente IN ('mayorista', 'detalle', 'nuevo')) DEFAULT 'nuevo',
  empresa_id uuid REFERENCES empresas(id) ON DELETE SET NULL,
  activo BOOLEAN DEFAULT true,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =======================================
-- CHOFERES (vinculados a auth.users)
-- =======================================
CREATE TABLE IF NOT EXISTS choferes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  nombre TEXT NOT NULL,
  telefono TEXT,
  vehiculo TEXT,
  activo BOOLEAN DEFAULT true
);

-- =======================================
-- PEDIDOS
-- =======================================
CREATE TABLE IF NOT EXISTS pedidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_pedido TEXT UNIQUE,
  cliente_id uuid REFERENCES clientes(id) ON DELETE SET NULL,
  empresa_id uuid REFERENCES empresas(id) ON DELETE SET NULL,
  chofer_id uuid REFERENCES choferes(id) ON DELETE SET NULL,
  fecha_pedido TIMESTAMPTZ DEFAULT now(),
  fecha_entrega_programada DATE,
  estado TEXT CHECK (estado IN ('nuevo', 'confirmado', 'en_ruta', 'entregado', 'cancelado')) DEFAULT 'nuevo',
  origen TEXT CHECK (origen IN ('web', 'whatsapp', 'telefono', 'manual')) DEFAULT 'manual',
  monto_total NUMERIC(10,2),
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-generar número de pedido
CREATE SEQUENCE IF NOT EXISTS pedido_seq START 1;

CREATE OR REPLACE FUNCTION generar_numero_pedido()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.numero_pedido IS NULL THEN
    NEW.numero_pedido := 'PED-' || to_char(now(), 'YYYY') || '-' || LPAD(nextval('pedido_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_numero_pedido ON pedidos;
CREATE TRIGGER trigger_numero_pedido
  BEFORE INSERT ON pedidos
  FOR EACH ROW EXECUTE FUNCTION generar_numero_pedido();

-- =======================================
-- ITEMS DE PEDIDO
-- =======================================
CREATE TABLE IF NOT EXISTS pedido_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id uuid NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id uuid NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  precio_unitario NUMERIC(10,2) NOT NULL,
  precio_origen TEXT CHECK (precio_origen IN ('mayorista', 'detalle_sector', 'base', 'manual', 'sin_precio')),
  subtotal NUMERIC(10,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED
);

-- =======================================
-- ENTREGAS
-- =======================================
CREATE TABLE IF NOT EXISTS entregas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id uuid NOT NULL REFERENCES pedidos(id) ON DELETE RESTRICT UNIQUE,
  chofer_id uuid NOT NULL REFERENCES choferes(id) ON DELETE RESTRICT,
  timestamp_entrega TIMESTAMPTZ DEFAULT now(),
  latitud NUMERIC(10,7),
  longitud NUMERIC(10,7),
  bidones_vacios_recibidos INTEGER DEFAULT 0,
  monto_cobrado NUMERIC(10,2),
  metodo_pago TEXT CHECK (metodo_pago IN ('efectivo', 'transferencia', 'pendiente')),
  foto_url TEXT,
  observaciones TEXT
);

-- Actualizar estado del pedido automáticamente al crear entrega
CREATE OR REPLACE FUNCTION actualizar_estado_pedido_entregado()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE pedidos SET estado = 'entregado' WHERE id = NEW.pedido_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_entrega_actualiza_pedido ON entregas;
CREATE TRIGGER trigger_entrega_actualiza_pedido
  AFTER INSERT ON entregas
  FOR EACH ROW EXECUTE FUNCTION actualizar_estado_pedido_entregado();

-- =======================================
-- INVENTARIO
-- =======================================
CREATE TABLE IF NOT EXISTS inventario (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id uuid NOT NULL REFERENCES productos(id) ON DELETE CASCADE UNIQUE,
  stock_bodega INTEGER DEFAULT 0 CHECK (stock_bodega >= 0),
  stock_vacios_bodega INTEGER DEFAULT 0 CHECK (stock_vacios_bodega >= 0),
  stock_en_ruta INTEGER DEFAULT 0 CHECK (stock_en_ruta >= 0),
  stock_minimo_alerta INTEGER DEFAULT 5,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger para updated_at de inventario
CREATE OR REPLACE FUNCTION update_inventario_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_inventario_updated_at ON inventario;
CREATE TRIGGER trigger_inventario_updated_at
  BEFORE UPDATE ON inventario
  FOR EACH ROW EXECUTE FUNCTION update_inventario_timestamp();

-- =======================================
-- ROW LEVEL SECURITY (RLS)
-- =======================================
-- Nota: En Supabase, los roles se manejan mediante app_metadata
-- El rol se almacena en auth.users.raw_app_meta_data->>'role'

ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE entregas ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE choferes ENABLE ROW LEVEL SECURITY;

-- Función helper para obtener el rol del usuario actual
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role'),
    'publico'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función helper para obtener el chofer_id del usuario actual
CREATE OR REPLACE FUNCTION get_chofer_id()
RETURNS uuid AS $$
BEGIN
  RETURN (auth.jwt() -> 'app_metadata' ->> 'chofer_id')::uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- POLÍTICAS para PRODUCTOS (lectura pública, escritura solo admin)
DROP POLICY IF EXISTS "productos_lectura_todos" ON productos;
CREATE POLICY "productos_lectura_todos" ON productos
  FOR SELECT USING (activo = true);

DROP POLICY IF EXISTS "productos_admin_todo" ON productos;
CREATE POLICY "productos_admin_todo" ON productos
  FOR ALL USING (get_user_role() = 'admin');

-- POLÍTICAS para CLIENTES (solo admin ve todos; chofer solo los suyos)
DROP POLICY IF EXISTS "clientes_admin_todo" ON clientes;
CREATE POLICY "clientes_admin_todo" ON clientes
  FOR ALL USING (get_user_role() = 'admin');

DROP POLICY IF EXISTS "clientes_chofer_lectura" ON clientes;
CREATE POLICY "clientes_chofer_lectura" ON clientes
  FOR SELECT USING (get_user_role() IN ('admin', 'chofer'));

-- POLÍTICAS para PEDIDOS
DROP POLICY IF EXISTS "pedidos_admin_todo" ON pedidos;
CREATE POLICY "pedidos_admin_todo" ON pedidos
  FOR ALL USING (get_user_role() = 'admin');

DROP POLICY IF EXISTS "pedidos_chofer_propios" ON pedidos;
CREATE POLICY "pedidos_chofer_propios" ON pedidos
  FOR SELECT USING (
    get_user_role() = 'chofer' AND chofer_id = get_chofer_id()
  );

-- POLÍTICAS para PEDIDO_ITEMS
DROP POLICY IF EXISTS "pedido_items_admin_todo" ON pedido_items;
CREATE POLICY "pedido_items_admin_todo" ON pedido_items
  FOR ALL USING (get_user_role() = 'admin');

DROP POLICY IF EXISTS "pedido_items_chofer_lectura" ON pedido_items;
CREATE POLICY "pedido_items_chofer_lectura" ON pedido_items
  FOR SELECT USING (
    get_user_role() = 'chofer' AND
    EXISTS (SELECT 1 FROM pedidos p WHERE p.id = pedido_id AND p.chofer_id = get_chofer_id())
  );

-- POLÍTICAS para ENTREGAS
DROP POLICY IF EXISTS "entregas_admin_todo" ON entregas;
CREATE POLICY "entregas_admin_todo" ON entregas
  FOR ALL USING (get_user_role() = 'admin');

DROP POLICY IF EXISTS "entregas_chofer_propias" ON entregas;
CREATE POLICY "entregas_chofer_propias" ON entregas
  FOR ALL USING (
    get_user_role() = 'chofer' AND chofer_id = get_chofer_id()
  );

-- POLÍTICAS para INVENTARIO (solo admin)
DROP POLICY IF EXISTS "inventario_admin_todo" ON inventario;
CREATE POLICY "inventario_admin_todo" ON inventario
  FOR ALL USING (get_user_role() = 'admin');

DROP POLICY IF EXISTS "inventario_chofer_lectura" ON inventario;
CREATE POLICY "inventario_chofer_lectura" ON inventario
  FOR SELECT USING (get_user_role() IN ('admin', 'chofer'));

-- POLÍTICAS para EMPRESAS (solo admin)
DROP POLICY IF EXISTS "empresas_admin_todo" ON empresas;
CREATE POLICY "empresas_admin_todo" ON empresas
  FOR ALL USING (get_user_role() = 'admin');

-- POLÍTICAS para CHOFERES
DROP POLICY IF EXISTS "choferes_admin_todo" ON choferes;
CREATE POLICY "choferes_admin_todo" ON choferes
  FOR ALL USING (get_user_role() = 'admin');

DROP POLICY IF EXISTS "choferes_propio" ON choferes;
CREATE POLICY "choferes_propio" ON choferes
  FOR SELECT USING (
    get_user_role() = 'chofer' AND user_id = auth.uid()
  );
