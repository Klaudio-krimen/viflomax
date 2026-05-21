/**
 * Helpers generales de Agua Viflomax
 * Formatters, colores de estado, y utilidades para soporte offline con IndexedDB
 */

import type { EntregaPendienteOffline } from '@/lib/types'

// ============================================================================
// FORMATTERS
// ============================================================================

/**
 * Formatear precio en CLP
 */
export function formatCLP(monto: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(monto)
}

/**
 * Formatear fecha en español
 */
export function formatFecha(fecha: string | Date): string {
  return new Intl.DateTimeFormat('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(fecha))
}

/**
 * Formatear hora
 */
export function formatHora(fecha: string | Date): string {
  return new Intl.DateTimeFormat('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(fecha))
}

/**
 * Obtener clases CSS de color según estado de pedido
 */
export function colorEstado(estado: string): string {
  const colores: Record<string, string> = {
    nuevo: 'bg-gray-100 text-gray-700',
    confirmado: 'bg-blue-100 text-blue-700',
    en_ruta: 'bg-yellow-100 text-yellow-700',
    entregado: 'bg-green-100 text-green-700',
    cancelado: 'bg-red-100 text-red-700',
  }
  return colores[estado] ?? 'bg-gray-100 text-gray-700'
}

// ============================================================================
// INDEXEDDB — SOPORTE OFFLINE
// ============================================================================

const DB_NAME = 'viflomax-chofer'
const DB_VERSION = 1
const STORE_NAME = 'entregas_pendientes'

async function abrirDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'pedido_id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/**
 * Guardar entrega offline en IndexedDB
 */
export async function guardarEntregaOffline(
  entrega: EntregaPendienteOffline
): Promise<void> {
  const db = await abrirDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.put(entrega)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
    tx.oncomplete = () => db.close()
  })
}

/**
 * Obtener todas las entregas pendientes (sincronizado: false) de IndexedDB
 */
export async function obtenerEntregasPendientes(): Promise<
  EntregaPendienteOffline[]
> {
  const db = await abrirDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.getAll()
    request.onsuccess = () => {
      const all = request.result as EntregaPendienteOffline[]
      resolve(all.filter((e) => !e.sincronizado))
    }
    request.onerror = () => reject(request.error)
    tx.oncomplete = () => db.close()
  })
}

/**
 * Marcar una entrega como sincronizada en IndexedDB
 */
export async function marcarEntregaSincronizada(pedido_id: string): Promise<void> {
  const db = await abrirDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const getReq = store.get(pedido_id)

    getReq.onsuccess = () => {
      const entrega = getReq.result as EntregaPendienteOffline | undefined
      if (!entrega) {
        resolve()
        return
      }
      const putReq = store.put({ ...entrega, sincronizado: true })
      putReq.onsuccess = () => resolve()
      putReq.onerror = () => reject(putReq.error)
    }

    getReq.onerror = () => reject(getReq.error)
    tx.oncomplete = () => db.close()
  })
}

/**
 * Sincronizar todas las entregas pendientes con el servidor.
 * Para cada una hace POST a /api/entregas; si éxito la marca como sincronizada.
 */
export async function sincronizarEntregas(): Promise<{
  sincronizadas: number
  errores: number
}> {
  let sincronizadas = 0
  let errores = 0

  let pendientes: EntregaPendienteOffline[]
  try {
    pendientes = await obtenerEntregasPendientes()
  } catch {
    return { sincronizadas: 0, errores: 0 }
  }

  for (const entrega of pendientes) {
    try {
      const res = await fetch('/api/entregas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pedido_id: entrega.pedido_id,
          latitud: entrega.latitud,
          longitud: entrega.longitud,
          bidones_vacios_recibidos: entrega.bidones_vacios_recibidos,
          monto_cobrado: entrega.monto_cobrado,
          metodo_pago: entrega.metodo_pago,
          observaciones: entrega.observaciones,
        }),
      })

      if (res.ok) {
        await marcarEntregaSincronizada(entrega.pedido_id)
        sincronizadas++
      } else {
        errores++
      }
    } catch {
      errores++
    }
  }

  return { sincronizadas, errores }
}
