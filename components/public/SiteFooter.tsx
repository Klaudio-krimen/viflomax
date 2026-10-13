import Link from 'next/link'
import { ZONA, HORARIO, TELEFONO_LEGIBLE, TELEFONO_HREF, TIENE_WHATSAPP } from '@/lib/contacto'

export function SiteFooter() {
  return (
    <footer className="bg-viflomax-azul-800 text-white py-10">
      <div className="max-w-6xl mx-auto px-6 flex flex-wrap items-center md:items-start justify-between gap-6">
        <div>
          <p className="font-nunito font-extrabold text-xl mb-1">Agua Viflomax</p>
          <p className="text-white/85 text-sm">{ZONA}</p>
          {TIENE_WHATSAPP && (
            <a
              href={TELEFONO_HREF}
              className="text-white/85 text-sm mt-1 block hover:text-white hover:underline"
            >
              {TELEFONO_LEGIBLE}
            </a>
          )}
          <p className="text-white/85 text-sm mt-1">{HORARIO}</p>
          <Link href="/contacto" className="mt-2 inline-flex min-h-11 items-center rounded text-sm underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Contacto y cobertura</Link>
        </div>
        <div className="text-white/70 text-xs text-center md:text-right">
          <p>© {new Date().getFullYear()} Agua Viflomax. Todos los derechos reservados.</p>
          <Link
            href="/login"
            className="text-white/70 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-white rounded"
          >
            Acceso Staff
          </Link>
        </div>
      </div>
    </footer>
  )
}
