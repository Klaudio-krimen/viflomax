'use client'

import React, { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'

export function NuevaEmpresaButton() {
  const [modalOpen, setModalOpen] = useState(false)
  const router = useRouter()

  const [razonSocial, setRazonSocial] = useState('')
  const [rut, setRut] = useState('')
  const [contacto, setContacto] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resetForm = () => {
    setRazonSocial('')
    setRut('')
    setContacto('')
    setTelefono('')
    setEmail('')
    setError(null)
  }

  const handleClose = () => {
    setModalOpen(false)
    resetForm()
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (!razonSocial.trim()) {
      setError('La razón social es obligatoria')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/empresas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razon_social: razonSocial.trim(),
          rut: rut.trim() || undefined,
          contacto: contacto.trim() || undefined,
          telefono: telefono.trim() || undefined,
          email: email.trim() || undefined,
        }),
      })

      const json = await res.json() as { error?: string }
      if (!res.ok) throw new Error(json.error ?? 'Error al crear empresa')

      handleClose()
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button variant="primary" size="sm" onClick={() => setModalOpen(true)}>
        + Nueva Empresa
      </Button>

      <Modal
        isOpen={modalOpen}
        onClose={handleClose}
        title="Nueva Empresa Mayorista"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg px-4 py-2.5 text-sm font-outfit">
              {error}
            </div>
          )}

          <Input
            label="Razón Social"
            id="emp-razon"
            required
            value={razonSocial}
            onChange={(e) => setRazonSocial(e.target.value)}
            placeholder="ej: Distribuidora Sur Ltda."
          />

          <Input
            label="RUT"
            id="emp-rut"
            value={rut}
            onChange={(e) => setRut(e.target.value)}
            placeholder="ej: 76.123.456-7"
            helperText="Opcional"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Contacto"
              id="emp-contacto"
              value={contacto}
              onChange={(e) => setContacto(e.target.value)}
              placeholder="Nombre contacto"
            />
            <Input
              label="Teléfono"
              id="emp-telefono"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="+56 9 1234 5678"
            />
          </div>

          <Input
            label="Email"
            id="emp-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="contacto@empresa.cl"
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={handleClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={loading}>
              Crear Empresa
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
