import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse, ApiListResponse, Inventario } from '@/lib/types'

/**
 * GET /api/inventario
 * Obtener el stock actual de todos los productos.
 * Accesible para admin y chofer.
 */
export async function GET(_request: NextRequest) {
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

  const { data, error, count } = await supabase
    .from('inventario')
    .select('*', { count: 'exact' })
    .order('updated_at', { ascending: false })

  if (error) {
    return NextResponse.json(
      { data: null, total: 0, error: 'Error al obtener inventario' } as ApiListResponse<Inventario>,
      { status: 500 }
    )
  }

  return NextResponse.json(
    { data: data as Inventario[], total: count ?? 0, error: null } as ApiListResponse<Inventario>
  )
}

/**
 * PATCH /api/inventario
 * Ajustar el stock de un producto (solo admin).
 *
 * Body:
 * {
 *   producto_id: uuid,
 *   stock_bodega?: number,
 *   stock_vacios_bodega?: number
 * }
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()

  // Verificar autenticación
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json(
      { data: null, error: 'No autenticado' } as ApiResponse<never>,
      { status: 401 }
    )
  }

  // Solo admin puede ajustar el stock
  const rol = user.app_metadata?.role as string | undefined
  if (rol !== 'admin') {
    return NextResponse.json(
      { data: null, error: 'Sin permisos' } as ApiResponse<never>,
      { status: 403 }
    )
  }

  let body: {
    producto_id?: string
    stock_bodega?: number
    stock_vacios_bodega?: number
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { data: null, error: 'Cuerpo de solicitud inválido' } as ApiResponse<never>,
      { status: 400 }
    )
  }

  if (!body.producto_id) {
    return NextResponse.json(
      { data: null, error: 'El producto_id es obligatorio' } as ApiResponse<Inventario>,
      { status: 400 }
    )
  }

  if (body.stock_bodega === undefined && body.stock_vacios_bodega === undefined) {
    return NextResponse.json(
      { data: null, error: 'Debe especificar al menos stock_bodega o stock_vacios_bodega' } as ApiResponse<Inventario>,
      { status: 400 }
    )
  }

  // Verificar que el producto tiene registro de inventario
  const { data: inventarioExistente, error: buscarError } = await supabase
    .from('inventario')
    .select('id')
    .eq('producto_id', body.producto_id)
    .single()

  if (buscarError || !inventarioExistente) {
    return NextResponse.json(
      { data: null, error: 'No se encontró inventario para este producto' } as ApiResponse<Inventario>,
      { status: 404 }
    )
  }

  // Construir objeto de actualización solo con los campos proporcionados
  const actualizacion: Partial<{ stock_bodega: number; stock_vacios_bodega: number }> = {}
  if (body.stock_bodega !== undefined) {
    actualizacion.stock_bodega = body.stock_bodega
  }
  if (body.stock_vacios_bodega !== undefined) {
    actualizacion.stock_vacios_bodega = body.stock_vacios_bodega
  }

  const { data, error } = await supabase
    .from('inventario')
    .update(actualizacion)
    .eq('producto_id', body.producto_id)
    .select()
    .single()

  if (error) {
    return NextResponse.json(
      { data: null, error: 'Error al actualizar el inventario' } as ApiResponse<Inventario>,
      { status: 500 }
    )
  }

  return NextResponse.json(
    { data: data as Inventario, error: null } as ApiResponse<Inventario>
  )
}
