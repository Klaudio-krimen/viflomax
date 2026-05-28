import { db } from '@/lib/db'
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

  if (clienteTipo === 'mayorista' && empresaId) {
    const resultado = await calcularPrecioMayorista(productoId, cantidad, empresaId)
    if (resultado) return resultado
  }

  if (clienteTipo === 'detalle') {
    if (sector) {
      const resultado = await calcularPrecioDetalle(productoId, cantidad, sector)
      if (resultado) return resultado
    }
    const resultado = await calcularPrecioDetalle(productoId, cantidad, null)
    if (resultado) return resultado
  }

  // Fallback: precio base del producto
  const producto = await db.producto.findUnique({
    where: { id: productoId },
    select: { precio_base: true },
  })

  if (producto?.precio_base !== null && producto?.precio_base !== undefined) {
    return {
      precio: Number(producto.precio_base),
      origen: 'base',
    }
  }

  return { precio: 0, origen: 'sin_precio' }
}

async function calcularPrecioMayorista(
  productoId: string,
  cantidad: number,
  empresaId: string
): Promise<ResultadoPrecio | null> {
  const hoy = new Date()

  const tramos = await db.precioMayorista.findMany({
    where: {
      empresa_id: empresaId,
      producto_id: productoId,
      volumen_minimo: { lte: cantidad },
      vigente_desde: { lte: hoy },
      OR: [{ vigente_hasta: null }, { vigente_hasta: { gte: hoy } }],
    },
    orderBy: { volumen_minimo: 'desc' },
  })

  if (tramos.length === 0) return null

  const tramo = tramos.find(
    (t) => cantidad >= t.volumen_minimo && (t.volumen_maximo === null || cantidad <= t.volumen_maximo)
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
  productoId: string,
  cantidad: number,
  sector: string | null
): Promise<ResultadoPrecio | null> {
  const hoy = new Date()

  const tramos = await db.precioDetalle.findMany({
    where: {
      producto_id: productoId,
      sector: sector === null ? null : sector,
      cantidad_minima: { lte: cantidad },
      vigente_desde: { lte: hoy },
      OR: [{ vigente_hasta: null }, { vigente_hasta: { gte: hoy } }],
    },
    orderBy: { cantidad_minima: 'desc' },
  })

  if (tramos.length === 0) return null

  const tramo = tramos.find(
    (t) =>
      cantidad >= t.cantidad_minima &&
      (t.cantidad_maxima === null || cantidad <= t.cantidad_maxima)
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
