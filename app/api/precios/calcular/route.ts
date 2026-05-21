import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calcularPrecioItem } from '@/lib/precios/calcular'
import type { ApiResponse, ResultadoPrecio, InputCalculoPrecio } from '@/lib/types'

/**
 * POST /api/precios/calcular
 * Calcular el precio para un item dado el tipo de cliente y contexto.
 *
 * Body (InputCalculoPrecio):
 * {
 *   productoId: uuid,
 *   cantidad: number,
 *   clienteTipo: 'mayorista' | 'detalle',
 *   empresaId?: uuid,
 *   sector?: string
 * }
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

  let body: InputCalculoPrecio
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { data: null, error: 'Cuerpo de solicitud inválido' } as ApiResponse<never>,
      { status: 400 }
    )
  }

  // Validar campos obligatorios
  if (!body.productoId) {
    return NextResponse.json(
      { data: null, error: 'El productoId es obligatorio' } as ApiResponse<ResultadoPrecio>,
      { status: 400 }
    )
  }

  if (!body.cantidad || body.cantidad <= 0) {
    return NextResponse.json(
      { data: null, error: 'La cantidad debe ser mayor a 0' } as ApiResponse<ResultadoPrecio>,
      { status: 400 }
    )
  }

  if (!body.clienteTipo || (body.clienteTipo !== 'mayorista' && body.clienteTipo !== 'detalle')) {
    return NextResponse.json(
      { data: null, error: 'El clienteTipo debe ser "mayorista" o "detalle"' } as ApiResponse<ResultadoPrecio>,
      { status: 400 }
    )
  }

  try {
    const resultado = await calcularPrecioItem(body)
    return NextResponse.json(
      { data: resultado, error: null } as ApiResponse<ResultadoPrecio>
    )
  } catch {
    return NextResponse.json(
      { data: null, error: 'Error al calcular el precio' } as ApiResponse<ResultadoPrecio>,
      { status: 500 }
    )
  }
}
