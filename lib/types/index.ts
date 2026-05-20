/**
 * Tipos TypeScript para Agua Viflomax
 * Sistema de distribución de agua a domicilio
 *
 * Este archivo contiene todos los tipos que reflejan el esquema SQL del proyecto
 * Importado por: API routes, components, pages
 */

// Re-exportar tipos de Supabase
export type { Database } from './database'

// ============================================================================
// TIPOS BASE DE NEGOCIO (reflejan tablas SQL)
// ============================================================================

/**
 * Empresa mayorista
 */
export type Empresa = {
  id: string
  razon_social: string
  rut: string | null
  contacto: string | null
  telefono: string | null
  email: string | null
  direccion: string | null
  activo: boolean
  notas_comerciales: string | null
  created_at: string
}

/**
 * Cliente
 */
export type Cliente = {
  id: string
  nombre: string
  telefono: string | null
  email: string | null
  direccion: string | null
  comuna: string | null
  sector: string | null
  tipo_cliente: 'mayorista' | 'detalle' | 'nuevo'
  empresa_id: string | null
  activo: boolean
  notas: string | null
  created_at: string
}

/**
 * Producto
 */
export type Producto = {
  id: string
  nombre: string
  descripcion: string | null
  categoria: 'envase' | 'recarga' | 'dispensador' | 'accesorio'
  precio_base: number | null
  activo: boolean
}

/**
 * Chofer
 */
export type Chofer = {
  id: string
  user_id: string | null
  nombre: string
  telefono: string | null
  vehiculo: string | null
  activo: boolean
}

/**
 * Precio mayorista (por empresa, producto y tramo de volumen)
 */
export type PrecioMayorista = {
  id: string
  empresa_id: string
  producto_id: string
  volumen_minimo: number
  volumen_maximo: number | null
  precio: number
  notas: string | null
  vigente_desde: string
  vigente_hasta: string | null
  creado_por: string | null
  created_at: string
}

/**
 * Precio detalle (por sector y cantidad)
 */
export type PrecioDetalle = {
  id: string
  producto_id: string
  sector: string | null
  cantidad_minima: number
  cantidad_maxima: number | null
  precio: number
  notas: string | null
  vigente_desde: string
  vigente_hasta: string | null
  created_at: string
}

/**
 * Estado posible de un pedido
 */
export type EstadoPedido = 'nuevo' | 'confirmado' | 'en_ruta' | 'entregado' | 'cancelado'

/**
 * Origen del pedido (cómo fue creado)
 */
export type OrigenPedido = 'web' | 'whatsapp' | 'telefono' | 'manual'

/**
 * Pedido
 */
export type Pedido = {
  id: string
  numero_pedido: string | null
  cliente_id: string | null
  empresa_id: string | null
  chofer_id: string | null
  fecha_pedido: string
  fecha_entrega_programada: string | null
  estado: EstadoPedido
  origen: OrigenPedido
  monto_total: number | null
  notas: string | null
  created_at: string
}

/**
 * Origen del precio aplicado en un item de pedido
 */
export type OrigenPrecio = 'mayorista' | 'detalle_sector' | 'base' | 'manual' | 'sin_precio'

/**
 * Item de pedido (línea de producto en un pedido)
 */
export type PedidoItem = {
  id: string
  pedido_id: string
  producto_id: string
  cantidad: number
  precio_unitario: number  // 0 cuando precio_origen es 'sin_precio'
  precio_origen: OrigenPrecio
  subtotal: number // columna generada en DB
}

/**
 * Método de pago para una entrega
 */
export type MetodoPago = 'efectivo' | 'transferencia' | 'pendiente'

/**
 * Entrega (registrada por el chofer)
 */
export type Entrega = {
  id: string
  pedido_id: string
  chofer_id: string
  timestamp_entrega: string
  latitud: number | null
  longitud: number | null
  bidones_vacios_recibidos: number
  monto_cobrado: number | null  // puede ser null si el cobro está pendiente de confirmar
  metodo_pago: MetodoPago | null
  foto_url: string | null
  observaciones: string | null
}

