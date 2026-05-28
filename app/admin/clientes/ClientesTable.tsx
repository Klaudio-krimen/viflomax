'use client'

import React, { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { EliminarButton } from '@/components/ui/EliminarButton'
import type { ClienteConEmpresa } from '@/lib/types'

const TIPO_BADGE: Record<string, { variant: 'success' | 'info' | 'default'; label: string }> = {
  mayorista: { variant: 'success', label: 'Mayorista' },
  detalle: { variant: 'info', label: 'Detalle' },
  nuevo: { variant: 'default', label: 'Nuevo' },
}

const TIPOS = [
  { value: 'nuevo', label: 'Nuevo' },
  { value: 'detalle', label: 'Detalle' },
  { value: 'mayorista', label: 'Mayorista' },
]

function EditarClienteModal({
  cliente,
  onSuccess,
}: {
  cliente: ClienteConEmpresa
  onSuccess: () => void
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [nombre, setNombre] = useState(cliente.nombre)
  const [telefono, setTelefono] = useState(cliente.telefono ?? '')
  const [email, setEmail] = useState(cliente.email ?? '')
  const [direccion, setDireccion] = useState(cliente.direccion ?? '')
  const [sector, setSector] = useState(cliente.sector ?? '')
  const [tipo, setTipo] = useState(cliente.tipo_cliente)

  function handleOpen() {
    setNombre(cliente.nombre)
    setTelefono(cliente.telefono ?? '')
    setEmail(cliente.email ?? '')
    setDireccion(cliente.direccion ?? '')
    setSector(cliente.sector ?? '')
    setTipo(cliente.tipo_cliente)
    setError(null)
    setOpen(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) { setError('El nombre es obligatorio'); return }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/clientes/${cliente.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre.trim(),
          telefono: telefono.trim() || null,
          email: email.trim() || null,
          direccion: direccion.trim() || null,
          sector: sector.trim() || null,
          tipo_cliente: tipo,
        }),
      })
      const json = await res.json() as { error?: string }
      if (!res.ok) throw new Error(json.error ?? 'Error al guardar')
      setOpen(false)
      onSuccess()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="px-2.5 py-1 text-xs bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium font-outfit border border-gray-200"
      >
        Editar
      </button>

      <Modal isOpen={open} onClose={() => setOpen(false)} title={`Editar — ${cliente.nombre}`} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg px-3 py-2 text-sm font-outfit">
              {error}
            </div>
          )}
          <Input label="Nombre *" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Input label="Dirección" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
          <Input label="Sector" value={sector} onChange={(e) => setSector(e.target.value)} placeholder="ej: sur, norte…" />

          <div className="flex flex-col gap-1.5">
            <label className="font-medium text-sm text-gray-700 font-outfit">Tipo de cliente</label>
            <div className="grid grid-cols-3 gap-2">
              {TIPOS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTipo(t.value)}
                  className={`py-2 px-3 rounded-lg border text-sm font-outfit font-medium transition-colors ${
                    tipo === t.value
                      ? 'bg-viflomax-azul text-white border-viflomax-azul'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={loading}>
              Guardar Cambios
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}

export function ClientesTable({ clientes }: { clientes: ClienteConEmpresa[] }) {
  const router = useRouter()

  if (clientes.length === 0) return null

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm font-outfit">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Nombre</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Teléfono</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Tipo</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Sector</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Empresa</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {clientes.map((cliente) => {
            const tipoBadge = TIPO_BADGE[cliente.tipo_cliente] ?? TIPO_BADGE.nuevo
            return (
              <tr key={cliente.id} className="hover:bg-blue-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">{cliente.nombre}</td>
                <td className="px-4 py-3 text-gray-500">{cliente.telefono ?? '—'}</td>
                <td className="px-4 py-3">
                  <Badge variant={tipoBadge.variant} size="sm">{tipoBadge.label}</Badge>
                </td>
                <td className="px-4 py-3 text-gray-500">{cliente.sector ?? '—'}</td>
                <td className="px-4 py-3 text-gray-500">{cliente.empresa?.razon_social ?? '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <EditarClienteModal cliente={cliente} onSuccess={() => router.refresh()} />
                    <EliminarButton
                      url={`/api/clientes/${cliente.id}`}
                      confirmar={`¿Eliminar a ${cliente.nombre}? Esta acción no se puede deshacer.`}
                    />
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
