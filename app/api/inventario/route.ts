import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'
import type { ApiResponse, ApiListResponse, Inventario } from '@/lib/types'

/**
 * GET /api/inventario
 * Obtener el stock actual de todos los productos.
 * Accesible para admin y chofer.
 */
export async function GET(request: NextRequest) {
  const token = await getToken({ req: request })
  if (!token) {
    return NextResponse.json(
      { data: null, error: 'No autenticado' } as ApiResponse<never>,
      { status: 401 }
    )
  }

  if (token.role !== 'admin' && token.role !== 'chofer') {
    return NextResponse.json(
      { data: null, error: 'Sin permisos' } as ApiResponse<never>,
      { status: 403 }
    )
  }

  try {
    const inventario = await db.inventario.findMany({
      orderBy: { updated_at: 'desc' },
    })

    return NextResponse.json(
      { data: inventario as unknown as Inventario[], total: inventario.length, error: null } as ApiListResponse<Inventario>
    )
  } catch {
    return NextResponse.json(
      { data: null, total: 0, error: 'Error al obtener inventario' } as ApiListResponse<Inventario>,
      { status: 500 }
    )
  }
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
  const token = await getToken({ req: request })
  if (!token) {
    return NextResponse.json(
      { data: null, error: 'No autenticado' } as ApiResponse<never>,
      { status: 401 }
    )
  }

  // Solo admin puede ajustar el stock
  if (token.role !== 'admin') {
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
  const inventarioExistente = await db.inventario.findUnique({
    where: { producto_id: body.producto_id },
    select: { id: true },
  })

  if (!inventarioExistente) {
    return NextResponse.json(
      { data: null, error: 'No se encontró inventario para este producto' } as ApiResponse<Inventario>,
      { status: 404 }
    )
  }

  // Construir objeto de actualización solo con los campos proporcionados
  const actualizacion: { stock_bodega?: number; stock_vacios_bodega?: number } = {}
  if (body.stock_bodega !== undefined) actualizacion.stock_bodega = body.stock_bodega
  if (body.stock_vacios_bodega !== undefined) actualizacion.stock_vacios_bodega = body.stock_vacios_bodega

  try {
    const updated = await db.inventario.update({
      where: { producto_id: body.producto_id },
      data: actualizacion,
    })

    return NextResponse.json(
      { data: updated as unknown as Inventario, error: null } as ApiResponse<Inventario>
    )
  } catch {
    return NextResponse.json(
      { data: null, error: 'Error al actualizar el inventario' } as ApiResponse<Inventario>,
      { status: 500 }
    )
  }
}
