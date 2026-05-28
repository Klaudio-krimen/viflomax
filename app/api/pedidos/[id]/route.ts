import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'

/**
 * DELETE /api/pedidos/[id]
 * Elimina un pedido y sus items. Solo admin.
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
      // Eliminar items primero (FK)
      await tx.pedidoItem.deleteMany({ where: { pedido_id: params.id } })
      // Eliminar entregas si existen
      await tx.entrega.deleteMany({ where: { pedido_id: params.id } })
      // Eliminar pedido
      await tx.pedido.delete({ where: { id: params.id } })
    })
    return NextResponse.json({ data: null, error: null })
  } catch {
    return NextResponse.json({ error: 'Error al eliminar pedido' }, { status: 500 })
  }
}

/**
 * PATCH /api/pedidos/[id]
 * Actualiza estado de un pedido. Solo admin.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = await getToken({ req: request })
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  let body: { estado?: string; chofer_id?: string | null; notas?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  try {
    const pedido = await db.pedido.update({
      where: { id: params.id },
      data: {
        ...(body.estado !== undefined && { estado: body.estado }),
        ...(body.chofer_id !== undefined && { chofer_id: body.chofer_id }),
        ...(body.notas !== undefined && { notas: body.notas || null }),
      },
    })
    return NextResponse.json({ data: pedido, error: null })
  } catch {
    return NextResponse.json({ error: 'Error al actualizar pedido' }, { status: 500 })
  }
}
