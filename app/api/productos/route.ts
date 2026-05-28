import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'
import type { ApiResponse } from '@/lib/types'

/**
 * POST /api/productos
 * Crea un producto nuevo + su registro de inventario en una transacción.
 * Solo admin.
 *
 * Body: {
 *   nombre: string (required)
 *   categoria: 'envase' | 'recarga' | 'dispensador' | 'accesorio' (required)
 *   descripcion?: string
 *   precio_base?: number
 *   stock_bodega?: number        (default 0)
 *   stock_minimo_alerta?: number (default 5)
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
    nombre?: string
    categoria?: string
    descripcion?: string
    precio_base?: number
    stock_bodega?: number
    stock_minimo_alerta?: number
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { data: null, error: 'Cuerpo de solicitud inválido' } as ApiResponse<never>,
      { status: 400 }
    )
  }

  if (!body.nombre?.trim()) {
    return NextResponse.json(
      { data: null, error: 'El nombre del producto es obligatorio' } as ApiResponse<never>,
      { status: 400 }
    )
  }

  const categoriasValidas = ['envase', 'recarga', 'dispensador', 'accesorio']
  if (!body.categoria || !categoriasValidas.includes(body.categoria)) {
    return NextResponse.json(
      { data: null, error: 'Categoría inválida. Debe ser: envase, recarga, dispensador o accesorio' } as ApiResponse<never>,
      { status: 400 }
    )
  }

  try {
    const resultado = await db.$transaction(async (tx) => {
      const producto = await tx.producto.create({
        data: {
          nombre: body.nombre!.trim(),
          categoria: body.categoria!,
          descripcion: body.descripcion?.trim() ?? null,
          precio_base: body.precio_base != null ? body.precio_base : null,
          activo: true,
        },
      })

      const inventario = await tx.inventario.create({
        data: {
          producto_id: producto.id,
          stock_bodega: body.stock_bodega ?? 0,
          stock_vacios_bodega: 0,
          stock_en_ruta: 0,
          stock_minimo_alerta: body.stock_minimo_alerta ?? 5,
        },
      })

      return { producto, inventario }
    })

    return NextResponse.json(
      { data: resultado, error: null } as ApiResponse<typeof resultado>,
      { status: 201 }
    )
  } catch {
    return NextResponse.json(
      { data: null, error: 'Error al crear el producto' } as ApiResponse<never>,
      { status: 500 }
    )
  }
}
