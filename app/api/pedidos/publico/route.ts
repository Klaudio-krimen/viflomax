import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { calcularPrecioItem } from '@/lib/precios/calcular'
import type { ApiResponse } from '@/lib/types'

type ItemPublico = {
  productoId: string // nombre del producto (se resuelve a UUID en el servidor)
  cantidad: number
}

type BodyPedidoPublico = {
  nombre: string
  telefono: string
  email?: string
  direccion: string
  comuna: string
  items: ItemPublico[]
  notas?: string
}

/**
 * POST /api/pedidos/publico
 * Endpoint público para crear pedidos desde el formulario web.
 * No requiere autenticación.
 */
export async function POST(request: NextRequest) {
  let body: BodyPedidoPublico
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { data: null, error: 'Cuerpo de solicitud inválido' } as ApiResponse<never>,
      { status: 400 }
    )
  }

  // Validar campos obligatorios
  if (
    !body.nombre?.trim() ||
    !body.telefono?.trim() ||
    !body.direccion?.trim() ||
    !body.comuna?.trim()
  ) {
    return NextResponse.json(
      { data: null, error: 'Los campos nombre, teléfono, dirección y comuna son obligatorios' } as ApiResponse<never>,
      { status: 400 }
    )
  }

  if (!body.items || !Array.isArray(body.items)) {
    return NextResponse.json(
      { data: null, error: 'Se requiere al menos un producto' } as ApiResponse<never>,
      { status: 400 }
    )
  }

  const itemsValidos = body.items.filter(
    (item) => item.productoId && typeof item.cantidad === 'number' && item.cantidad > 0
  )

  if (itemsValidos.length === 0) {
    return NextResponse.json(
      { data: null, error: 'Debes seleccionar al menos un producto con cantidad mayor a 0' } as ApiResponse<never>,
      { status: 400 }
    )
  }

  // Resolver nombres de productos a registros completos
  const nombresProductos = itemsValidos.map((i) => i.productoId)
  const productos = await db.producto.findMany({
    where: { nombre: { in: nombresProductos }, activo: true },
    select: { id: true, nombre: true, precio_base: true },
  })

  if (productos.length === 0) {
    return NextResponse.json(
      { data: null, error: 'No se encontraron los productos seleccionados' } as ApiResponse<never>,
      { status: 400 }
    )
  }

  const productoMap = new Map(productos.map((p) => [p.nombre, p]))

  const itemsResueltos: Array<{ productoId: string; cantidad: number }> = []
  for (const item of itemsValidos) {
    const producto = productoMap.get(item.productoId)
    if (!producto) continue
    itemsResueltos.push({ productoId: producto.id, cantidad: item.cantidad })
  }

  if (itemsResueltos.length === 0) {
    return NextResponse.json(
      { data: null, error: 'No se pudieron resolver los productos seleccionados' } as ApiResponse<never>,
      { status: 400 }
    )
  }

  // Calcular precios
  const itemsConPrecio: Array<{
    producto_id: string
    cantidad: number
    precio_unitario: number
    precio_origen: string
    subtotal: number
  }> = []

  for (const item of itemsResueltos) {
    const resultado = await calcularPrecioItem({
      productoId: item.productoId,
      cantidad: item.cantidad,
      clienteTipo: 'detalle',
    })
    itemsConPrecio.push({
      producto_id: item.productoId,
      cantidad: item.cantidad,
      precio_unitario: resultado.precio,
      precio_origen: resultado.origen,
      subtotal: resultado.precio * item.cantidad,
    })
  }

  const montoTotal = itemsConPrecio.reduce((sum, item) => sum + item.subtotal, 0)

  // Crear cliente + pedido + items en una transacción
  try {
    const result = await db.$transaction(async (tx) => {
      // Crear cliente nuevo
      const cliente = await tx.cliente.create({
        data: {
          nombre: body.nombre.trim(),
          telefono: body.telefono.trim(),
          email: body.email?.trim() || null,
          direccion: body.direccion.trim(),
          comuna: body.comuna.trim(),
          tipo_cliente: 'nuevo',
          activo: true,
        },
      })

      // Generar número de pedido (PED-YYYY-NNNN)
      const año = new Date().getFullYear()
      const count = await tx.pedido.count()
      const numeroPedido = `PED-${año}-${String(count + 1).padStart(4, '0')}`

      // Crear pedido con items
      const pedido = await tx.pedido.create({
        data: {
          numero_pedido: numeroPedido,
          cliente_id: cliente.id,
          estado: 'nuevo',
          origen: 'web',
          monto_total: montoTotal,
          notas: body.notas?.trim() || null,
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
        select: { id: true, numero_pedido: true },
      })

      return pedido
    })

    return NextResponse.json(
      {
        data: { pedido_id: result.id, numero_pedido: result.numero_pedido },
        error: null,
      } as ApiResponse<{ pedido_id: string; numero_pedido: string | null }>,
      { status: 201 }
    )
  } catch {
    return NextResponse.json(
      { data: null, error: 'Error al crear el pedido' } as ApiResponse<never>,
      { status: 500 }
    )
  }
}
