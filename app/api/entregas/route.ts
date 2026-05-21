import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse, ApiListResponse, Entrega } from '@/lib/types'

/**
 * GET /api/entregas
 * Lista de entregas.
 * - Admin: todas las entregas
 * - Chofer: solo las entregas registradas por él
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

  let query = supabase
    .from('entregas')
    .select('*', { count: 'exact' })
    .order('timestamp_entrega', { ascending: false })

  // Chofer solo ve sus propias entregas
  if (rol === 'chofer') {
    const choferIdMeta = user.app_metadata?.chofer_id as string | undefined
    if (!choferIdMeta) {
      return NextResponse.json(
        { data: null, total: 0, error: 'Chofer no configurado' } as ApiListResponse<Entrega>,
        { status: 403 }
      )
    }
    query = query.eq('chofer_id', choferIdMeta)
  }

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json(
      { data: null, total: 0, error: 'Error al obtener entregas' } as ApiListResponse<Entrega>,
      { status: 500 }
    )
  }

  return NextResponse.json(
    { data: data as Entrega[], total: count ?? 0, error: null } as ApiListResponse<Entrega>
  )
}

/**
 * POST /api/entregas
 * Registrar una entrega (solo chofer o admin).
 *
 * Body:
 * {
 *   pedido_id: uuid,
 *   latitud?: number,
 *   longitud?: number,
 *   bidones_vacios_recibidos: number,
 *   monto_cobrado?: number,
 *   metodo_pago?: 'efectivo' | 'transferencia' | 'pendiente',
 *   observaciones?: string
 * }
 *
 * Nota: el trigger SQL en la base de datos actualiza el estado del pedido a 'entregado'.
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

  let body: {
    pedido_id?: string
    latitud?: number
    longitud?: number
    bidones_vacios_recibidos?: number
    monto_cobrado?: number
    metodo_pago?: 'efectivo' | 'transferencia' | 'pendiente'
    observaciones?: string
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { data: null, error: 'Cuerpo de solicitud inválido' } as ApiResponse<never>,
      { status: 400 }
    )
  }

  // Validar campos obligatorios
  if (!body.pedido_id) {
    return NextResponse.json(
      { data: null, error: 'El pedido_id es obligatorio' } as ApiResponse<Entrega>,
      { status: 400 }
    )
  }

  // Verificar que el pedido existe y no está ya entregado
  const { data: pedido, error: pedidoError } = await supabase
    .from('pedidos')
    .select('id, estado')
    .eq('id', body.pedido_id)
    .single()

  if (pedidoError || !pedido) {
    return NextResponse.json(
      { data: null, error: 'Pedido no encontrado' } as ApiResponse<Entrega>,
      { status: 404 }
    )
  }

  if (pedido.estado === 'entregado') {
    return NextResponse.json(
      { data: null, error: 'El pedido ya ha sido entregado' } as ApiResponse<Entrega>,
      { status: 400 }
    )
  }

  if (pedido.estado === 'cancelado') {
    return NextResponse.json(
      { data: null, error: 'No se puede entregar un pedido cancelado' } as ApiResponse<Entrega>,
      { status: 400 }
    )
  }

  // Obtener el chofer_id del usuario autenticado
  const choferIdMeta = user.app_metadata?.chofer_id as string | undefined
  if (!choferIdMeta) {
    return NextResponse.json(
      { data: null, error: 'Chofer no configurado en el sistema' } as ApiResponse<Entrega>,
      { status: 403 }
    )
  }

  // Registrar la entrega (el trigger SQL actualiza el pedido a 'entregado')
  const { data: entregaCreada, error: entregaError } = await supabase
    .from('entregas')
    .insert({
      pedido_id: body.pedido_id,
      chofer_id: choferIdMeta,
      latitud: body.latitud ?? null,
      longitud: body.longitud ?? null,
      bidones_vacios_recibidos: body.bidones_vacios_recibidos ?? 0,
      monto_cobrado: body.monto_cobrado ?? null,
      metodo_pago: body.metodo_pago ?? null,
      observaciones: body.observaciones ?? null,
    })
    .select()
    .single()

  if (entregaError || !entregaCreada) {
    return NextResponse.json(
      { data: null, error: 'Error al registrar la entrega' } as ApiResponse<Entrega>,
      { status: 500 }
    )
  }

  // Obtener los items del pedido para actualizar inventario
  const { data: pedidoItems, error: itemsError } = await supabase
    .from('pedido_items')
    .select('producto_id, cantidad')
    .eq('pedido_id', body.pedido_id)

  if (!itemsError && pedidoItems && pedidoItems.length > 0) {
    // Decrementar stock_bodega por cada item del pedido
    for (const item of pedidoItems) {
      // Obtener stock actual
      const { data: inventario } = await supabase
        .from('inventario')
        .select('id, stock_bodega')
        .eq('producto_id', item.producto_id)
        .single()

      if (inventario) {
        const nuevoStock = Math.max(0, inventario.stock_bodega - item.cantidad)
        await supabase
          .from('inventario')
          .update({ stock_bodega: nuevoStock })
          .eq('id', inventario.id)
      }
    }
  }

  return NextResponse.json(
    { data: entregaCreada as Entrega, error: null } as ApiResponse<Entrega>,
    { status: 201 }
  )
}
