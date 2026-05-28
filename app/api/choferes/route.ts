import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'

/**
 * GET /api/choferes
 * Lista choferes activos. Solo admin.
 */
export async function GET(request: NextRequest) {
  const token = await getToken({ req: request })
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ data: null, error: 'Sin permisos' }, { status: 403 })
  }

  try {
    const choferes = await db.chofer.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
      select: { id: true, nombre: true, vehiculo: true },
    })
    return NextResponse.json({ data: choferes, total: choferes.length, error: null })
  } catch {
    return NextResponse.json({ data: null, error: 'Error al obtener choferes' }, { status: 500 })
  }
}
