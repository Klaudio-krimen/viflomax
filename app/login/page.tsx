'use client'

import { useState, useEffect, FormEvent } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { PasswordInput } from '@/components/ui/PasswordInput'

const CORREO_RECORDADO_KEY = 'viflomax_correo_recordado'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [recordarCorreo, setRecordarCorreo] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Precargar el correo recordado. Nunca se guarda la contraseña: de eso se
  // encarga el gestor del propio teléfono, que la cifra con el sistema.
  useEffect(() => {
    try {
      const guardado = localStorage.getItem(CORREO_RECORDADO_KEY)
      if (guardado) {
        setEmail(guardado)
        setRecordarCorreo(true)
      }
    } catch {
      // Modo privado o almacenamiento bloqueado: seguir sin precargar.
    }
  }, [])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const correoNormalizado = email.trim().toLowerCase()

    try {
      const result = await signIn('credentials', {
        email: correoNormalizado,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Credenciales incorrectas. Verifica tu email y contraseña.')
        return
      }

      try {
        if (recordarCorreo) localStorage.setItem(CORREO_RECORDADO_KEY, correoNormalizado)
        else localStorage.removeItem(CORREO_RECORDADO_KEY)
      } catch {
        // El login ya fue exitoso: no dejar que el almacenamiento lo rompa.
      }

      // Leer el rol desde la sesión para redirigir correctamente
      const sessionRes = await fetch('/api/auth/session')
      const session = await sessionRes.json()
      const rol = session?.user?.role as string | undefined

      if (rol === 'admin') {
        router.push('/admin/dashboard')
      } else if (rol === 'visor') {
        router.push('/admin/pedidos')
      } else if (rol === 'chofer') {
        router.push('/chofer')
      } else {
        router.push('/')
      }
    } catch {
      setError('Error inesperado. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-viflomax-azul-oscuro to-viflomax-azul flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <h1 className="font-nunito text-3xl font-extrabold text-viflomax-azul-oscuro mb-1">
            Agua <span className="text-viflomax-verde">Viflomax</span>
          </h1>
          <p className="text-gray-500 text-sm">Acceso al sistema interno</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-3 text-sm">
              {error}
            </div>
          )}

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="username"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@viflomax.cl"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-viflomax-azul focus:border-transparent"
            />
          </div>

          {/* Password */}
          <PasswordInput
            id="password"
            name="password"
            label="Contraseña"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          {/* Recordar correo — 44px de alto para uso en terreno */}
          <label
            htmlFor="recordar-correo"
            className="flex items-center gap-3 min-h-[44px] cursor-pointer select-none"
          >
            <input
              id="recordar-correo"
              name="recordar-correo"
              type="checkbox"
              checked={recordarCorreo}
              onChange={(e) => setRecordarCorreo(e.target.checked)}
              className="h-5 w-5 rounded border-gray-300 text-viflomax-verde-700 focus:ring-2 focus:ring-viflomax-azul"
            />
            <span className="text-sm text-gray-700">Recordar mi correo en este dispositivo</span>
          </label>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-viflomax-verde hover:bg-viflomax-verde-claro disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-base py-3 rounded-xl transition-colors duration-200 mt-2"
          >
            {loading ? 'Iniciando sesión…' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  )
}
