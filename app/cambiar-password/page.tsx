import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { CambiarPasswordForm } from './CambiarPasswordForm'

export default async function CambiarPasswordPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  return (
    <div className="min-h-screen bg-gradient-to-br from-viflomax-azul-oscuro to-viflomax-azul flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="font-nunito text-3xl font-extrabold text-viflomax-azul-oscuro mb-1">
            Cambiar <span className="text-viflomax-verde">contraseña</span>
          </h1>
          {session.user.mustChangePassword ? (
            <p className="text-gray-500 text-sm">
              Tu contraseña fue generada por un administrador. Debes reemplazarla antes de
              seguir.
            </p>
          ) : (
            <p className="text-gray-500 text-sm">Actualiza la contraseña de tu cuenta.</p>
          )}
        </div>

        <CambiarPasswordForm
          forzado={!!session.user.mustChangePassword}
          rol={session.user.role}
        />
      </div>
    </div>
  )
}
