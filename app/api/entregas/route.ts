import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'
import type { ApiResponse, ApiListResponse, Entrega } from '@/lib/types'

/**
 * GET /api/entregas
 * Lista de entregas.
 * - Admin: todas las entregas
 * - Chofer: solo las entregas registradas por él
 */
export async function GET(request: NextRequest) {
  const token = await getToken({ req: request })
  if (!token) {
    return NextResponse.json(
      { data: null, error: 'No autenticado' } as ApiResponse<never>,
      { status: 401 }
    )
  }

  const role = token.role as string
  if (role !== 'admin' && role !== 'chofer') {
    return NextResponse.json(
      { data: null, error: 'Sin permisos' } as ApiResponse<never>,
      { status: 403 }
    )
  }

  // Chofer solo ve sus propias entregas
  let choferIdFilter: string | undefined
  if (role === 'chofer') {
    const chofer = await db.chofer.findUnique({
      where: { user_id: token.id as string },
      select: { id: true },
    })
    if (!chofer) {
      return NextResponse.json(
        { data: null, total: 0, error: 'Chofer no configurado' } as ApiListResponse<Entrega>,
        { status: 403 }
      )
    }
    choferIdFilter = chofer.id
  }

  try {
    const where = choferIdFilter ? { chofer_id: choferIdFilter } : {}

    const [entregas, total] = await Promise.all([
      db.entrega.findMany({ where, orderBy: { timestamp_entrega: 'desc' } }),
      db.entrega.count({ where }),
    ])

    return NextResponse.json(
      { data: entregas as unknown as Entrega[], total, error: null } as ApiListResponse<Entrega>
    )
  } catch {
    return NextResponse.json(
      { data: null, total: 0, error: 'Error al obtener entregas' } as ApiListResponse<Entrega>,
      { status: 500 }
    )
  }
}

/**
 * POST /api/entregas
 * Registrar una entrega (solo chofer o admin).
 * Actualiza el estado del pedido a 'entregado' y decrementa el stock.
 *
 * Body:
 * {
 *   pedido_id: uuid,
 *   chofer_id?: uuid (requerido si rol es admin),
 *   latitud?: number,
 *   longitud?: number,
 *   bidones_vacios_recibidos: number,
 *   monto_cobrado?: number,
 *   metodo_pago?: 'efectivo' | 'transferencia' | 'pendiente',
 *   observaciones?: string
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

  const role = token.role as string
  if (role !== 'admin' && role !== 'chofer') {
    return NextResponse.json(
      { data: null, error: 'Sin permisos' } as ApiResponse<never>,
      { status: 403 }
    )
  }

  let body: {
    pedido_id?: string
    chofer_id?: string
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

  // Verificar que el pedido existe y no está ya entregado o cancelado
  const pedido = await db.pedido.findUnique({
    where: { id: body.pedido_id },
    select: { id: true, estado: true },
  })

  if (!pedido) {
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

  // Obtener el chofer_id según el rol
  let choferIdFinal: string

  if (role === 'admin') {
    if (!body.chofer_id) {
      return NextResponse.json(
        { data: null, error: 'Se requiere chofer_id para registrar la entrega' } as ApiResponse<never>,
        { status: 400 }
      )
    }
    choferIdFinal = body.chofer_id
  } else {
    // Chofer usa su propio registro en la tabla chofer
    const chofer = await db.chofer.findUnique({
      where: { user_id: token.id as string },
      select: { id: true },
    })
    if (!chofer) {
      return NextResponse.json(
        { data: null, error: 'Chofer no configurado en el sistema' } as ApiResponse<Entrega>,
        { status: 403 }
      )
    }
    choferIdFinal = chofer.id
  }

  // Crear entrega, actualizar pedido y decrementar stock en una transacción
  try {
    const entregaCreada = await db.$transaction(async (tx) => {
      // Crear la entrega
      const entrega = await tx.entrega.create({
        data: {
          pedido_id: body.pedido_id!,
          chofer_id: choferIdFinal,
          latitud: body.latitud ?? null,
          longitud: body.longitud ?? null,
          bidones_vacios_recibidos: body.bidones_vacios_recibidos ?? 0,
          monto_cobrado: body.monto_cobrado ?? null,
          metodo_pago: body.metodo_pago ?? null,
          observaciones: body.observaciones ?? null,
        },
      })

      // Actualizar el estado del pedido a 'entregado'
      await tx.pedido.update({
        where: { id: body.pedido_id! },
        data: { estado: 'entregado' },
      })

      // Obtener los items del pedido para actualizar el stock
      const pedidoItems = await tx.pedidoItem.findMany({
        where: { pedido_id: body.pedido_id! },
        select: { producto_id: true, cantidad: true },
      })

      // Decrementar el stock de bodega para cada producto (sin llegar a negativo)
      for (const item of pedidoItems) {
        const inv = await tx.inventario.findUnique({
          where: { producto_id: item.producto_id },
          select: { id: true, stock_bodega: true },
        })
        if (inv) {
          await tx.inventario.update({
            where: { id: inv.id },
            data: { stock_bodega: Math.max(0, inv.stock_bodega - item.cantidad) },
          })
        }
      }

      return entrega
    })

    return NextResponse.json(
      { data: entregaCreada as unknown as Entrega, error: null } as ApiResponse<Entrega>,
      { status: 201 }
    )
  } catch {
    return NextResponse.json(
      { data: null, error: 'Error al registrar la entrega' } as ApiResponse<Entrega>,
      { status: 500 }
    )
  }
}
