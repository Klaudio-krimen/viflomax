import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'

/**
 * GET /api/empresas
 * Lista empresas activas. Solo admin.
 */
export async function GET(request: NextRequest) {
  const token = await getToken({ req: request })
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ data: null, error: 'Sin permisos' }, { status: 403 })
  }

  try {
    const empresas = await db.empresa.findMany({
      where: { activo: true },
      orderBy: { razon_social: 'asc' },
      select: { id: true, razon_social: true, rut: true },
    })
    return NextResponse.json({ data: empresas, total: empresas.length, error: null })
  } catch {
    return NextResponse.json({ data: null, error: 'Error al obtener empresas' }, { status: 500 })
  }
}

/**
 * POST /api/empresas
 * Crea una empresa mayorista. Solo admin.
 */
export async function POST(request: NextRequest) {
  const token = await getToken({ req: request })
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ data: null, error: 'Sin permisos' }, { status: 403 })
  }

  let body: {
    razon_social?: string
    rut?: string
    contacto?: string
    telefono?: string
    email?: string
    direccion?: string
    notas_comerciales?: string
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ data: null, error: 'Cuerpo inválido' }, { status: 400 })
  }

  if (!body.razon_social?.trim()) {
    return NextResponse.json({ data: null, error: 'La razón social es obligatoria' }, { status: 400 })
  }

  try {
    const empresa = await db.empresa.create({
      data: {
        razon_social: body.razon_social.trim(),
        rut: body.rut?.trim() ?? null,
        contacto: body.contacto?.trim() ?? null,
        telefono: body.telefono?.trim() ?? null,
        email: body.email?.trim() ?? null,
        direccion: body.direccion?.trim() ?? null,
        notas_comerciales: body.notas_comerciales?.trim() ?? null,
        activo: true,
      },
    })
    return NextResponse.json({ data: empresa, error: null }, { status: 201 })
  } catch (err: unknown) {
    const msg = err instanceof Error && err.message.includes('Unique constraint')
      ? 'Ya existe una empresa con ese RUT'
      : 'Error al crear la empresa'
    return NextResponse.json({ data: null, error: msg }, { status: 500 })
  }
}
