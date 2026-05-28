import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'

/**
 * DELETE /api/clientes/[id]
 * Elimina un cliente. Solo admin.
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
    await db.cliente.delete({ where: { id: params.id } })
    return NextResponse.json({ data: null, error: null })
  } catch {
    return NextResponse.json({ error: 'Error al eliminar cliente' }, { status: 500 })
  }
}

/**
 * PATCH /api/clientes/[id]
 * Actualiza datos de un cliente. Solo admin.
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
    telefono?: string
    email?: string
    direccion?: string
    comuna?: string
    sector?: string
    tipo_cliente?: string
    notas?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  try {
    const cliente = await db.cliente.update({
      where: { id: params.id },
      data: {
        ...(body.nombre !== undefined && { nombre: body.nombre }),
        ...(body.telefono !== undefined && { telefono: body.telefono || null }),
        ...(body.email !== undefined && { email: body.email || null }),
        ...(body.direccion !== undefined && { direccion: body.direccion || null }),
        ...(body.comuna !== undefined && { comuna: body.comuna || null }),
        ...(body.sector !== undefined && { sector: body.sector || null }),
        ...(body.tipo_cliente !== undefined && { tipo_cliente: body.tipo_cliente }),
        ...(body.notas !== undefined && { notas: body.notas || null }),
      },
    })
    return NextResponse.json({ data: cliente, error: null })
  } catch {
    return NextResponse.json({ error: 'Error al actualizar cliente' }, { status: 500 })
  }
}
