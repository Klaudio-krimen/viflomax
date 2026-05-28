import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'

/**
 * DELETE /api/productos/[id]
 * Elimina un producto y su inventario. Solo admin.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = await getToken({ req: request })
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  try {
    await db.$transaction(async (tx) => {
      // Eliminar inventario primero (FK)
      await tx.inventario.deleteMany({ where: { producto_id: params.id } })
      // Eliminar precios asociados
      await tx.precioMayorista.deleteMany({ where: { producto_id: params.id } })
      await tx.precioDetalle.deleteMany({ where: { producto_id: params.id } })
      // Eliminar producto
      await tx.producto.delete({ where: { id: params.id } })
    })
    return NextResponse.json({ data: null, error: null })
  } catch {
    return NextResponse.json({ error: 'Error al eliminar producto' }, { status: 500 })
  }
}

/**
 * PATCH /api/productos/[id]
 * Actualiza datos de un producto. Solo admin.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = await getToken({ req: request })
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  let body: {
    nombre?: string
    categoria?: string
    descripcion?: string
    precio_base?: number | null
    activo?: boolean
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  try {
    const producto = await db.producto.update({
      where: { id: params.id },
      data: {
        ...(body.nombre !== undefined && { nombre: body.nombre }),
        ...(body.categoria !== undefined && { categoria: body.categoria }),
        ...(body.descripcion !== undefined && { descripcion: body.descripcion || null }),
        ...(body.precio_base !== undefined && { precio_base: body.precio_base }),
        ...(body.activo !== undefined && { activo: body.activo }),
      },
    })
    return NextResponse.json({ data: producto, error: null })
  } catch {
    return NextResponse.json({ error: 'Error al actualizar producto' }, { status: 500 })
  }
}
