import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'

/**
 * DELETE /api/precios/mayoristas/[id]
 * Elimina un tramo de precio mayorista. Solo admin.
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
    await db.precioMayorista.delete({ where: { id: params.id } })
    return NextResponse.json({ data: null, error: null })
  } catch {
    return NextResponse.json({ error: 'Error al eliminar tramo' }, { status: 500 })
  }
}
