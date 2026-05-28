import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'

/**
 * DELETE /api/empresas/[id]
 * Elimina una empresa y sus precios mayoristas. Solo admin.
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
      // Eliminar tramos de precio asociados
      await tx.precioMayorista.deleteMany({ where: { empresa_id: params.id } })
      // Desvincular clientes (no eliminarlos, solo quitar la relación)
      await tx.cliente.updateMany({
        where: { empresa_id: params.id },
        data: { empresa_id: null },
      })
      // Eliminar empresa
      await tx.empresa.delete({ where: { id: params.id } })
    })
    return NextResponse.json({ data: null, error: null })
  } catch {
    return NextResponse.json({ error: 'Error al eliminar empresa' }, { status: 500 })
  }
}

/**
 * PATCH /api/empresas/[id]
 * Actualiza datos de una empresa. Solo admin.
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
    razon_social?: string
    rut?: string
    contacto?: string
    telefono?: string
    email?: string
    activo?: boolean
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  try {
    const empresa = await db.empresa.update({
      where: { id: params.id },
      data: {
        ...(body.razon_social !== undefined && { razon_social: body.razon_social }),
        ...(body.rut !== undefined && { rut: body.rut || null }),
        ...(body.contacto !== undefined && { contacto: body.contacto || null }),
        ...(body.telefono !== undefined && { telefono: body.telefono || null }),
        ...(body.email !== undefined && { email: body.email || null }),
        ...(body.activo !== undefined && { activo: body.activo }),
      },
    })
    return NextResponse.json({ data: empresa, error: null })
  } catch {
    return NextResponse.json({ error: 'Error al actualizar empresa' }, { status: 500 })
  }
}
