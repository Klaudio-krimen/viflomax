import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse, ApiListResponse, PrecioMayorista } from '@/lib/types'

/**
 * GET /api/precios/mayoristas?empresa_id=uuid
 * Listar precios mayoristas de una empresa.
 * Accesible para admin (y mayoristas con su propia empresa).
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
  const empresaId = searchParams.get('empresa_id')

  let query = supabase
    .from('precios_mayorista')
    .select('*', { count: 'exact' })
    .order('vigente_desde', { ascending: false })

  if (empresaId) {
    query = query.eq('empresa_id', empresaId)
  }

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json(
      { data: null, total: 0, error: 'Error al obtener precios mayoristas' } as ApiListResponse<PrecioMayorista>,
      { status: 500 }
    )
  }

  return NextResponse.json(
    { data: data as PrecioMayorista[], total: count ?? 0, error: null } as ApiListResponse<PrecioMayorista>
  )
}

/**
 * POST /api/precios/mayoristas
 * Crear o actualizar un tramo de precio mayorista (solo admin).
 *
 * Body:
 * {
 *   empresa_id: uuid,
 *   producto_id: uuid,
 *   volumen_minimo: number,
 *   volumen_maximo?: number,
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
    empresa_id?: string
    producto_id?: string
    volumen_minimo?: number
    volumen_maximo?: number
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
  if (!body.empresa_id || !body.producto_id) {
    return NextResponse.json(
      { data: null, error: 'empresa_id y producto_id son obligatorios' } as ApiResponse<PrecioMayorista>,
      { status: 400 }
    )
  }

  if (body.volumen_minimo === undefined || body.precio === undefined) {
    return NextResponse.json(
      { data: null, error: 'volumen_minimo y precio son obligatorios' } as ApiResponse<PrecioMayorista>,
      { status: 400 }
    )
  }

  const hoy = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('precios_mayorista')
    .insert({
      empresa_id: body.empresa_id,
      producto_id: body.producto_id,
      volumen_minimo: body.volumen_minimo,
      volumen_maximo: body.volumen_maximo ?? null,
      precio: body.precio,
      notas: body.notas ?? null,
      vigente_desde: body.vigente_desde ?? hoy,
      vigente_hasta: body.vigente_hasta ?? null,
      creado_por: user.id,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json(
      { data: null, error: 'Error al crear el precio mayorista' } as ApiResponse<PrecioMayorista>,
      { status: 500 }
    )
  }

  return NextResponse.json(
    { data: data as PrecioMayorista, error: null } as ApiResponse<PrecioMayorista>,
    { status: 201 }
  )
}

/**
 * DELETE /api/precios/mayoristas?id=uuid
 * Eliminar un tramo de precio mayorista (solo admin).
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
    .from('precios_mayorista')
    .select('id')
    .eq('id', id)
    .single()

  if (!existente) {
    return NextResponse.json(
      { data: null, error: 'Precio mayorista no encontrado' } as ApiResponse<null>,
      { status: 404 }
    )
  }

  const { error } = await supabase
    .from('precios_mayorista')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json(
      { data: null, error: 'Error al eliminar el precio mayorista' } as ApiResponse<null>,
      { status: 500 }
    )
  }

  return NextResponse.json(
    { data: null, error: null } as ApiResponse<null>
  )
}
