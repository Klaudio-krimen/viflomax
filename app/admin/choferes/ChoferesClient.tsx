'use client'

import React, { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import type { Chofer } from '@/lib/types'
import {
  crearChofer,
  editarChofer,
  toggleActivoChofer,
  eliminarChofer,
  resetPasswordChofer,
} from './actions'

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

// ─── Campo de contraseña con generador y copiado ─────────────────────────────
function CampoPasswordGenerada({
  value,
  onChange,
  label,
  helperText,
  id,
}: {
  value: string
  onChange: (value: string) => void
  label: string
  helperText: string
  id: string
}) {
  const [copied, setCopied] = useState(false)

  function copyPassword() {
    navigator.clipboard.writeText(value).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="font-medium text-sm text-gray-700 font-outfit">
        {label}{' '}
        <span className="text-red-500 ml-0.5" aria-hidden="true">
          *
        </span>
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          className="flex-1 rounded-lg px-3 py-2 text-sm font-mono text-gray-900 bg-white outline-none ring-1 ring-gray-300 focus:ring-viflomax-azul transition-shadow min-w-0"
        />
        <button
          type="button"
          onClick={() => onChange(generatePassword())}
          title="Generar nueva contraseña"
          aria-label="Generar nueva contraseña"
          className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 shrink-0"
        >
          ↺
        </button>
        <button
          type="button"
          onClick={copyPassword}
          title="Copiar contraseña"
          aria-label="Copiar contraseña"
          className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 shrink-0"
        >
          {copied ? '✓' : '⎘'}
        </button>
      </div>
      <p className="text-xs text-gray-500 font-outfit">{helperText}</p>
    </div>
  )
}

// ─── Modal: Agregar chofer ────────────────────────────────────────────────────
function AgregarChoferModal({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [password, setPassword] = useState('')

  function handleOpen() {
    setPassword(generatePassword())
    setError(null)
    setOpen(true)
  }

  function handleClose() {
    if (pending) return
    setOpen(false)
    setError(null)
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

          <CampoPasswordGenerada
            id="nuevo-chofer-password"
            label="Contraseña temporal"
            value={password}
            onChange={setPassword}
            helperText="Comunica esta contraseña al chofer para su primer ingreso."
          />

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

// ─── Sección: Restablecer contraseña (dentro del modal de edición) ───────────
function ResetPasswordSection({ chofer }: { chofer: Chofer }) {
  const [abierto, setAbierto] = useState(false)
  const [password, setPassword] = useState('')
  const [guardada, setGuardada] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (!chofer.user_id) {
    return (
      <p className="text-sm font-outfit text-gray-500">
        Este chofer no tiene cuenta de acceso al sistema, así que no hay contraseña que
        restablecer.
      </p>
    )
  }

  function abrir() {
    setPassword(generatePassword())
    setError(null)
    setGuardada(false)
    setAbierto(true)
  }

  function guardar() {
    setError(null)
    startTransition(async () => {
      const result = await resetPasswordChofer(chofer.id, password)
      if (result.error) setError(result.error)
      else setGuardada(true)
    })
  }

  if (!abierto) {
    return (
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-700 font-outfit">Contraseña de acceso</p>
          <p className="text-xs text-gray-500 font-outfit mt-0.5">
            Si el chofer la olvidó, genera una nueva y comunícasela.
          </p>
        </div>
        <button
          type="button"
          onClick={abrir}
          className="px-3 py-1.5 text-xs bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium font-outfit border border-gray-200 shrink-0"
        >
          Restablecer
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-sm font-outfit">
          {error}
        </div>
      )}

      {guardada && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg p-3 text-sm font-outfit">
          Contraseña actualizada. Cópiala y comunícasela al chofer — no se podrá ver de nuevo
          después de cerrar esta ventana.
        </div>
      )}

      <CampoPasswordGenerada
        id={`reset-password-${chofer.id}`}
        label="Nueva contraseña"
        value={password}
        onChange={(v) => {
          setPassword(v)
          setGuardada(false)
        }}
        helperText="La contraseña anterior deja de funcionar apenas guardes."
      />

      <div className="flex gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setAbierto(false)}
          className="flex-1"
          disabled={pending}
        >
          {guardada ? 'Listo' : 'Cancelar'}
        </Button>
        <Button
          type="button"
          variant="danger"
          size="sm"
          className="flex-1"
          loading={pending}
          disabled={password.length < 6 || guardada}
          disabledReason={
            password.length < 6 ? 'La contraseña debe tener al menos 6 caracteres' : undefined
          }
          onClick={guardar}
        >
          {guardada ? 'Guardada' : 'Guardar contraseña'}
        </Button>
      </div>
    </div>
  )
}

// ─── Modal: Editar chofer ─────────────────────────────────────────────────────
function EditarChoferModal({
  chofer,
  onSuccess,
}: {
  chofer: Chofer & { email: string | null }
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
            label="Email (cuenta de acceso)"
            value={chofer.email ?? 'Sin cuenta de acceso vinculada'}
            readOnly
            disabled
            helperText="Es el correo con el que inicia sesión. No se puede cambiar desde aquí."
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

        <div className="mt-5 pt-5 border-t border-gray-200">
          <ResetPasswordSection chofer={chofer} />
        </div>
      </Modal>
    </>
  )
}

// ─── Botón: Eliminar chofer ───────────────────────────────────────────────────
type ChoferConHistorial = Chofer & {
  tieneHistorial: boolean
  entregasCount: number
  turnosCount: number
  email: string | null
}

function EliminarChoferButton({
  chofer,
  onSuccess,
}: {
  chofer: ChoferConHistorial
  onSuccess: () => void
}) {
  const [pending, startTransition] = useTransition()

  function handleClick() {
    if (
      !window.confirm(
        `¿Eliminar a ${chofer.nombre}? Se eliminará también su cuenta de acceso. Esta acción no se puede deshacer.`
      )
    )
      return
    startTransition(async () => {
      const result = await eliminarChofer(chofer.id)
      if (result.error) {
        window.alert(result.error)
      } else {
        onSuccess()
      }
    })
  }

  if (chofer.tieneHistorial) {
    return <EliminarChoferForzadoButton chofer={chofer} onSuccess={onSuccess} />
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="px-2.5 py-1 text-xs bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium font-outfit border border-red-200 disabled:opacity-50"
    >
      {pending ? '…' : 'Eliminar'}
    </button>
  )
}

// ─── Botón + modal: Eliminar chofer CON historial (fuerza cascada) ───────────
function EliminarChoferForzadoButton({
  chofer,
  onSuccess,
}: {
  chofer: ChoferConHistorial
  onSuccess: () => void
}) {
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const partes: string[] = []
  if (chofer.turnosCount > 0) partes.push(`${chofer.turnosCount} turno${chofer.turnosCount !== 1 ? 's' : ''}`)
  if (chofer.entregasCount > 0)
    partes.push(`${chofer.entregasCount} entrega${chofer.entregasCount !== 1 ? 's' : ''}`)
  const resumenHistorial = partes.join(' y ')

  function handleClose() {
    if (pending) return
    setOpen(false)
    setConfirmText('')
    setError(null)
  }

  function handleConfirmar() {
    setError(null)
    startTransition(async () => {
      const result = await eliminarChofer(chofer.id, true)
      if (result.error) {
        setError(result.error)
      } else {
        setOpen(false)
        setConfirmText('')
        onSuccess()
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Este chofer tiene entregas o turnos registrados. Eliminar borrará también ese historial."
        className="px-2.5 py-1 text-xs bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors font-medium font-outfit border border-amber-200"
      >
        Eliminar de todas formas
      </button>

      <Modal isOpen={open} onClose={handleClose} title={`Eliminar a ${chofer.nombre}`} size="md">
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-sm font-outfit space-y-1.5">
            <p className="font-semibold">Esta acción es irreversible.</p>
            <p>
              Este chofer tiene {resumenHistorial} registrados. Al continuar se eliminarán
              permanentemente esos turnos y entregas. Los pedidos vinculados a este chofer NO se
              borran, pero quedarán sin chofer asignado.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-sm font-outfit">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 font-outfit">
              Escribe <span className="font-semibold">{chofer.nombre}</span> para confirmar
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoFocus
              className="rounded-lg px-3 py-2 text-sm text-gray-900 bg-white outline-none ring-1 ring-gray-300 focus:ring-red-500 transition-shadow"
            />
          </div>

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
              type="button"
              variant="danger"
              size="md"
              className="flex-1"
              loading={pending}
              disabled={confirmText !== chofer.nombre}
              disabledReason={
                confirmText !== chofer.nombre
                  ? 'Escribe el nombre exacto del chofer para habilitar este botón'
                  : undefined
              }
              onClick={handleConfirmar}
            >
              Eliminar definitivamente
            </Button>
          </div>
        </div>
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
export function ChoferesClient({
  choferes,
}: {
  choferes: ChoferConHistorial[]
}) {
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
                        <EliminarChoferButton chofer={chofer} onSuccess={onSuccess} />
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
