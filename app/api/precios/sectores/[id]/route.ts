import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'

/**
 * DELETE /api/precios/sectores/[id]
 * Elimina un precio de sector. Solo admin.
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
    await db.precioDetalle.delete({ where: { id: params.id } })
    return NextResponse.json({ data: null, error: null })
  } catch {
    return NextResponse.json({ error: 'Error al eliminar precio' }, { status: 500 })
  }
}
