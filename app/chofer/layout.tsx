import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { CerrarSesionBtn } from '@/components/chofer/CerrarSesionBtn'
import UbicacionTracker from '@/components/chofer/UbicacionTracker'
import Link from 'next/link'

export default async function ChoferLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const rol = session.user.role
  if (rol !== 'chofer' && rol !== 'admin') {
    redirect('/login')
  }

  // Obtener nombre del chofer vinculado al usuario
  let nombreChofer: string = session.user.email ?? 'Chofer'

  const chofer = await db.chofer.findUnique({
    where: { user_id: session.user.id },
    select: { nombre: true },
  })
  if (chofer?.nombre) nombreChofer = chofer.nombre

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Barra superior */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/chofer" className="flex items-center gap-2">
            <span className="font-nunito font-extrabold text-lg text-viflomax-azul-oscuro leading-none">
              Viflomax <span className="text-viflomax-verde">Entregas</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-sm font-outfit text-gray-600 hidden sm:block truncate max-w-[120px]">
              {nombreChofer}
            </span>
            <Link
              href="/cambiar-password"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-outfit text-gray-700 hover:bg-gray-100 transition-colors min-h-[44px]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 11-12 0 6 6 0 0112 0zM3 21l4.5-4.5"
                />
              </svg>
              <span className="hidden sm:inline">Contraseña</span>
            </Link>
            <CerrarSesionBtn />
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="max-w-lg mx-auto px-4 py-5">{children}</main>

      <UbicacionTracker />
    </div>
  )
}
