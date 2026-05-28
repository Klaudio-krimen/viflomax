import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'
import type { ApiResponse, ApiListResponse, PrecioMayorista } from '@/lib/types'

/**
 * GET /api/precios/mayoristas?empresa_id=uuid
 * Listar precios mayoristas de una empresa.
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
  const empresaId = searchParams.get('empresa_id')

  try {
    const where = empresaId ? { empresa_id: empresaId } : {}

    const [precios, total] = await Promise.all([
      db.precioMayorista.findMany({
        where,
        orderBy: { vigente_desde: 'desc' },
      }),
      db.precioMayorista.count({ where }),
    ])

    return NextResponse.json(
      { data: precios as unknown as PrecioMayorista[], total, error: null } as ApiListResponse<PrecioMayorista>
    )
  } catch {
    return NextResponse.json(
      { data: null, total: 0, error: 'Error al obtener precios mayoristas' } as ApiListResponse<PrecioMayorista>,
      { status: 500 }
    )
  }
}

/**
 * POST /api/precios/mayoristas
 * Crear un tramo de precio mayorista (solo admin).
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

  try {
    const precio = await db.precioMayorista.create({
      data: {
        empresa_id: body.empresa_id,
        producto_id: body.producto_id,
        volumen_minimo: body.volumen_minimo,
        volumen_maximo: body.volumen_maximo ?? null,
        precio: body.precio,
        notas: body.notas ?? null,
        vigente_desde: body.vigente_desde ? new Date(body.vigente_desde) : new Date(),
        vigente_hasta: body.vigente_hasta ? new Date(body.vigente_hasta) : null,
        creado_por: token.id as string,
      },
    })

    return NextResponse.json(
      { data: precio as unknown as PrecioMayorista, error: null } as ApiResponse<PrecioMayorista>,
      { status: 201 }
    )
  } catch {
    return NextResponse.json(
      { data: null, error: 'Error al crear el precio mayorista' } as ApiResponse<PrecioMayorista>,
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/precios/mayoristas?id=uuid
 * Eliminar un tramo de precio mayorista (solo admin).
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
  const existente = await db.precioMayorista.findUnique({
    where: { id },
    select: { id: true },
  })

  if (!existente) {
    return NextResponse.json(
      { data: null, error: 'Precio mayorista no encontrado' } as ApiResponse<null>,
      { status: 404 }
    )
  }

  try {
    await db.precioMayorista.delete({ where: { id } })

    return NextResponse.json(
      { data: null, error: null } as ApiResponse<null>
    )
  } catch {
    return NextResponse.json(
      { data: null, error: 'Error al eliminar el precio mayorista' } as ApiResponse<null>,
      { status: 500 }
    )
  }
}
