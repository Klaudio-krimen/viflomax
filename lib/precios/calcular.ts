import { createClient } from '@/lib/supabase/server'
import type { ResultadoPrecio, InputCalculoPrecio } from '@/lib/types'

/**
 * Calcula el precio para un item de pedido según el tipo de cliente.
 *
 * Reglas de prioridad:
 * 1. Precio mayorista del tramo correspondiente (cliente mayorista)
 * 2. Precio detalle por sector y cantidad (cliente detalle con sector)
 * 3. Precio detalle genérico por cantidad (sin importar sector)
 * 4. Precio base del producto (fallback)
 * 5. Sin precio → retorna origen 'sin_precio'
 */
export async function calcularPrecioItem(
  input: InputCalculoPrecio
): Promise<ResultadoPrecio> {
  const { productoId, cantidad, clienteTipo, empresaId, sector } = input
  const supabase = await createClient()

  if (clienteTipo === 'mayorista' && empresaId) {
    const resultado = await calcularPrecioMayorista(supabase, productoId, cantidad, empresaId)
    if (resultado) return resultado
  }

  if (clienteTipo === 'detalle') {
    // Intentar con sector específico primero
    if (sector) {
      const resultado = await calcularPrecioDetalle(supabase, productoId, cantidad, sector)
      if (resultado) return resultado
    }
    // Fallback: precio detalle sin sector
    const resultado = await calcularPrecioDetalle(supabase, productoId, cantidad, null)
    if (resultado) return resultado
  }

  // Fallback final: precio base del producto
  const { data: producto } = await supabase
    .from('productos')
    .select('precio_base')
    .eq('id', productoId)
    .single()

  if (producto?.precio_base !== null && producto?.precio_base !== undefined) {
    return {
      precio: producto.precio_base,
      origen: 'base',
    }
  }

  return {
    precio: 0,
    origen: 'sin_precio',
  }
}

async function calcularPrecioMayorista(
  supabase: Awaited<ReturnType<typeof createClient>>,
  productoId: string,
  cantidad: number,
  empresaId: string
): Promise<ResultadoPrecio | null> {
  const hoy = new Date().toISOString().split('T')[0]

  const { data: tramos } = await supabase
    .from('precios_mayorista')
    .select('*')
    .eq('empresa_id', empresaId)
    .eq('producto_id', productoId)
    .lte('volumen_minimo', cantidad)
    .or(`vigente_hasta.is.null,vigente_hasta.gte.${hoy}`)
    .lte('vigente_desde', hoy)
    .order('volumen_minimo', { ascending: false })

  if (!tramos || tramos.length === 0) return null

  const tramo = tramos.find(
    (t: { volumen_minimo: number; volumen_maximo: number | null }) =>
      cantidad >= t.volumen_minimo && (t.volumen_maximo === null || cantidad <= t.volumen_maximo)
  )

  if (!tramo) return null

  return {
    precio: Number(tramo.precio),
    origen: 'mayorista',
    tramo_aplicado: tramo.volumen_maximo
      ? `${tramo.volumen_minimo}-${tramo.volumen_maximo} unidades`
      : `${tramo.volumen_minimo}+ unidades`,
  }
}

async function calcularPrecioDetalle(
  supabase: Awaited<ReturnType<typeof createClient>>,
  productoId: string,
  cantidad: number,
  sector: string | null
): Promise<ResultadoPrecio | null> {
  const hoy = new Date().toISOString().split('T')[0]

  let query = supabase
    .from('precios_detalle')
    .select('*')
    .eq('producto_id', productoId)
    .lte('cantidad_minima', cantidad)
    .or(`vigente_hasta.is.null,vigente_hasta.gte.${hoy}`)
    .lte('vigente_desde', hoy)
    .order('cantidad_minima', { ascending: false })

  if (sector) {
    query = query.eq('sector', sector)
  } else {
    query = query.is('sector', null)
  }

  const { data: tramos } = await query

  if (!tramos || tramos.length === 0) return null

  const tramo = tramos.find(
    (t: { cantidad_minima: number; cantidad_maxima: number | null }) =>
      cantidad >= t.cantidad_minima && (t.cantidad_maxima === null || cantidad <= t.cantidad_maxima)
  )

  if (!tramo) return null

  return {
    precio: Number(tramo.precio),
    origen: sector ? 'detalle_sector' : 'detalle_generico',
    tramo_aplicado: tramo.cantidad_maxima
      ? `${tramo.cantidad_minima}-${tramo.cantidad_maxima} unidades`
      : `${tramo.cantidad_minima}+ unidades`,
  }
}
