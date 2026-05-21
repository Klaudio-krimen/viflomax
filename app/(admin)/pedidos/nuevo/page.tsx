'use client'

import React, { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function NuevoPedidoPage() {
  const router = useRouter()

  const [clienteId, setClienteId] = useState('')
  const [choferId, setChoferId] = useState('')
  const [fechaEntrega, setFechaEntrega] = useState('')
  const [notas, setNotas] = useState('')
  const [items, setItems] = useState([{ productoId: '', cantidad: 1, precioCalculado: null as number | null }])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [calculando, setCalculando] = useState(false)

  const addItem = () => {
    setItems((prev) => [...prev, { productoId: '', cantidad: 1, precioCalculado: null }])
  }

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  const updateItem = (idx: number, field: 'productoId' | 'cantidad', value: string) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === idx
          ? { ...item, [field]: field === 'cantidad' ? Math.max(1, Number(value)) : value, precioCalculado: null }
          : item
      )
    )
  }

  const calcularPrecio = async (idx: number) => {
    const item = items[idx]
    if (!item.productoId || !clienteId) return

    setCalculando(true)
    try {
      const res = await fetch('/api/precios/calcular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productoId: item.productoId,
          cantidad: item.cantidad,
          clienteId,
        }),
      })
      if (res.ok) {
        const json = await res.json() as { data?: { precio?: number } }
        const precio = json.data?.precio ?? null
        setItems((prev) =>
          prev.map((it, i) => (i === idx ? { ...it, precioCalculado: precio } : it))
        )
      }
    } catch {
      // silencioso — el precio simplemente no se muestra
    } finally {
      setCalculando(false)
    }
  }

  const montoEstimado = items.reduce((sum, item) => {
    if (item.precioCalculado !== null) {
      return sum + item.precioCalculado * item.cantidad
    }
    return sum
  }, 0)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const itemsValidos = items.filter((it) => it.productoId && it.cantidad > 0)
    if (itemsValidos.length === 0) {
      setError('Agrega al menos un producto')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente_id: clienteId || undefined,
          chofer_id: choferId || undefined,
          fecha_entrega_programada: fechaEntrega || undefined,
          origen: 'manual',
          notas: notas || undefined,
          items: itemsValidos.map((it) => ({
            producto_id: it.productoId,
            cantidad: it.cantidad,
          })),
        }),
      })

      const json = await res.json() as { error?: string }
      if (!res.ok) {
        throw new Error(json.error ?? 'Error al crear pedido')
      }

      router.push('/admin/pedidos')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h2 className="font-nunito text-2xl font-extrabold text-gray-900">Nuevo Pedido Manual</h2>
        <p className="text-sm font-outfit text-gray-500 mt-0.5">Crea un pedido directamente desde el panel</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-5" noValidate>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg px-4 py-2.5 text-sm font-outfit">
            {error}
          </div>
        )}

        {/* Cliente */}
        <Input
          label="ID del cliente"
          id="cliente-id"
          value={clienteId}
          onChange={(e) => setClienteId(e.target.value)}
          placeholder="UUID del cliente (opcional)"
          helperText="Ingresa el ID del cliente para calcular precio automáticamente"
        />

        {/* Chofer */}
        <Input
          label="ID del chofer"
          id="chofer-id"
          value={choferId}
          onChange={(e) => setChoferId(e.target.value)}
          placeholder="UUID del chofer (opcional)"
        />

        {/* Fecha de entrega */}
        <Input
          label="Fecha de entrega programada"
          id="fecha-entrega"
          type="date"
          value={fechaEntrega}
          onChange={(e) => setFechaEntrega(e.target.value)}
        />

        {/* Items */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium text-sm text-gray-700 font-outfit">Productos *</span>
            <button
              type="button"
              onClick={addItem}
              className="text-sm text-viflomax-verde font-outfit font-medium hover:underline"
            >
              + Agregar producto
            </button>
          </div>
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-end gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex-1">
                  <label className="text-xs font-outfit text-gray-600 font-medium block mb-1">
                    ID Producto
                  </label>
                  <input
                    type="text"
                    value={item.productoId}
                    onChange={(e) => updateItem(idx, 'productoId', e.target.value)}
                    onBlur={() => calcularPrecio(idx)}
                    placeholder="UUID del producto"
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-outfit focus:outline-none focus:ring-2 focus:ring-viflomax-azul"
                  />
                </div>
                <div className="w-24">
                  <label className="text-xs font-outfit text-gray-600 font-medium block mb-1">
                    Cantidad
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={item.cantidad}
                    onChange={(e) => updateItem(idx, 'cantidad', e.target.value)}
                    onBlur={() => calcularPrecio(idx)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-outfit focus:outline-none focus:ring-2 focus:ring-viflomax-azul"
                  />
                </div>
                {item.precioCalculado !== null && (
                  <div className="text-xs font-outfit text-green-700 bg-green-50 px-2 py-1 rounded border border-green-200 shrink-0">
                    ${item.precioCalculado.toLocaleString('es-CL')} c/u
                  </div>
                )}
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                    aria-label="Eliminar producto"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
          {calculando && (
            <p className="text-xs font-outfit text-gray-400 mt-1">Calculando precio…</p>
          )}
          {montoEstimado > 0 && (
            <div className="mt-3 text-right font-outfit font-semibold text-gray-800">
              Total estimado:{' '}
              <span className="text-viflomax-verde text-lg">
                {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(montoEstimado)}
              </span>
            </div>
          )}
        </div>

        {/* Notas */}
        <div className="flex flex-col gap-1">
          <label htmlFor="notas" className="font-medium text-sm text-gray-700 font-outfit">
            Notas
          </label>
          <textarea
            id="notas"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={3}
            placeholder="Instrucciones de entrega, observaciones…"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-outfit text-gray-900 focus:outline-none focus:ring-2 focus:ring-viflomax-azul resize-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-outfit text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <Button type="submit" variant="primary" loading={loading}>
            Crear Pedido
          </Button>
        </div>
      </form>
    </div>
  )
}
