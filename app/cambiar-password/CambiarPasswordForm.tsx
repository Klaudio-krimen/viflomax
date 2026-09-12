'use client'

import { useState, useTransition, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Button } from '@/components/ui/Button'
import { cambiarPassword } from './actions'

const RUTA_POR_ROL: Record<string, string> = {
  admin: '/admin/dashboard',
  visor: '/admin/pedidos',
  chofer: '/chofer',
}

type CambiarPasswordFormProps = {
  forzado: boolean
  rol: string
}

export function CambiarPasswordForm({ forzado, rol }: CambiarPasswordFormProps) {
  const router = useRouter()
  const [actual, setActual] = useState('')
  const [nueva, setNueva] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (nueva.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres')
      return
    }
    if (nueva !== confirmar) {
      setError('Las contraseñas no coinciden')
      return
    }

    startTransition(async () => {
      const result = await cambiarPassword(actual, nueva)
      if (result.error) {
        setError(result.error)
        return
      }
      router.push(RUTA_POR_ROL[rol] ?? '/chofer')
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {forzado && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 text-sm">
          No podrás usar el sistema hasta que definas una contraseña nueva.
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-3 text-sm">
          {error}
        </div>
      )}

      <PasswordInput
        id="actual"
        label="Contraseña actual"
        required
        autoComplete="current-password"
        value={actual}
        onChange={(e) => setActual(e.target.value)}
      />

      <PasswordInput
        id="nueva"
        label="Contraseña nueva"
        required
        autoComplete="new-password"
        value={nueva}
        onChange={(e) => setNueva(e.target.value)}
        helperText="Al menos 6 caracteres."
      />

      <PasswordInput
        id="confirmar"
        label="Confirmar contraseña nueva"
        required
        autoComplete="new-password"
        value={confirmar}
        onChange={(e) => setConfirmar(e.target.value)}
      />

      <Button type="submit" loading={pending} className="w-full mt-2">
        Guardar contraseña
      </Button>
    </form>
  )
}