/**
 * Inventario de productos
 */
export type Inventario = {
  id: string
  producto_id: string
  stock_bodega: number
  stock_vacios_bodega: number
  stock_en_ruta: number
  stock_minimo_alerta: number
  updated_at: string
}

// ============================================================================
// TIPOS PARA LA LÓGICA DE PRECIOS
// ============================================================================

/**
 * Input para el cálculo de precio
 */
export type InputCalculoPrecio = {
  productoId: string
  cantidad: number
  // Nota: clientes tipo 'nuevo' deben pasarse como 'detalle' aquí
  clienteTipo: 'mayorista' | 'detalle'
  empresaId?: string // solo para tipo mayorista
  sector?: string // solo para tipo detalle
}

/**
 * Resultado del cálculo de precio
 */
export type ResultadoPrecio = {
  precio: number
  origen: OrigenPrecio
  tramo_aplicado?: string // descripción del tramo (ej: "1-5 unidades")
}

// ============================================================================
// TIPOS PARA API RESPONSES
// ============================================================================

/**
 * Respuesta genérica de API (unión discriminada)
 * Previene estados inválidos donde ambos data y error son null
 */
export type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: string }

/**
 * Respuesta de API para listados (unión discriminada)
 * Previene estados inválidos donde ambos data y error son null
 */
export type ApiListResponse<T> =
  | { data: T[]; total: number; error: null }
  | { data: null; total: 0; error: string }

// ============================================================================
// TIPOS PARA FORMULARIOS
// ============================================================================

/**
 * Formulario de pedido público (sitio web)
 */
export type FormularioPedidoPublico = {
  nombre: string
  telefono: string
  email?: string
  direccion: string
  comuna: string
  items: {
    productoId: string
    cantidad: number
  }[]
  notas?: string
}

/**
 * Input para crear un pedido
 */
export type CrearPedidoInput = {
  cliente_id?: string
  empresa_id?: string
  chofer_id?: string
  fecha_entrega_programada?: string
  origen: OrigenPedido
  items: {
    producto_id: string
    cantidad: number
    precio_unitario?: number // si se especifica manualmente
  }[]
  notas?: string
}

// ============================================================================
// TIPOS PARA LA PWA DEL CHOFER
// ============================================================================

/**
 * Entrega pendiente offline (guardada en IndexedDB)
 */
export type EntregaPendienteOffline = {
  pedido_id: string
  timestamp_local: string
  latitud: number | null
  longitud: number | null
  bidones_vacios_recibidos: number
  monto_cobrado: number  // requerido antes de sincronizar, no puede ser null
  metodo_pago: MetodoPago
  observaciones: string
  foto_data_url?: string // base64, solo local
  sincronizado: boolean
}

/**
 * Item de entrega (para el formulario del chofer)
 */
export type ItemEntrega = {
  producto_id: string
  nombre_producto: string
  cantidad_pedida: number
  cantidad_entregada: number
}

// ============================================================================
// TIPOS CON RELACIONES (para queries con JOINs)
// ============================================================================

/**
 * Pedido con datos relacionados
 */
export type PedidoConDetalle = Pedido & {
  cliente?: Cliente | null
  empresa?: Empresa | null
  chofer?: Chofer | null
  items?: (PedidoItem & { producto: Producto })[]
  entrega?: Entrega | null
}

/**
 * Cliente con empresa relacionada
 */
export type ClienteConEmpresa = Cliente & {
  empresa?: Empresa | null
}

// ============================================================================
// TIPOS DE AUTENTICACIÓN Y SESIÓN
// ============================================================================

/**
 * Roles de usuario en el sistema
 */
export type RolUsuario = 'admin' | 'chofer' | 'publico'

/**
 * Usuario en sesión
 */
export type UsuarioSesion = {
  id: string
  email: string
  rol: RolUsuario
  chofer_id?: string // solo para rol chofer
}
