'use client'

import React, { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import type { Chofer } from '@/lib/types'
import { crearChofer, editarChofer, toggleActivoChofer } from './actions'

// ─── Generador de contraseña temporal ────────────────────────────────────────
function generatePassword(): string {
  const upper = 'ABCDEFGHJKMNPQRSTUVWXYZ'
  const lower = 'abcdefghjkmnpqrstuvwxyz'
  const digits = '23456789'
  const all = upper + lower + digits
  const arr = Array.from(
    { length: 10 },
    () => all[Math.floor(Math.random() * all.length)]
  )
  // Garantizar al menos una mayúscula y un dígito
  arr[0] = upper[Math.floor(Math.random() * upper.length)]
  arr[1] = digits[Math.floor(Math.random() * digits.length)]
  return arr.sort(() => Math.random() - 0.5).join('')
}

// ─── Modal: Agregar chofer ────────────────────────────────────────────────────
function AgregarChoferModal({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [copied, setCopied] = useState(false)

  function handleOpen() {
    setPassword(generatePassword())
    setError(null)
    setCopied(false)
    setOpen(true)
  }

  function handleClose() {
    if (pending) return
    setOpen(false)
    setError(null)
  }

  function copyPassword() {
    navigator.clipboard.writeText(password).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    formData.set('password', password)

    startTransition(async () => {
      const result = await crearChofer(formData)
      if (result.error) {
        setError(result.error)
      } else {
        handleClose()
        onSuccess()
      }
    })
  }

  return (
    <>
      <Button variant="primary" size="sm" onClick={handleOpen}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Nuevo Chofer
      </Button>

      <Modal isOpen={open} onClose={handleClose} title="Agregar Chofer" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-sm font-outfit">
              {error}
            </div>
          )}

          <Input
            label="Nombre completo"
            name="nombre"
            required
            placeholder="Juan García Pérez"
            autoFocus
          />

          <Input
            label="Email (cuenta de acceso al sistema)"
            name="email"
            type="email"
            required
            placeholder="chofer@viflomax.cl"
            helperText="El chofer usará este email para ingresar desde su celular"
          />

          {/* Contraseña temporal con generador */}
          <div className="flex flex-col gap-1">
            <label className="font-medium text-sm text-gray-700 font-outfit">
              Contraseña temporal{' '}
              <span className="text-red-500 ml-0.5" aria-hidden="true">
                *
              </span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="flex-1 rounded-lg px-3 py-2 text-sm font-mono text-gray-900 bg-white outline-none ring-1 ring-gray-300 focus:ring-viflomax-azul transition-shadow min-w-0"
                aria-label="Contraseña temporal"
              />
              <button
                type="button"
                onClick={() => setPassword(generatePassword())}
                title="Generar nueva contraseña"
                className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 shrink-0"
              >
                ↺
              </button>
              <button
                type="button"
                onClick={copyPassword}
                title="Copiar contraseña"
                className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 shrink-0"
              >
                {copied ? '✓' : '⎘'}
              </button>
            </div>
            <p className="text-xs text-gray-500 font-outfit">
              Comunica esta contraseña al chofer. Podrá cambiarla desde su cuenta.
            </p>
          </div>

          <Input
            label="Teléfono"
            name="telefono"
            type="tel"
            placeholder="+56 9 1234 5678"
          />

          <Input
            label="Vehículo / Patente"
            name="vehiculo"
            placeholder="Toyota Hiace Blanca — ABC-123"
          />

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={handleClose}
              className="flex-1"
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={pending}
              className="flex-1"
            >
              Crear Chofer
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}

// ─── Modal: Editar chofer ─────────────────────────────────────────────────────
function EditarChoferModal({
  chofer,
  onSuccess,
}: {
  chofer: Chofer
  onSuccess: () => void
}) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleClose() {
    if (pending) return
    setOpen(false)
    setError(null)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await editarChofer(chofer.id, formData)
      if (result.error) {
        setError(result.error)
      } else {
        handleClose()
        onSuccess()
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null)
          setOpen(true)
        }}
        className="px-2.5 py-1 text-xs bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium font-outfit border border-gray-200"
      >
        Editar
      </button>

      <Modal
        isOpen={open}
        onClose={handleClose}
        title={`Editar — ${chofer.nombre}`}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-sm font-outfit">
              {error}
            </div>
          )}

          <Input
            label="Nombre completo"
            name="nombre"
            required
            defaultValue={chofer.nombre}
          />
          <Input
            label="Teléfono"
            name="telefono"
            type="tel"
            defaultValue={chofer.telefono ?? ''}
          />
          <Input
            label="Vehículo / Patente"
            name="vehiculo"
            defaultValue={chofer.vehiculo ?? ''}
          />

          <p className="text-xs text-gray-400 font-outfit">
            Para cambiar el email o contraseña, usa el panel de Supabase → Auth → Users.
          </p>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={handleClose}
              className="flex-1"
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={pending}
              className="flex-1"
            >
              Guardar Cambios
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}

