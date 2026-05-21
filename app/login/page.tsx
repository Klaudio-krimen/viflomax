'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (authError || !data.user) {
        setError('Credenciales incorrectas. Verifica tu email y contraseña.')
        return
      }

      const rol = data.user.app_metadata?.role as string | undefined

      if (rol === 'admin') {
        router.push('/admin/dashboard')
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
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@viflomax.cl"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-viflomax-azul focus:border-transparent"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-viflomax-azul focus:border-transparent"
            />
          </div>

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
