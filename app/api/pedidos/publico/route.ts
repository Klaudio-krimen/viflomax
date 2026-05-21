import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@supabase/supabase-js'
import { calcularPrecioItem } from '@/lib/precios/calcular'
import type { ApiResponse } from '@/lib/types'

/**
 * Crea un cliente Supabase con la service role key para operaciones de escritura
 * que requieren omitir RLS en requests no autenticados.
 */
function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

type ItemPublico = {
  productoId: string // nombre del producto (se resuelve a UUID en el servidor)
  cantidad: number
}

type BodyPedidoPublico = {
  nombre: string
  telefono: string
  email?: string
  direccion: string
  comuna: string
  items: ItemPublico[]
  notas?: string
}

/**
 * POST /api/pedidos/publico
 * Endpoint público para crear pedidos desde el formulario web.
 * No requiere autenticación. Usa service role key para omitir RLS.
 */
export async function POST(request: NextRequest) {
  let body: BodyPedidoPublico
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { data: null, error: 'Cuerpo de solicitud inválido' } as ApiResponse<never>,
      { status: 400 }
    )
  }

  // Validar campos obligatorios
  if (
    !body.nombre?.trim() ||
    !body.telefono?.trim() ||
    !body.direccion?.trim() ||
    !body.comuna?.trim()
  ) {
    return NextResponse.json(
      { data: null, error: 'Los campos nombre, teléfono, dirección y comuna son obligatorios' } as ApiResponse<never>,
      { status: 400 }
    )
  }

  // Validar que haya al menos un item con cantidad > 0
  if (!body.items || !Array.isArray(body.items)) {
    return NextResponse.json(
      { data: null, error: 'Se requiere al menos un producto' } as ApiResponse<never>,
      { status: 400 }
    )
  }

  const itemsValidos = body.items.filter(
    (item) => item.productoId && typeof item.cantidad === 'number' && item.cantidad > 0
  )

  if (itemsValidos.length === 0) {
    return NextResponse.json(
      { data: null, error: 'Debes seleccionar al menos un producto con cantidad mayor a 0' } as ApiResponse<never>,
      { status: 400 }
    )
  }

  const supabase = createServiceClient()

  // Resolver nombres de productos a UUIDs
  const nombresProductos = itemsValidos.map((i) => i.productoId)
  const { data: productos, error: productosError } = await supabase
    .from('productos')
    .select('id, nombre, precio_base')
    .in('nombre', nombresProductos)
    .eq('activo', true)

  if (productosError || !productos || productos.length === 0) {
    return NextResponse.json(
      { data: null, error: 'No se encontraron los productos seleccionados' } as ApiResponse<never>,
      { status: 400 }
    )
  }

  // Mapear nombre → producto
  const productoMap = new Map(productos.map((p) => [p.nombre, p]))

  // Resolver items con UUID real
  const itemsResueltos: Array<{ productoId: string; cantidad: number; nombreProducto: string }> = []
  for (const item of itemsValidos) {
    const producto = productoMap.get(item.productoId)
    if (!producto) continue
    itemsResueltos.push({
      productoId: producto.id,
      cantidad: item.cantidad,
      nombreProducto: item.productoId,
    })
  }

  if (itemsResueltos.length === 0) {
    return NextResponse.json(
      { data: null, error: 'No se pudieron resolver los productos seleccionados' } as ApiResponse<never>,
      { status: 400 }
    )
  }

  // Crear el cliente en la base de datos (siempre nuevo, tipo 'nuevo')
  const { data: clienteCreado, error: clienteError } = await supabase
    .from('clientes')
    .insert({
      nombre: body.nombre.trim(),
      telefono: body.telefono.trim(),
      email: body.email?.trim() || null,
      direccion: body.direccion.trim(),
      comuna: body.comuna.trim(),
      tipo_cliente: 'nuevo',
      activo: true,
    })
    .select('id')
    .single()

  if (clienteError || !clienteCreado) {
    return NextResponse.json(
      { data: null, error: 'Error al registrar los datos del cliente' } as ApiResponse<never>,
      { status: 500 }
    )
  }

  const clienteId = clienteCreado.id

  // Calcular precios para cada item usando clienteTipo 'detalle' (clientes nuevos)
  const itemsConPrecio: Array<{
    producto_id: string
    cantidad: number
    precio_unitario: number
    precio_origen: string
  }> = []

  for (const item of itemsResueltos) {
    const resultado = await calcularPrecioItem({
      productoId: item.productoId,
      cantidad: item.cantidad,
      clienteTipo: 'detalle',
    })

    itemsConPrecio.push({
      producto_id: item.productoId,
      cantidad: item.cantidad,
      precio_unitario: resultado.precio,
      precio_origen: resultado.origen,
    })
  }

  // Calcular monto total
  const montoTotal = itemsConPrecio.reduce(
    (sum, item) => sum + item.precio_unitario * item.cantidad,
    0
  )

  // Crear el pedido con origen 'web' y estado 'nuevo'
  const pedidoData = {
    cliente_id: clienteId,
    empresa_id: null,
    chofer_id: null,
    fecha_entrega_programada: null,
    estado: 'nuevo',
    origen: 'web',
    monto_total: montoTotal,
    notas: body.notas?.trim() || null,
  }

  const { data: rpcResult, error: rpcError } = await supabase.rpc('crear_pedido_con_items', {
    p_pedido: pedidoData,
    p_items: itemsConPrecio,
  })

  if (rpcError || !rpcResult) {
    return NextResponse.json(
      { data: null, error: 'Error al crear el pedido' } as ApiResponse<never>,
      { status: 500 }
    )
  }

  const pedidoId = (rpcResult as { id: string }).id

  // Obtener número de pedido generado
  const { data: pedido } = await supabase
    .from('pedidos')
    .select('id, numero_pedido')
    .eq('id', pedidoId)
    .single()

  return NextResponse.json(
    {
      data: {
        pedido_id: pedidoId,
        numero_pedido: pedido?.numero_pedido ?? null,
      },
      error: null,
    } as ApiResponse<{ pedido_id: string; numero_pedido: string | null }>,
    { status: 201 }
  )
}
