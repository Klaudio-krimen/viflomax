'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { validarCoordenadas } from '@/lib/ubicaciones'
import { guardarUbicacionOffline, sincronizarUbicaciones } from '@/lib/utils'

const INTERVALO_ENVIO_MS = 2 * 60 * 1000

/**
 * Estado real del rastreo, pensado para mostrarse tal cual al chofer.
 * Antes el indicador decía "compartiendo" apenas se registraba el watch,
 * incluso con el permiso denegado; estos estados existen para no mentir.
 */
export type EstadoRastreo =
  | 'inactivo' // sin turno o sin consentimiento
  | 'esperando' // watch registrado, todavía sin primera posición
  | 'activo' // llegando posiciones y enviándose al servidor
  | 'pendiente' // hay posición, pero el último envío falló y quedó en cola
  | 'denegado' // el navegador denegó el permiso de ubicación
  | 'no_disponible' // el dispositivo/navegador no ofrece geolocalización
  | 'error' // señal no disponible o timeout

type OpcionesUbicacionPing = {
  activo: boolean
}

type ResultadoUbicacionPing = {
  estado: EstadoRastreo
  /** Marca de tiempo del último ping aceptado por el servidor. */
  ultimoEnvio: number | null
  /** Vuelve a registrar el watch — reintento tras denegar o perder señal. */
  reintentar: () => void
}

/**
 * Captura la posición del navegador mientras `activo` es true y envía un
 * ping cada 2 minutos como máximo (el throttle vive en el sitio de envío,
 * comparando contra una marca de tiempo en useRef — nunca un temporizador
 * propio). Degrada en silencio hacia la UI del chofer: nunca lanza ni
 * bloquea, pero sí reporta su estado real para que se pueda mostrar.
 *
 * Límite conocido: `watchPosition` deja de emitir cuando la pantalla se
 * bloquea o el navegador pasa a segundo plano. El rastreo continuo con el
 * teléfono guardado requeriría una app nativa.
 */
export function useUbicacionPing({ activo }: OpcionesUbicacionPing): ResultadoUbicacionPing {
  const [estado, setEstado] = useState<EstadoRastreo>('inactivo')
  const [ultimoEnvio, setUltimoEnvio] = useState<number | null>(null)
  const [intento, setIntento] = useState(0)
  const ultimoEnvioRef = useRef(0)
  const watchIdRef = useRef<number | null>(null)

  const reintentar = useCallback(() => setIntento((n) => n + 1), [])

  useEffect(() => {
    if (!activo) {
      setEstado('inactivo')
      return
    }

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setEstado('no_disponible')
      return
    }

    setEstado('esperando')

    const enviarPing = async (latitud: number, longitud: number, precision_m: number | null) => {
      if (!validarCoordenadas(latitud, longitud)) return
      try {
        const res = await fetch('/api/ubicaciones', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ latitud, longitud, precision_m: precision_m ?? undefined }),
        })
        if (res.ok) {
          setUltimoEnvio(Date.now())
          setEstado('activo')
        } else {
          await guardarUbicacionOffline({ latitud, longitud, precision_m })
          setEstado('pendiente')
        }
      } catch {
        await guardarUbicacionOffline({ latitud, longitud, precision_m })
        setEstado('pendiente')
      }
    }

    const alRecibirPosicion = (posicion: GeolocationPosition) => {
      const ahora = Date.now()
      const esPrimerEnvio = ultimoEnvioRef.current === 0
      if (!esPrimerEnvio && ahora - ultimoEnvioRef.current < INTERVALO_ENVIO_MS) return
      ultimoEnvioRef.current = ahora
      const { latitude, longitude, accuracy } = posicion.coords
      void enviarPing(latitude, longitude, accuracy ?? null)
    }

    const alFallar = (err: GeolocationPositionError) => {
      // Nunca bloquea la UI del chofer, pero sí deja de mentir sobre su estado.
      setEstado(err.code === err.PERMISSION_DENIED ? 'denegado' : 'error')
    }

    const watchId = navigator.geolocation.watchPosition(alRecibirPosicion, alFallar, {
      enableHighAccuracy: true,
      maximumAge: 60000,
      timeout: 30000,
    })
    watchIdRef.current = watchId

    const alReconectar = () => {
      void sincronizarUbicaciones()
    }
    window.addEventListener('online', alReconectar)

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
      window.removeEventListener('online', alReconectar)
    }
  }, [activo, intento])

  return { estado, ultimoEnvio, reintentar }
}
