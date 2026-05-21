import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calcularPrecioItem } from '@/lib/precios/calcular'
import type {
  ApiResponse,
  ApiListResponse,
  Pedido,
  PedidoConDetalle,
  CrearPedidoInput,
  Cliente,
} from '@/lib/types'

/**
 * GET /api/pedidos
 * Lista de pedidos.
 * - Admin: todos los pedidos
 * - Chofer: solo los pedidos asignados a él
 * Filtros opcionales: ?estado=nuevo&fecha=2024-01-01
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()

  // Verificar autenticación
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json(
      { data: null, error: 'No autenticado' } as ApiResponse<never>,
      { status: 401 }
    )
  }

  const rol = user.app_metadata?.role as string | undefined
  if (rol !== 'admin' && rol !== 'chofer') {
    return NextResponse.json(
      { data: null, error: 'Sin permisos' } as ApiResponse<never>,
      { status: 403 }
    )
  }

  const { searchParams } = new URL(request.url)
  const estado = searchParams.get('estado')
  const fecha = searchParams.get('fecha')

  let query = supabase
    .from('pedidos')
    .select('*', { count: 'exact' })
    .order('fecha_pedido', { ascending: false })

  // Chofer solo ve sus propios pedidos
  if (rol === 'chofer') {
    const choferIdMeta = user.app_metadata?.chofer_id as string | undefined
    if (!choferIdMeta) {
      return NextResponse.json(
        { data: null, total: 0, error: 'Chofer no configurado' } as ApiListResponse<Pedido>,
        { status: 403 }
      )
    }
    query = query.eq('chofer_id', choferIdMeta)
  }

  // Filtros opcionales
  if (estado) {
    query = query.eq('estado', estado)
  }
  if (fecha) {
    query = query.gte('fecha_pedido', fecha).lt('fecha_pedido', `${fecha}T23:59:59`)
  }

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json(
      { data: null, total: 0, error: 'Error al obtener pedidos' } as ApiListResponse<Pedido>,
      { status: 500 }
    )
  }

  return NextResponse.json(
    { data: data as Pedido[], total: count ?? 0, error: null } as ApiListResponse<Pedido>
  )
}

/**
 * POST /api/pedidos
 * Crear un nuevo pedido con cálculo automático de precios.
 *
 * Body (CrearPedidoInput):
 * {
 *   cliente_id?: uuid,
 *   empresa_id?: uuid,
 *   origen: 'web' | 'whatsapp' | 'telefono' | 'manual',
 *   items: [{ producto_id: uuid, cantidad: number }],
 *   notas?: string
 * }
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // Verificar autenticación
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json(
      { data: null, error: 'No autenticado' } as ApiResponse<never>,
      { status: 401 }
    )
  }

  const rol = user.app_metadata?.role as string | undefined
  if (rol !== 'admin' && rol !== 'chofer') {
    return NextResponse.json(
      { data: null, error: 'Sin permisos' } as ApiResponse<never>,
      { status: 403 }
    )
  }

  let body: CrearPedidoInput
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { data: null, error: 'Cuerpo de solicitud inválido' } as ApiResponse<never>,
      { status: 400 }
    )
  }

  // Validar que haya al menos un item
  if (!body.items || body.items.length === 0) {
    return NextResponse.json(
      { data: null, error: 'El pedido debe tener al menos un item' } as ApiResponse<never>,
      { status: 400 }
    )
  }

  // Determinar tipo de cliente para el cálculo de precios
  let clienteTipo: 'mayorista' | 'detalle' = 'detalle'
  let sector: string | undefined

  if (body.cliente_id) {
    const { data: cliente } = await supabase
      .from('clientes')
      .select('tipo_cliente, sector, empresa_id')
      .eq('id', body.cliente_id)
      .single<Pick<Cliente, 'tipo_cliente' | 'sector' | 'empresa_id'>>()

    if (cliente) {
      if (cliente.tipo_cliente === 'mayorista') {
        clienteTipo = 'mayorista'
      }
      sector = cliente.sector ?? undefined
    }
  } else if (body.empresa_id) {
    // Pedido directo de empresa mayorista
    clienteTipo = 'mayorista'
  }

  // Calcular precio para cada item
  const itemsConPrecio: Array<{
    producto_id: string
    cantidad: number
    precio_unitario: number
    precio_origen: string
    subtotal: number
  }> = []

  let tieneSinPrecio = false

  for (const item of body.items) {
    // Si se especificó precio manual, usarlo
    if (item.precio_unitario !== undefined) {
      itemsConPrecio.push({
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        precio_origen: 'manual',
        subtotal: item.precio_unitario * item.cantidad,
      })
      continue
    }

    const resultado = await calcularPrecioItem({
      productoId: item.producto_id,
      cantidad: item.cantidad,
      clienteTipo,
      empresaId: body.empresa_id,
      sector,
    })

    if (resultado.origen === 'sin_precio') {
      tieneSinPrecio = true
    }

    itemsConPrecio.push({
      producto_id: item.producto_id,
      cantidad: item.cantidad,
      precio_unitario: resultado.precio,
      precio_origen: resultado.origen,
      subtotal: resultado.precio * item.cantidad,
    })
  }

  // Calcular monto total
  const montoTotal = itemsConPrecio.reduce((sum, item) => sum + item.subtotal, 0)

  // Preparar notas con indicador si hay items sin precio
  let notasFinales = body.notas ?? null
  if (tieneSinPrecio) {
    const notaEspecial = 'ATENCIÓN: Uno o más items no tienen precio asignado.'
    notasFinales = notasFinales ? `${notasFinales}\n${notaEspecial}` : notaEspecial
  }

  // Insertar pedido
  const { data: pedidoCreado, error: pedidoError } = await supabase
    .from('pedidos')
    .insert({
      cliente_id: body.cliente_id ?? null,
      empresa_id: body.empresa_id ?? null,
      chofer_id: body.chofer_id ?? null,
      fecha_entrega_programada: body.fecha_entrega_programada ?? null,
      estado: 'nuevo',
      origen: body.origen,
      monto_total: montoTotal,
      notas: notasFinales,
    })
    .select()
    .single()

  if (pedidoError || !pedidoCreado) {
    return NextResponse.json(
      { data: null, error: 'Error al crear el pedido' } as ApiResponse<PedidoConDetalle>,
      { status: 500 }
    )
  }

  // Insertar items del pedido
  const itemsParaInsertar = itemsConPrecio.map((item) => ({
    pedido_id: pedidoCreado.id,
    producto_id: item.producto_id,
    cantidad: item.cantidad,
    precio_unitario: item.precio_unitario,
    precio_origen: item.precio_origen,
  }))

  const { data: itemsCreados, error: itemsError } = await supabase
    .from('pedido_items')
    .insert(itemsParaInsertar)
    .select()

  if (itemsError) {
    // Limpiar el pedido si falló la inserción de items
    await supabase.from('pedidos').delete().eq('id', pedidoCreado.id)
    return NextResponse.json(
      { data: null, error: 'Error al crear los items del pedido' } as ApiResponse<PedidoConDetalle>,
      { status: 500 }
    )
  }

  const respuesta: PedidoConDetalle = {
    ...(pedidoCreado as Pedido),
    items: itemsCreados as PedidoConDetalle['items'],
  }

  return NextResponse.json(
    { data: respuesta, error: null } as ApiResponse<PedidoConDetalle>,
    { status: 201 }
  )
}
