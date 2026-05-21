import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse, ApiListResponse, Cliente } from '@/lib/types'

/**
 * GET /api/clientes
 * Lista de clientes (solo admin).
 * Soporta búsqueda opcional por nombre o teléfono: ?search=texto
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()

  // Verificar autenticación
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json(
      { data: null, error: 'No autenticado' } as ApiResponse<never>,
      { status: 401 }
    )
  }

  // Solo admin puede listar todos los clientes
  const rol = user.app_metadata?.role as string | undefined
  if (rol !== 'admin') {
    return NextResponse.json(
      { data: null, error: 'Sin permisos' } as ApiResponse<never>,
      { status: 403 }
    )
  }

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')

  let query = supabase
    .from('clientes')
    .select('*', { count: 'exact' })
    .order('nombre', { ascending: true })

  if (search) {
    query = query.or(`nombre.ilike.%${search}%,telefono.ilike.%${search}%`)
  }

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json(
      { data: null, total: 0, error: 'Error al obtener clientes' } as ApiListResponse<Cliente>,
      { status: 500 }
    )
  }

  return NextResponse.json(
    { data: data as Cliente[], total: count ?? 0, error: null } as ApiListResponse<Cliente>
  )
}

/**
 * POST /api/clientes
 * Crear un nuevo cliente.
 * Body: { nombre, telefono?, email?, direccion?, comuna?, sector?, tipo_cliente?, empresa_id?, notas? }
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // Verificar autenticación
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
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

  const { data, error } = await supabase
    .from('clientes')
    .insert({
      nombre: body.nombre.trim(),
      telefono: body.telefono ?? null,
      email: body.email ?? null,
      direccion: body.direccion ?? null,
      comuna: body.comuna ?? null,
      sector: body.sector ?? null,
      tipo_cliente: body.tipo_cliente ?? 'nuevo',
      empresa_id: body.empresa_id ?? null,
      notas: body.notas ?? null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json(
      { data: null, error: 'Error al crear el cliente' } as ApiResponse<Cliente>,
      { status: 500 }
    )
  }

  return NextResponse.json(
    { data: data as Cliente, error: null } as ApiResponse<Cliente>,
    { status: 201 }
  )
}