// ─── Botón: Activar / Desactivar ──────────────────────────────────────────────
function ToggleActivoButton({
  chofer,
  onSuccess,
}: {
  chofer: Chofer
  onSuccess: () => void
}) {
  const [pending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      await toggleActivoChofer(chofer.id, chofer.activo)
      onSuccess()
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={[
        'px-2.5 py-1 text-xs rounded-lg transition-colors font-medium font-outfit border',
        chofer.activo
          ? 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200'
          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200',
        pending ? 'opacity-50 cursor-not-allowed' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {pending ? '…' : chofer.activo ? 'Desactivar' : 'Activar'}
    </button>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
export function ChoferesClient({ choferes }: { choferes: Chofer[] }) {
  const router = useRouter()

  function onSuccess() {
    router.refresh()
  }

  const activos = choferes.filter((c) => c.activo).length
  const inactivos = choferes.filter((c) => !c.activo).length

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-nunito text-2xl font-extrabold text-gray-900">Choferes</h2>
          <p className="text-sm font-outfit text-gray-500 mt-0.5">
            {choferes.length} chofer{choferes.length !== 1 ? 'es' : ''}
            {activos > 0 && (
              <span className="ml-2 text-emerald-600">
                · {activos} activo{activos !== 1 ? 's' : ''}
              </span>
            )}
            {inactivos > 0 && (
              <span className="ml-1 text-gray-400">
                · {inactivos} inactivo{inactivos !== 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
        <AgregarChoferModal onSuccess={onSuccess} />
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {choferes.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <p className="text-gray-500 font-outfit text-sm mb-1">
              No hay choferes registrados.
            </p>
            <p className="text-gray-400 font-outfit text-xs">
              Usa el botón &quot;Nuevo Chofer&quot; para agregar el primero.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-outfit">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Teléfono
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Vehículo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {choferes.map((chofer) => (
                  <tr
                    key={chofer.id}
                    className={[
                      'transition-colors',
                      chofer.activo ? 'hover:bg-blue-50' : 'opacity-60 hover:bg-gray-50',
                    ].join(' ')}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {chofer.nombre}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {chofer.telefono ? (
                        <a
                          href={`tel:${chofer.telefono}`}
                          className="hover:text-viflomax-azul hover:underline"
                        >
                          {chofer.telefono}
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {chofer.vehiculo ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      {chofer.activo ? (
                        <Badge variant="success" size="sm">
                          Activo
                        </Badge>
                      ) : (
                        <Badge variant="error" size="sm">
                          Inactivo
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <EditarChoferModal chofer={chofer} onSuccess={onSuccess} />
                        <ToggleActivoButton chofer={chofer} onSuccess={onSuccess} />
                        <Link
                          href={`/admin/pedidos?chofer=${chofer.id}`}
                          className="px-2.5 py-1 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium border border-blue-100"
                        >
                          Ver entregas
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
