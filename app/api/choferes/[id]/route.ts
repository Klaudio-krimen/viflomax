import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'

/**
 * DELETE /api/choferes/[id]
 * Elimina un chofer y su cuenta de usuario. Solo admin.
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
    // Buscar el chofer para obtener user_id
    const chofer = await db.chofer.findUnique({
      where: { id: params.id },
      select: { user_id: true },
    })
    if (!chofer) {
      return NextResponse.json({ error: 'Chofer no encontrado' }, { status: 404 })
    }

    // Eliminar chofer + usuario en transacción
    await db.$transaction(async (tx) => {
      await tx.chofer.delete({ where: { id: params.id } })
      if (chofer.user_id) {
        await tx.user.delete({ where: { id: chofer.user_id } })
      }
    })

    return NextResponse.json({ data: null, error: null })
  } catch {
    return NextResponse.json({ error: 'Error al eliminar chofer' }, { status: 500 })
  }
}

/**
 * PATCH /api/choferes/[id]
 * Actualiza datos del chofer. Solo admin.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = await getToken({ req: request })
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  let body: { nombre?: string; telefono?: string; vehiculo?: string; activo?: boolean }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  try {
    const chofer = await db.chofer.update({
      where: { id: params.id },
      data: {
        ...(body.nombre !== undefined && { nombre: body.nombre }),
        ...(body.telefono !== undefined && { telefono: body.telefono || null }),
        ...(body.vehiculo !== undefined && { vehiculo: body.vehiculo || null }),
        ...(body.activo !== undefined && { activo: body.activo }),
      },
    })
    return NextResponse.json({ data: chofer, error: null })
  } catch {
    return NextResponse.json({ error: 'Error al actualizar chofer' }, { status: 500 })
  }
}
