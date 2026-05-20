-- =======================================
-- MIGRACIÓN 002: SISTEMA DE PRECIOS
-- Proyecto: Agua Viflomax
-- =======================================

-- =======================================
-- SISTEMA DE PRECIOS MAYORISTA
-- =======================================
CREATE TABLE IF NOT EXISTS precios_mayorista (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  producto_id uuid NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  volumen_minimo INTEGER DEFAULT 1 CHECK (volumen_minimo >= 1),
  volumen_maximo INTEGER CHECK (volumen_maximo IS NULL OR volumen_maximo >= volumen_minimo),
  precio NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
  notas TEXT,
  vigente_desde DATE DEFAULT CURRENT_DATE,
  vigente_hasta DATE CHECK (vigente_hasta IS NULL OR vigente_hasta >= vigente_desde),
  creado_por TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (empresa_id, producto_id, volumen_minimo)
);

-- =======================================
-- SISTEMA DE PRECIOS DETALLE
-- =======================================
CREATE TABLE IF NOT EXISTS precios_detalle (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id uuid NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  sector TEXT,
  cantidad_minima INTEGER DEFAULT 1 CHECK (cantidad_minima >= 1),
  cantidad_maxima INTEGER CHECK (cantidad_maxima IS NULL OR cantidad_maxima >= cantidad_minima),
  precio NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
  notas TEXT,
  vigente_desde DATE DEFAULT CURRENT_DATE,
  vigente_hasta DATE CHECK (vigente_hasta IS NULL OR vigente_hasta >= vigente_desde),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =======================================
-- ÍNDICES para búsqueda de precios (performance crítica)
-- =======================================
CREATE INDEX IF NOT EXISTS idx_precios_mayorista_lookup
  ON precios_mayorista(empresa_id, producto_id, volumen_minimo);

CREATE INDEX IF NOT EXISTS idx_precios_detalle_lookup
  ON precios_detalle(producto_id, sector, cantidad_minima);

-- Índice único para evitar precios detalle duplicados
-- (sector puede ser NULL, se normaliza a '' para el índice)
CREATE UNIQUE INDEX IF NOT EXISTS idx_precios_detalle_unique
  ON precios_detalle(producto_id, COALESCE(sector, ''), cantidad_minima);

CREATE INDEX IF NOT EXISTS idx_precios_mayorista_vigencia
  ON precios_mayorista(vigente_desde, vigente_hasta);

CREATE INDEX IF NOT EXISTS idx_precios_detalle_vigencia
  ON precios_detalle(vigente_desde, vigente_hasta);

-- =======================================
-- RLS para tablas de precios
-- =======================================
ALTER TABLE precios_mayorista ENABLE ROW LEVEL SECURITY;
ALTER TABLE precios_detalle ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "precios_mayorista_admin_todo" ON precios_mayorista;
CREATE POLICY "precios_mayorista_admin_todo" ON precios_mayorista
  FOR ALL USING (get_user_role() = 'admin');

DROP POLICY IF EXISTS "precios_mayorista_chofer_lectura" ON precios_mayorista;
CREATE POLICY "precios_mayorista_chofer_lectura" ON precios_mayorista
  FOR SELECT USING (get_user_role() IN ('admin', 'chofer'));

DROP POLICY IF EXISTS "precios_detalle_admin_todo" ON precios_detalle;
CREATE POLICY "precios_detalle_admin_todo" ON precios_detalle
  FOR ALL USING (get_user_role() = 'admin');

DROP POLICY IF EXISTS "precios_detalle_chofer_lectura" ON precios_detalle;
CREATE POLICY "precios_detalle_chofer_lectura" ON precios_detalle
  FOR SELECT USING (get_user_role() IN ('admin', 'chofer'));
