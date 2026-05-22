import Link from 'next/link'
import { WhatsAppFloat } from '@/components/public/WhatsAppFloat'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? ''
  const telefono = waNumber ? `+${waNumber}` : 'N/A'

  return (
    <>
      {/* Navbar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="font-nunito font-extrabold text-xl text-viflomax-azul-oscuro">
              Agua{' '}
              <span className="text-viflomax-verde">Viflomax</span>
            </span>
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-700">
            <Link href="/" className="hover:text-viflomax-azul-oscuro transition-colors">
              Inicio
            </Link>
            <Link href="/pedir" className="hover:text-viflomax-azul-oscuro transition-colors">
              Pedir Agua
            </Link>
            <Link href="/contacto" className="hover:text-viflomax-azul-oscuro transition-colors">
              Contacto
            </Link>
          </div>

          {/* CTA button */}
          <Link
            href="/pedir"
            className="bg-viflomax-verde hover:bg-viflomax-verde-claro text-white font-bold text-sm px-5 py-2 rounded-lg transition-colors duration-200"
          >
            Pedir Ahora
          </Link>
        </nav>
      </header>

      {/* Page content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-viflomax-azul-oscuro text-white py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          <div>
            <p className="font-nunito font-extrabold text-xl mb-1">Agua Viflomax</p>
            <p className="text-white/70 text-sm">Maipú, Región Metropolitana</p>
            <p className="text-white/70 text-sm mt-1">{telefono}</p>
          </div>
          <div className="text-white/50 text-xs text-center md:text-right">
            <p>© {new Date().getFullYear()} Agua Viflomax. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>

      {/* WhatsApp floating button */}
      <WhatsAppFloat />
    </>
  )
}
