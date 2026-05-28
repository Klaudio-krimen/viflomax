import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { CerrarSesionBtn } from '@/components/chofer/CerrarSesionBtn'
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
            <CerrarSesionBtn />
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="max-w-lg mx-auto px-4 py-5">{children}</main>
    </div>
  )
}
