import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'
import { calcularPrecioItem } from '@/lib/precios/calcular'
import type {
  ApiResponse,
  ApiListResponse,
  Pedido,
  CrearPedidoInput,
} from '@/lib/types'

/**
 * GET /api/pedidos
 * Lista de pedidos.
 * - Admin: todos los pedidos
 * - Chofer: solo los pedidos asignados a él
 * Filtros opcionales: ?estado=nuevo&fecha=2024-01-01
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

  // Chofer solo ve sus propios pedidos
  let choferIdFilter: string | undefined
  if (role === 'chofer') {
    const chofer = await db.chofer.findUnique({
      where: { user_id: token.id as string },
      select: { id: true },
    })
    if (!chofer) {
      return NextResponse.json(
        { data: null, total: 0, error: 'Chofer no configurado' } as ApiListResponse<Pedido>,
        { status: 403 }
      )
    }
    choferIdFilter = chofer.id
  }

  const { searchParams } = new URL(request.url)
  const estado = searchParams.get('estado')
  const fecha = searchParams.get('fecha')

  // Construir filtro dinámicamente
  const where: {
    chofer_id?: string
    estado?: string
    fecha_pedido?: { gte: Date; lte: Date }
  } = {}

  if (choferIdFilter) where.chofer_id = choferIdFilter
  if (estado) where.estado = estado
  if (fecha) {
    where.fecha_pedido = {
      gte: new Date(fecha),
      lte: new Date(`${fecha}T23:59:59`),
    }
  }

  try {
    const [pedidos, total] = await Promise.all([
      db.pedido.findMany({ where, orderBy: { fecha_pedido: 'desc' } }),
      db.pedido.count({ where }),
    ])

    return NextResponse.json(
      { data: pedidos as unknown as Pedido[], total, error: null } as ApiListResponse<Pedido>
    )
  } catch {
    return NextResponse.json(
      { data: null, total: 0, error: 'Error al obtener pedidos' } as ApiListResponse<Pedido>,
      { status: 500 }
    )
  }
}

/**
 * POST /api/pedidos
 * Crear un nuevo pedido con cálculo automático de precios.
 *
 * Body (CrearPedidoInput):
 * {
 *   cliente_id?: uuid,
 *   empresa_id?: uuid,
 *   chofer_id?: uuid,
 *   fecha_entrega_programada?: string (ISO date),
 *   origen: 'web' | 'whatsapp' | 'telefono' | 'manual',
 *   items: [{ producto_id: uuid, cantidad: number, precio_unitario?: number }],
 *   notas?: string
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
  let empresaIdResuelto: string | undefined

  if (body.cliente_id) {
    const cliente = await db.cliente.findUnique({
      where: { id: body.cliente_id },
      select: { tipo_cliente: true, sector: true, empresa_id: true },
    })
    if (cliente) {
      if (cliente.tipo_cliente === 'mayorista') clienteTipo = 'mayorista'
      sector = cliente.sector ?? undefined
      empresaIdResuelto = cliente.empresa_id ?? undefined
    }
  } else if (body.empresa_id) {
    // Pedido directo de empresa mayorista
    clienteTipo = 'mayorista'
    empresaIdResuelto = body.empresa_id
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
      empresaId: body.empresa_id ?? empresaIdResuelto,
      sector,
    })

    if (resultado.origen === 'sin_precio') tieneSinPrecio = true

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

  // Añadir nota si hay items sin precio
  let notasFinales = body.notas ?? null
  if (tieneSinPrecio) {
    const notaEspecial = 'ATENCIÓN: Uno o más items no tienen precio asignado.'
    notasFinales = notasFinales ? `${notasFinales}\n${notaEspecial}` : notaEspecial
  }

  // Crear pedido con items en una transacción atómica
  try {
    const pedido = await db.$transaction(async (tx) => {
      // Generar número de pedido (PED-YYYY-NNNN)
      const año = new Date().getFullYear()
      const count = await tx.pedido.count()
      const numeroPedido = `PED-${año}-${String(count + 1).padStart(4, '0')}`

      return tx.pedido.create({
        data: {
          numero_pedido: numeroPedido,
          cliente_id: body.cliente_id ?? null,
          empresa_id: body.empresa_id ?? null,
          chofer_id: body.chofer_id ?? null,
          fecha_entrega_programada: body.fecha_entrega_programada
            ? new Date(body.fecha_entrega_programada)
            : null,
          estado: 'nuevo',
          origen: body.origen,
          monto_total: montoTotal,
          notas: notasFinales,
          items: {
            create: itemsConPrecio.map((item) => ({
              producto_id: item.producto_id,
              cantidad: item.cantidad,
              precio_unitario: item.precio_unitario,
              precio_origen: item.precio_origen,
              subtotal: item.subtotal,
            })),
          },
        },
        include: { items: true },
      })
    })

    return NextResponse.json(
      { data: pedido as unknown as Pedido, error: null } as ApiResponse<Pedido>,
      { status: 201 }
    )
  } catch {
    return NextResponse.json(
      { data: null, error: 'Error al crear el pedido' } as ApiResponse<never>,
      { status: 500 }
    )
  }
}
