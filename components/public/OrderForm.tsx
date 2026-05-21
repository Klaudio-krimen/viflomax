'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'

type ProductoItem = {
  nombre: string
  emoji: string
}

const PRODUCTOS: ProductoItem[] = [
  { nombre: 'Envase 20 Litros', emoji: '💧' },
  { nombre: 'Envase 10 Litros', emoji: '💧' },
  { nombre: 'Recarga 20 Litros', emoji: '♻️' },
  { nombre: 'Recarga 10 Litros', emoji: '♻️' },
  { nombre: 'Dispensador Bomba USB', emoji: '⚡' },
  { nombre: 'Dispensador Básico Sobremesa', emoji: '🏠' },
  { nombre: 'Dispensador USB Sobremesa', emoji: '🏠' },
  { nombre: 'Hielo Purificado', emoji: '🧊' },
  { nombre: 'Manilla Transportadora', emoji: '🎒' },
]

const COMUNAS = ['Maipú', 'Pudahuel', 'Cerrillos', 'Bustos', 'Lo Prado']

type Cantidades = Record<string, number>

export function OrderForm() {
  const searchParams = useSearchParams()
  const productoParam = searchParams.get('producto') ?? ''

  const initialCantidades: Cantidades = Object.fromEntries(
    PRODUCTOS.map((p) => [p.nombre, p.nombre === productoParam ? 1 : 0])
  )

  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [direccion, setDireccion] = useState('')
  const [comuna, setComuna] = useState('')
  const [cantidades, setCantidades] = useState<Cantidades>(initialCantidades)
  const [notas, setNotas] = useState('')
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleCantidad = (nombre: string, value: string) => {
    const num = Math.max(0, parseInt(value, 10) || 0)
    setCantidades((prev) => ({ ...prev, [nombre]: num }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSuccessMessage(null)
    setErrorMessage(null)

    // Validaciones
    if (!nombre.trim() || !telefono.trim() || !direccion.trim() || !comuna.trim()) {
      setErrorMessage('Por favor completa todos los campos obligatorios.')
      return
    }

    const itemsConCantidad = PRODUCTOS.filter((p) => (cantidades[p.nombre] ?? 0) > 0).map(
      (p) => ({
        nombre: p.nombre,
        cantidad: cantidades[p.nombre] ?? 0,
      })
    )

    if (itemsConCantidad.length === 0) {
      setErrorMessage('Debes seleccionar al menos un producto con cantidad mayor a 0.')
      return
    }

    setLoading(true)

    try {
      const body = {
        nombre: nombre.trim(),
        telefono: telefono.trim(),
        email: email.trim() || undefined,
        direccion: direccion.trim(),
        comuna,
        items: itemsConCantidad.map((item) => ({
          productoId: item.nombre,
          cantidad: item.cantidad,
        })),
        notas: notas.trim() || undefined,
      }

      const res = await fetch('/api/pedidos/publico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const json = (await res.json()) as {
        data?: { numero_pedido?: string } | null
        error?: string | null
      }

      if (!res.ok || json.error) {
        setErrorMessage(json.error ?? 'Error al enviar el pedido. Intenta nuevamente.')
      } else {
        const numeroPedido = json.data?.numero_pedido
        setSuccessMessage(
          numeroPedido
            ? `¡Pedido recibido! Tu número de pedido es ${numeroPedido}. Te contactaremos pronto para confirmar.`
            : '¡Pedido recibido! Te contactaremos pronto para confirmar la entrega.'
        )
        // Reset form
        setNombre('')
        setTelefono('')
        setEmail('')
        setDireccion('')
        setComuna('')
        setCantidades(Object.fromEntries(PRODUCTOS.map((p) => [p.nombre, 0])))
        setNotas('')
      }
    } catch {
      setErrorMessage('Error de conexión. Verifica tu internet e intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* Success message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-4 text-sm">
          {successMessage}
        </div>
      )}

      {/* Error message */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 text-sm">
          {errorMessage}
        </div>
      )}

      {/* Datos del cliente */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-nunito font-bold text-gray-800 text-lg">Tus datos</h2>

        <div>
          <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre completo <span className="text-red-500">*</span>
          </label>
          <input
            id="nombre"
            type="text"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Juan Pérez"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-viflomax-azul focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono <span className="text-red-500">*</span>
          </label>
          <input
            id="telefono"
            type="tel"
            required
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="+56 9 XXXX XXXX"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-viflomax-azul focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-gray-400 text-xs">(opcional)</span>
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="juan@ejemplo.com"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-viflomax-azul focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="direccion" className="block text-sm font-medium text-gray-700 mb-1">
            Dirección <span className="text-red-500">*</span>
          </label>
          <input
            id="direccion"
            type="text"
            required
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            placeholder="Av. Ejemplo 123, Depto. 4"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-viflomax-azul focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="comuna" className="block text-sm font-medium text-gray-700 mb-1">
            Comuna <span className="text-red-500">*</span>
          </label>
          <select
            id="comuna"
            required
            value={comuna}
            onChange={(e) => setComuna(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-viflomax-azul focus:border-transparent bg-white"
          >
            <option value="">Selecciona una comuna</option>
            {COMUNAS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Productos */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-nunito font-bold text-gray-800 text-lg">Productos</h2>
        <p className="text-sm text-gray-500">
          Ingresa la cantidad que deseas de cada producto (0 = no lo necesitas).
        </p>

        <div className="divide-y divide-gray-100">
          {PRODUCTOS.map((producto) => (
            <div
              key={producto.nombre}
              className="flex items-center justify-between py-3"
            >
              <span className="flex items-center gap-2 text-gray-800 text-sm font-medium">
                <span aria-hidden="true">{producto.emoji}</span>
                {producto.nombre}
              </span>
              <input
                type="number"
                min={0}
                value={cantidades[producto.nombre] ?? 0}
                onChange={(e) => handleCantidad(producto.nombre, e.target.value)}
                className="w-20 border border-gray-300 rounded-lg px-3 py-1.5 text-center text-gray-900 focus:outline-none focus:ring-2 focus:ring-viflomax-azul focus:border-transparent"
                aria-label={`Cantidad de ${producto.nombre}`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Notas */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <label htmlFor="notas" className="block text-sm font-medium text-gray-700 mb-1">
          Notas adicionales <span className="text-gray-400 text-xs">(opcional)</span>
        </label>
        <textarea
          id="notas"
          rows={3}
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          placeholder="Indicaciones especiales de entrega, horario preferido, etc."
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-viflomax-azul focus:border-transparent resize-none"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-viflomax-verde hover:bg-viflomax-verde-claro disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-lg py-4 rounded-xl transition-colors duration-200 shadow-md"
      >
        {loading ? 'Enviando pedido...' : 'Enviar Pedido'}
      </button>
    </form>
  )
}
