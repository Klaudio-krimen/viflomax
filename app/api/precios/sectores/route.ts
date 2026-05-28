import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'
import type { ApiResponse, ApiListResponse, PrecioDetalle } from '@/lib/types'

/**
 * GET /api/precios/sectores?producto_id=uuid
 * Listar precios detalle por sector y producto.
 * Accesible solo para admin.
 */
export async function GET(request: NextRequest) {
  const token = await getToken({ req: request })
  if (!token) {
    return NextResponse.json(
      { data: null, error: 'No autenticado' } as ApiResponse<never>,
      { status: 401 }
    )
  }

  if (token.role !== 'admin') {
    return NextResponse.json(
      { data: null, error: 'Sin permisos' } as ApiResponse<never>,
      { status: 403 }
    )
  }

  const { searchParams } = new URL(request.url)
  const productoId = searchParams.get('producto_id')

  try {
    const where = productoId ? { producto_id: productoId } : {}

    const [precios, total] = await Promise.all([
      db.precioDetalle.findMany({
        where,
        orderBy: { vigente_desde: 'desc' },
      }),
      db.precioDetalle.count({ where }),
    ])

    return NextResponse.json(
      { data: precios as unknown as PrecioDetalle[], total, error: null } as ApiListResponse<PrecioDetalle>
    )
  } catch {
    return NextResponse.json(
      { data: null, total: 0, error: 'Error al obtener precios detalle' } as ApiListResponse<PrecioDetalle>,
      { status: 500 }
    )
  }
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
  const token = await getToken({ req: request })
  if (!token) {
    return NextResponse.json(
      { data: null, error: 'No autenticado' } as ApiResponse<never>,
      { status: 401 }
    )
  }

  if (token.role !== 'admin') {
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

  try {
    const precio = await db.precioDetalle.create({
      data: {
        producto_id: body.producto_id,
        sector: body.sector ?? null,
        cantidad_minima: body.cantidad_minima,
        cantidad_maxima: body.cantidad_maxima ?? null,
        precio: body.precio,
        notas: body.notas ?? null,
        vigente_desde: body.vigente_desde ? new Date(body.vigente_desde) : new Date(),
        vigente_hasta: body.vigente_hasta ? new Date(body.vigente_hasta) : null,
      },
    })

    return NextResponse.json(
      { data: precio as unknown as PrecioDetalle, error: null } as ApiResponse<PrecioDetalle>,
      { status: 201 }
    )
  } catch {
    return NextResponse.json(
      { data: null, error: 'Error al crear el precio detalle' } as ApiResponse<PrecioDetalle>,
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/precios/sectores?id=uuid
 * Eliminar un tramo de precio detalle (solo admin).
 */
export async function DELETE(request: NextRequest) {
  const token = await getToken({ req: request })
  if (!token) {
    return NextResponse.json(
      { data: null, error: 'No autenticado' } as ApiResponse<never>,
      { status: 401 }
    )
  }

  if (token.role !== 'admin') {
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
  const existente = await db.precioDetalle.findUnique({
    where: { id },
    select: { id: true },
  })

  if (!existente) {
    return NextResponse.json(
      { data: null, error: 'Precio detalle no encontrado' } as ApiResponse<null>,
      { status: 404 }
    )
  }

  try {
    await db.precioDetalle.delete({ where: { id } })

    return NextResponse.json(
      { data: null, error: null } as ApiResponse<null>
    )
  } catch {
    return NextResponse.json(
      { data: null, error: 'Error al eliminar el precio detalle' } as ApiResponse<null>,
      { status: 500 }
    )
  }
}
