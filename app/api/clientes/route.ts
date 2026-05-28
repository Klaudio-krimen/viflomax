import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'
import type { ApiResponse, ApiListResponse, Cliente } from '@/lib/types'

/**
 * GET /api/clientes
 * Lista de clientes (solo admin).
 * Soporta búsqueda opcional por nombre o teléfono: ?search=texto
 */
export async function GET(request: NextRequest) {
  const token = await getToken({ req: request })
  if (!token) {
    return NextResponse.json(
      { data: null, error: 'No autenticado' } as ApiResponse<never>,
      { status: 401 }
    )
  }

  // Solo admin puede listar todos los clientes
  if (token.role !== 'admin') {
    return NextResponse.json(
      { data: null, error: 'Sin permisos' } as ApiResponse<never>,
      { status: 403 }
    )
  }

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')

  const where = search
    ? {
        OR: [
          { nombre: { contains: search, mode: 'insensitive' as const } },
          { telefono: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {}

  try {
    const [clientes, total] = await Promise.all([
      db.cliente.findMany({ where, orderBy: { nombre: 'asc' } }),
      db.cliente.count({ where }),
    ])

    return NextResponse.json(
      { data: clientes as unknown as Cliente[], total, error: null } as ApiListResponse<Cliente>
    )
  } catch {
    return NextResponse.json(
      { data: null, total: 0, error: 'Error al obtener clientes' } as ApiListResponse<Cliente>,
      { status: 500 }
    )
  }
}

/**
 * POST /api/clientes
 * Crear un nuevo cliente.
 * Body: { nombre, telefono?, email?, direccion?, comuna?, sector?, tipo_cliente?, empresa_id?, notas? }
 */
export async function POST(request: NextRequest) {
  const token = await getToken({ req: request })
  if (!token) {
    return NextResponse.json(
      { data: null, error: 'No autenticado' } as ApiResponse<never>,
      { status: 401 }
    )
  }

  let body: {
    nombre?: string
    telefono?: string
    email?: string
    direccion?: string
    comuna?: string
    sector?: string
    tipo_cliente?: 'mayorista' | 'detalle' | 'nuevo'
    empresa_id?: string
    notas?: string
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { data: null, error: 'Cuerpo de solicitud inválido' } as ApiResponse<never>,
      { status: 400 }
    )
  }

  // Validar campo obligatorio
  if (!body.nombre || body.nombre.trim() === '') {
    return NextResponse.json(
      { data: null, error: 'El nombre del cliente es obligatorio' } as ApiResponse<Cliente>,
      { status: 400 }
    )
  }

  try {
    const cliente = await db.cliente.create({
      data: {
        nombre: body.nombre.trim(),
        telefono: body.telefono ?? null,
        email: body.email ?? null,
        direccion: body.direccion ?? null,
        comuna: body.comuna ?? null,
        sector: body.sector ?? null,
        tipo_cliente: body.tipo_cliente ?? 'nuevo',
        empresa_id: body.empresa_id ?? null,
        notas: body.notas ?? null,
        activo: true,
      },
    })

    return NextResponse.json(
      { data: cliente as unknown as Cliente, error: null } as ApiResponse<Cliente>,
      { status: 201 }
    )
  } catch {
    return NextResponse.json(
      { data: null, error: 'Error al crear el cliente' } as ApiResponse<Cliente>,
      { status: 500 }
    )
  }
}
