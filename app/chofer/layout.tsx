import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CerrarSesionBtn } from '@/components/chofer/CerrarSesionBtn'
import Link from 'next/link'

export default async function ChoferLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const rol = user.app_metadata?.role as string | undefined
  if (rol !== 'chofer' && rol !== 'admin') {
    redirect('/login')
  }

  // Obtener nombre del chofer si existe chofer_id
  const choferIdMeta = user.app_metadata?.chofer_id as string | undefined
  let nombreChofer: string = user.email ?? 'Chofer'

  if (choferIdMeta) {
    const { data: chofer } = await supabase
      .from('choferes')
      .select('nombre')
      .eq('id', choferIdMeta)
      .single()
    if (chofer?.nombre) nombreChofer = chofer.nombre
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Barra superior */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/chofer" className="flex items-center gap-2">
            <span className="font-nunito font-extrabold text-lg text-viflomax-azul-oscuro leading-none">
              Viflomax{' '}
              <span className="text-viflomax-verde">Entregas</span>
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
      <main className="max-w-lg mx-auto px-4 py-5">
        {children}
      </main>
    </div>
  )
}
