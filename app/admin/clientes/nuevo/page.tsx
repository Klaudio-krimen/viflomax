'use client'

import React, { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

type TipoCliente = 'nuevo' | 'detalle' | 'mayorista'

export default function NuevoClientePage() {
  const router = useRouter()

  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [direccion, setDireccion] = useState('')
  const [comuna, setComuna] = useState('')
  const [sector, setSector] = useState('')
  const [tipoCliente, setTipoCliente] = useState<TipoCliente>('nuevo')
  const [notas, setNotas] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (!nombre.trim()) {
      setError('El nombre del cliente es obligatorio')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre.trim(),
          telefono: telefono.trim() || undefined,
          email: email.trim() || undefined,
          direccion: direccion.trim() || undefined,
          comuna: comuna.trim() || undefined,
          sector: sector.trim() || undefined,
          tipo_cliente: tipoCliente,
          notas: notas.trim() || undefined,
        }),
      })

      const json = await res.json() as { error?: string }
      if (!res.ok) {
        throw new Error(json.error ?? 'Error al crear cliente')
      }

      router.push('/admin/clientes')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      {/* Encabezado */}
      <div className="mb-6">
        <Link
          href="/admin/clientes"
          className="text-sm font-outfit text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← Volver a clientes
        </Link>
        <h2 className="font-nunito text-2xl font-extrabold text-gray-900 mt-1">Nuevo Cliente</h2>
        <p className="text-sm font-outfit text-gray-500 mt-0.5">
          Registra un nuevo cliente en el sistema
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-5"
        noValidate
      >
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg px-4 py-2.5 text-sm font-outfit">
            {error}
          </div>
        )}

        {/* Nombre */}
        <Input
          label="Nombre *"
          id="nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre completo o razón social"
          required
        />

        {/* Teléfono y Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Teléfono"
            id="telefono"
            type="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="+56 9 1234 5678"
          />
          <Input
            label="Email"
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="cliente@email.com"
          />
        </div>

        {/* Dirección */}
        <Input
          label="Dirección"
          id="direccion"
          value={direccion}
          onChange={(e) => setDireccion(e.target.value)}
          placeholder="Av. Pajaritos 1234"
        />

        {/* Comuna y Sector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Comuna"
            id="comuna"
            value={comuna}
            onChange={(e) => setComuna(e.target.value)}
            placeholder="Maipú"
          />
          <Input
            label="Sector"
            id="sector"
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            placeholder="Villa Las Américas"
          />
        </div>

        {/* Tipo de cliente */}
        <div className="flex flex-col gap-1.5">
          <label className="font-medium text-sm text-gray-700 font-outfit">
            Tipo de cliente
          </label>
          <div className="flex gap-3">
            {(['nuevo', 'detalle', 'mayorista'] as TipoCliente[]).map((tipo) => (
              <button
                key={tipo}
                type="button"
                onClick={() => setTipoCliente(tipo)}
                className={`flex-1 py-2 px-3 rounded-lg border text-sm font-outfit font-medium capitalize transition-colors ${
                  tipoCliente === tipo
                    ? 'bg-viflomax-azul text-white border-viflomax-azul'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                }`}
              >
                {tipo === 'nuevo' ? 'Nuevo' : tipo === 'detalle' ? 'Detalle' : 'Mayorista'}
              </button>
            ))}
          </div>
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
            placeholder="Observaciones, instrucciones de entrega, referencias…"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-outfit text-gray-900 focus:outline-none focus:ring-2 focus:ring-viflomax-azul resize-none"
          />
        </div>

        {/* Acciones */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-outfit text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <Button type="submit" variant="primary" loading={loading}>
            Guardar Cliente
          </Button>
        </div>
      </form>
    </div>
  )
}
