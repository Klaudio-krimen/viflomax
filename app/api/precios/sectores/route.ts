import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse, ApiListResponse, PrecioDetalle } from '@/lib/types'

/**
 * GET /api/precios/sectores?producto_id=uuid
 * Listar precios detalle por sector y producto.
 * Accesible para admin.
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
  if (rol !== 'admin') {
    return NextResponse.json(
      { data: null, error: 'Sin permisos' } as ApiResponse<never>,
      { status: 403 }
    )
  }

  const { searchParams } = new URL(request.url)
  const productoId = searchParams.get('producto_id')

  let query = supabase
    .from('precios_detalle')
    .select('*', { count: 'exact' })
    .order('vigente_desde', { ascending: false })

  if (productoId) {
    query = query.eq('producto_id', productoId)
  }

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json(
      { data: null, total: 0, error: 'Error al obtener precios detalle' } as ApiListResponse<PrecioDetalle>,
      { status: 500 }
    )
  }

  return NextResponse.json(
    { data: data as PrecioDetalle[], total: count ?? 0, error: null } as ApiListResponse<PrecioDetalle>
  )
}

/**
 * POST /api/precios/sectores
 * Crear un tramo de precio detalle (solo admin).
 *
 * Body:
 * {
 *   producto_id: uuid,
 *   sector?: string,
 *   cantidad_minima: number,
 *   cantidad_maxima?: number,
 *   precio: number,
 *   notas?: string,
 *   vigente_desde: string (fecha ISO),
 *   vigente_hasta?: string (fecha ISO)
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
  if (rol !== 'admin') {
    return NextResponse.json(
      { data: null, error: 'Sin permisos' } as ApiResponse<never>,
      { status: 403 }
    )
  }

  let body: {
    producto_id?: string
    sector?: string
    cantidad_minima?: number
    cantidad_maxima?: number
    precio?: number
    notas?: string
    vigente_desde?: string
    vigente_hasta?: string
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
  if (!body.producto_id) {
    return NextResponse.json(
      { data: null, error: 'El producto_id es obligatorio' } as ApiResponse<PrecioDetalle>,
      { status: 400 }
    )
  }

  if (body.cantidad_minima === undefined || body.precio === undefined) {
    return NextResponse.json(
      { data: null, error: 'cantidad_minima y precio son obligatorios' } as ApiResponse<PrecioDetalle>,
      { status: 400 }
    )
  }

  const hoy = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('precios_detalle')
    .insert({
      producto_id: body.producto_id,
      sector: body.sector ?? null,
      cantidad_minima: body.cantidad_minima,
      cantidad_maxima: body.cantidad_maxima ?? null,
      precio: body.precio,
      notas: body.notas ?? null,
      vigente_desde: body.vigente_desde ?? hoy,
      vigente_hasta: body.vigente_hasta ?? null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json(
      { data: null, error: 'Error al crear el precio detalle' } as ApiResponse<PrecioDetalle>,
      { status: 500 }
    )
  }

  return NextResponse.json(
    { data: data as PrecioDetalle, error: null } as ApiResponse<PrecioDetalle>,
    { status: 201 }
  )
}

/**
 * DELETE /api/precios/sectores?id=uuid
 * Eliminar un tramo de precio detalle (solo admin).
 */
export async function DELETE(request: NextRequest) {
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
  if (rol !== 'admin') {
    return NextResponse.json(
      { data: null, error: 'Sin permisos' } as ApiResponse<never>,
      { status: 403 }
    )
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json(
      { data: null, error: 'El id es obligatorio' } as ApiResponse<null>,
      { status: 400 }
    )
  }

  // Verificar que existe
  const { data: existente } = await supabase
    .from('precios_detalle')
    .select('id')
    .eq('id', id)
    .single()

  if (!existente) {
    return NextResponse.json(
      { data: null, error: 'Precio detalle no encontrado' } as ApiResponse<null>,
      { status: 404 }
    )
  }

  const { error } = await supabase
    .from('precios_detalle')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json(
      { data: null, error: 'Error al eliminar el precio detalle' } as ApiResponse<null>,
      { status: 500 }
    )
  }

  return NextResponse.json(
    { data: null, error: null } as ApiResponse<null>
  )
}
