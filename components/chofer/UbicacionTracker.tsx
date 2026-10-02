'use client'

import { useEffect, useState } from 'react'
import { useUbicacionPing } from '@/lib/useUbicacionPing'

const CONSENTIMIENTO_KEY = 'viflomax_rastreo_ubicacion_aceptado'
const INTERVALO_CHEQUEO_TURNO_MS = 60000

/** Minutos entre dos marcas de tiempo, nunca negativo. */
function minutosEntre(marca: number, ahora: number): number {
  return Math.max(0, Math.floor((ahora - marca) / 60000))
}

type Apariencia = { punto: string; texto: string; borde: string }

const APARIENCIA: Record<'ok' | 'aviso' | 'falla', Apariencia> = {
  ok: { punto: 'bg-viflomax-verde animate-pulse', texto: 'text-gray-700', borde: 'border-gray-200' },
  aviso: { punto: 'bg-amber-500', texto: 'text-amber-800', borde: 'border-amber-300' },
  falla: { punto: 'bg-red-500', texto: 'text-red-800', borde: 'border-red-300' },
}

/**
 * Pide consentimiento antes del primer prompt nativo del navegador, activa
 * useUbicacionPing sólo mientras hay turno activo y consentimiento dado, y
 * muestra el estado real del rastreo — incluido cuando NO está funcionando.
 * Sin props: se monta directo en app/chofer/layout.tsx (Server Component).
 */
export default function UbicacionTracker() {
  const [turnoActivo, setTurnoActivo] = useState(false)
  const [consentimiento, setConsentimiento] = useState(false)
  const [ahora, setAhora] = useState(() => Date.now())

  useEffect(() => {
    try {
      setConsentimiento(localStorage.getItem(CONSENTIMIENTO_KEY) === '1')
    } catch {
      // Almacenamiento bloqueado: se vuelve a pedir el consentimiento.
    }
  }, [])

  useEffect(() => {
    let cancelado = false

    async function verificarTurno() {
      try {
        const res = await fetch('/api/turnos')
        const json = (await res.json()) as { data: unknown }
        if (!cancelado) setTurnoActivo(Boolean(json?.data))
      } catch {
        if (!cancelado) setTurnoActivo(false)
      }
    }

    verificarTurno()
    const intervalo = setInterval(verificarTurno, INTERVALO_CHEQUEO_TURNO_MS)
    return () => {
      cancelado = true
      clearInterval(intervalo)
    }
  }, [])

  // Refresca el "hace N min" sin tocar el rastreo.
  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 30000)
    return () => clearInterval(t)
  }, [])

  const { estado, ultimoEnvio, reintentar } = useUbicacionPing({
    activo: turnoActivo && consentimiento,
  })

  function aceptar() {
    try {
      localStorage.setItem(CONSENTIMIENTO_KEY, '1')
    } catch {
      // Si no se puede persistir, al menos vale para esta sesión.
    }
    setConsentimiento(true)
  }

  if (!turnoActivo) return null

  // Tarjeta de consentimiento, antes del prompt nativo del navegador.
  if (!consentimiento) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 max-w-md mx-auto space-y-3">
          <p className="font-nunito font-bold text-gray-900">Compartir ubicación durante tu turno</p>
          <p className="font-outfit text-sm text-gray-600">
            Para que el administrador vea tu posición en el mapa de flota, Viflomax necesita acceso a
            tu ubicación. El rastreo <strong>sólo ocurre durante un turno activo</strong> y{' '}
            <strong>se detiene cuando cierras la aplicación o bloqueas el teléfono</strong>.
          </p>
          <button
            type="button"
            onClick={aceptar}
            className="w-full px-4 py-3 min-h-[44px] rounded-xl bg-viflomax-verde-700 text-white font-outfit font-semibold hover:opacity-90 transition-opacity"
          >
            Aceptar y compartir ubicación
          </button>
        </div>
      </div>
    )
  }

  // Permiso denegado: es la falla que antes quedaba invisible.
  if (estado === 'denegado') {
    return (
      <div className="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6">
        <div className="bg-white rounded-xl shadow-sm border border-red-300 p-5 max-w-md mx-auto space-y-3">
          <p className="font-nunito font-bold text-red-800">Tu ubicación está bloqueada</p>
          <p className="font-outfit text-sm text-gray-600">
            El navegador está rechazando el acceso a tu ubicación, así que{' '}
            <strong>no apareces en el mapa de flota</strong>. Ábrelo en los permisos del sitio
            (el candado junto a la dirección), activa <strong>Ubicación</strong> y vuelve a intentar.
          </p>
          <button
            type="button"
            onClick={reintentar}
            className="w-full px-4 py-3 min-h-[44px] rounded-xl bg-viflomax-verde-700 text-white font-outfit font-semibold hover:opacity-90 transition-opacity"
          >
            Ya lo activé, reintentar
          </button>
        </div>
      </div>
    )
  }

  const minutos = ultimoEnvio === null ? null : minutosEntre(ultimoEnvio, ahora)

  let tono: 'ok' | 'aviso' | 'falla' = 'ok'
  let mensaje: string

  if (estado === 'no_disponible') {
    tono = 'falla'
    mensaje = 'Este teléfono no permite ubicación'
  } else if (estado === 'error') {
    tono = 'falla'
    mensaje = 'Sin señal de GPS'
  } else if (estado === 'pendiente') {
    tono = 'aviso'
    mensaje = 'Sin conexión — se enviará al recuperar señal'
  } else if (estado === 'esperando') {
    tono = 'aviso'
    mensaje = 'Buscando tu ubicación…'
  } else if (minutos !== null && minutos >= 10) {
    tono = 'aviso'
    mensaje = `Última señal hace ${minutos} min`
  } else {
    tono = 'ok'
    mensaje = minutos === null ? 'Compartiendo ubicación' : `Compartiendo · hace ${minutos} min`
  }

  const estilo = APARIENCIA[tono]

  return (
    <div
      role="status"
      className={`fixed bottom-4 right-4 z-40 flex items-center gap-2 bg-white rounded-xl shadow-sm border px-3 py-2 ${estilo.borde}`}
    >
      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${estilo.punto}`} />
      <span className={`font-outfit text-sm ${estilo.texto}`}>{mensaje}</span>
    </div>
  )
}
