'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { PedidoConDetalle, MetodoPago } from '@/lib/types'
import { formatCLP, guardarEntregaOffline, sincronizarEntregas } from '@/lib/utils'

type ItemForm = {
  producto_id: string
  nombre_producto: string
  cantidad_pedida: number
  cantidad_entregada: number
}

type MetodoPagoOpcion = {
  value: MetodoPago
  label: string
}

const METODOS: MetodoPagoOpcion[] = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'pendiente', label: 'Pendiente' },
]

type Props = {
  pedido: PedidoConDetalle
}

export function RegistrarEntregaForm({ pedido }: Props) {
  const router = useRouter()
  const fotoInputRef = useRef<HTMLInputElement>(null)

  // Estado GPS
  const [latitud, setLatitud] = useState<number | null>(null)
  const [longitud, setLongitud] = useState<number | null>(null)
  const [gpsEstado, setGpsEstado] = useState<'cargando' | 'ok' | 'error'>('cargando')

  // Items entregados
  const [items, setItems] = useState<ItemForm[]>(() =>
    (pedido.items ?? []).map((item) => ({
      producto_id: item.producto_id,
      nombre_producto: item.producto?.nombre ?? 'Producto',
      cantidad_pedida: item.cantidad,
      cantidad_entregada: item.cantidad,
    }))
  )

  // Bidones vacíos
  const [bidiVacios, setBidiVacios] = useState(0)

  // Cobro
  const [montoCobrado, setMontoCobrado] = useState<number>(pedido.monto_total ?? 0)
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('efectivo')

  // Foto
  const [fotoDataUrl, setFotoDataUrl] = useState<string | undefined>(undefined)
  const [fotoNombre, setFotoNombre] = useState<string | undefined>(undefined)

  // Observaciones
  const [observaciones, setObservaciones] = useState('')

  // Estado de envío
  const [enviando, setEnviando] = useState(false)
  const [feedback, setFeedback] = useState<{
    tipo: 'exito' | 'offline' | 'error'
    mensaje: string
  } | null>(null)

  // Capturar GPS al montar
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsEstado('error')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitud(pos.coords.latitude)
        setLongitud(pos.coords.longitude)
        setGpsEstado('ok')
      },
      () => {
        setGpsEstado('error')
      },
      { timeout: 10000, maximumAge: 60000 }
    )
  }, [])

  // Sincronizar al recuperar conexión
  useEffect(() => {
    const handleOnline = () => {
      sincronizarEntregas().catch(() => {
        // Silenciar errores de sincronización en background
      })
    }
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [])

  // Manejar cambio de foto
  const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFotoNombre(file.name)
    const reader = new FileReader()
    reader.onload = (ev) => {
      setFotoDataUrl(ev.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Ajustar cantidad entregada
  const cambiarCantidad = useCallback(
    (idx: number, delta: number) => {
      setItems((prev) =>
        prev.map((item, i) =>
          i === idx
            ? { ...item, cantidad_entregada: Math.max(0, item.cantidad_entregada + delta) }
            : item
        )
      )
    },
    []
  )

  const handleConfirmar = async () => {
    if (enviando) return
    setEnviando(true)
    setFeedback(null)

    const payload = {
      pedido_id: pedido.id,
      latitud,
      longitud,
      bidones_vacios_recibidos: bidiVacios,
      monto_cobrado: montoCobrado,
      metodo_pago: metodoPago,
      observaciones,
    }

    try {
      const res = await fetch('/api/entregas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        setFeedback({ tipo: 'exito', mensaje: 'Entrega registrada correctamente.' })
        setTimeout(() => router.push('/chofer'), 1500)
      } else {
        const json = (await res.json()) as { error?: string }
        setFeedback({
          tipo: 'error',
          mensaje: json.error ?? 'Error al registrar la entrega.',
        })
        setEnviando(false)
      }
    } catch {
      // Sin conexión — guardar offline
      try {
        await guardarEntregaOffline({
          pedido_id: pedido.id,
          timestamp_local: new Date().toISOString(),
          latitud,
          longitud,
          bidones_vacios_recibidos: bidiVacios,
          monto_cobrado: montoCobrado,
          metodo_pago: metodoPago,
          observaciones,
          foto_data_url: fotoDataUrl,
          sincronizado: false,
        })
        setFeedback({
          tipo: 'offline',
          mensaje:
            'Sin conexión. Entrega guardada localmente y se sincronizará cuando vuelva el internet.',
        })
        setTimeout(() => router.push('/chofer'), 2500)
      } catch {
        setFeedback({
          tipo: 'error',
          mensaje: 'No se pudo guardar la entrega. Intenta de nuevo.',
        })
        setEnviando(false)
      }
    }
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Sección 1: GPS */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 px-5 py-4 space-y-1">
        <h2 className="font-nunito font-bold text-base text-gray-700">Ubicación GPS</h2>
        {gpsEstado === 'cargando' && (
          <p className="font-outfit text-sm text-gray-400">Obteniendo ubicación...</p>
        )}
        {gpsEstado === 'ok' && (
          <p className="font-outfit text-sm text-green-700 font-medium">
            Ubicación capturada ({latitud?.toFixed(5)}, {longitud?.toFixed(5)})
          </p>
        )}
        {gpsEstado === 'error' && (
          <p className="font-outfit text-sm text-yellow-700 font-medium">
            Sin GPS — la entrega se registrará sin coordenadas
          </p>
        )}
      </section>

      {/* Sección 2: Productos entregados */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 px-5 py-4 space-y-3">
        <h2 className="font-nunito font-bold text-base text-gray-700">
          Productos entregados
        </h2>
        {items.length === 0 && (
          <p className="font-outfit text-sm text-gray-400">Sin productos en el pedido.</p>
        )}
        <ul className="space-y-3" aria-label="Productos a entregar">
          {items.map((item, idx) => (
            <li key={item.producto_id} className="space-y-1">
              <p className="font-outfit text-sm font-semibold text-gray-800">
                {item.nombre_producto}
                <span className="font-normal text-gray-400 ml-1">
                  (pedido: {item.cantidad_pedida})
                </span>
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => cambiarCantidad(idx, -1)}
                  className="w-11 h-11 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xl flex items-center justify-center transition-colors"
                  aria-label={`Reducir cantidad de ${item.nombre_producto}`}
                >
                  −
                </button>
                <span className="font-nunito font-extrabold text-2xl text-gray-900 w-10 text-center">
                  {item.cantidad_entregada}
                </span>
                <button
                  type="button"
                  onClick={() => cambiarCantidad(idx, 1)}
                  className="w-11 h-11 rounded-xl bg-viflomax-verde hover:bg-viflomax-verde-claro text-white font-bold text-xl flex items-center justify-center transition-colors"
                  aria-label={`Aumentar cantidad de ${item.nombre_producto}`}
                >
                  +
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Sección 3: Bidones vacíos */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 px-5 py-4 space-y-3">
        <h2 className="font-nunito font-bold text-base text-gray-700">
          Bidones vacíos recibidos
        </h2>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setBidiVacios((v) => Math.max(0, v - 1))}
            className="w-11 h-11 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xl flex items-center justify-center transition-colors"
            aria-label="Reducir bidones vacíos"
          >
            −
          </button>
          <span className="font-nunito font-extrabold text-2xl text-gray-900 w-10 text-center">
            {bidiVacios}
          </span>
          <button
            type="button"
            onClick={() => setBidiVacios((v) => v + 1)}
            className="w-11 h-11 rounded-xl bg-viflomax-azul hover:bg-viflomax-azul-oscuro text-white font-bold text-xl flex items-center justify-center transition-colors"
            aria-label="Aumentar bidones vacíos"
          >
            +
          </button>
        </div>
      </section>

      {/* Sección 4: Cobro */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 px-5 py-4 space-y-4">
        <h2 className="font-nunito font-bold text-base text-gray-700">Cobro</h2>

        <div className="space-y-1">
          <label
            htmlFor="monto-cobrado"
            className="block text-sm font-outfit text-gray-600"
          >
            Monto cobrado (CLP)
          </label>
          <input
            id="monto-cobrado"
            type="number"
            inputMode="numeric"
            min={0}
            value={montoCobrado}
            onChange={(e) => setMontoCobrado(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 font-nunito font-bold text-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-viflomax-verde min-h-[52px]"
          />
          {pedido.monto_total != null && (
            <p className="text-xs font-outfit text-gray-400">
              Total del pedido: {formatCLP(pedido.monto_total)}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-outfit text-gray-600">Método de pago</p>
          <div className="grid grid-cols-3 gap-2">
            {METODOS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMetodoPago(m.value)}
                className={[
                  'py-3 rounded-xl font-outfit font-semibold text-sm border-2 transition-colors min-h-[52px]',
                  metodoPago === m.value
                    ? 'bg-viflomax-verde border-viflomax-verde text-white'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-viflomax-verde',
                ].join(' ')}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Sección 5: Foto */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 px-5 py-4 space-y-3">
        <h2 className="font-nunito font-bold text-base text-gray-700">
          Foto{' '}
          <span className="font-normal text-gray-400 text-sm">(opcional)</span>
        </h2>

        <button
          type="button"
          onClick={() => fotoInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 hover:border-viflomax-verde text-gray-600 hover:text-viflomax-verde font-outfit text-sm transition-colors w-full justify-center min-h-[52px]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          {fotoNombre ? fotoNombre : 'Tomar Foto'}
        </button>

        <input
          ref={fotoInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={handleFoto}
          aria-label="Seleccionar foto de entrega"
        />

        {fotoDataUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={fotoDataUrl}
            alt="Previsualización de foto de entrega"
            className="w-full rounded-xl object-cover max-h-48 border border-gray-200"
          />
        )}
      </section>

      {/* Sección 6: Observaciones */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 px-5 py-4 space-y-2">
        <label
          htmlFor="observaciones"
          className="block font-nunito font-bold text-base text-gray-700"
        >
          Observaciones{' '}
          <span className="font-normal text-gray-400 text-sm">(opcional)</span>
        </label>
        <textarea
          id="observaciones"
          rows={3}
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          placeholder="Ej: Cliente no estaba, dejé con vecino..."
          className="w-full border border-gray-300 rounded-xl px-4 py-3 font-outfit text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-viflomax-verde"
        />
      </section>

      {/* Feedback */}
      {feedback && (
        <div
          role="alert"
          className={[
            'rounded-xl px-5 py-4 font-outfit text-sm font-medium border',
            feedback.tipo === 'exito'
              ? 'bg-green-50 text-green-800 border-green-200'
              : feedback.tipo === 'offline'
              ? 'bg-yellow-50 text-yellow-800 border-yellow-200'
              : 'bg-red-50 text-red-800 border-red-200',
          ].join(' ')}
        >
          {feedback.mensaje}
        </div>
      )}

      {/* Botón confirmar */}
      <button
        type="button"
        onClick={handleConfirmar}
        disabled={enviando}
        className="w-full bg-viflomax-verde hover:bg-viflomax-verde-claro disabled:opacity-60 text-white font-nunito font-extrabold text-lg rounded-xl py-4 px-6 transition-colors min-h-[60px] flex items-center justify-center gap-2 shadow-md"
      >
        {enviando ? (
          <>
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Registrando...
          </>
        ) : (
          'Confirmar Entrega'
        )}
      </button>
    </div>
  )
}
