import Image from 'next/image'
import Link from 'next/link'
import { TELEFONO_LEGIBLE, TELEFONO_HREF, TIENE_WHATSAPP, HORARIO, linkWhatsApp } from '@/lib/contacto'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30">
      {TIENE_WHATSAPP && (
        <div className="bg-viflomax-azul-800 text-xs text-white sm:text-sm">
          <div className="mx-auto flex max-w-6xl items-center justify-center gap-5 px-6 py-2 sm:justify-between">
            <span className="hidden text-white/85 sm:inline">{HORARIO}</span>
            <a href={TELEFONO_HREF} className="rounded font-semibold hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">{TELEFONO_LEGIBLE}</a>
            <a href={linkWhatsApp()} target="_blank" rel="noopener noreferrer" className="rounded font-semibold underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:hidden">WhatsApp</a>
          </div>
        </div>
      )}
      <div className="border-b border-gray-100 bg-white/95 backdrop-blur-sm">
        <nav aria-label="Principal" className="mx-auto flex min-h-[76px] max-w-6xl items-center justify-between gap-3 px-6 py-3">
          <Link href="/" className="flex shrink-0 items-center gap-2 rounded focus-visible:ring-2 focus-visible:ring-viflomax-azul-700">
            <Image src="/logo.png" alt="" width={900} height={694} sizes="(max-width: 767px) 36px, 64px" className="h-auto w-9 max-[360px]:hidden md:w-16" />
            <span className="font-nunito text-base font-extrabold text-viflomax-azul-800 md:text-xl">Agua <span className="text-viflomax-verde-700">Viflomax</span></span>
          </Link>
          <div className="flex items-center gap-6 text-sm">
            <a href="/#productos" className="hidden rounded font-medium text-gray-700 hover:text-viflomax-azul-800 focus-visible:ring-2 focus-visible:ring-viflomax-azul-700 md:inline">Productos</a>
            <Link href="/contacto" className="hidden rounded font-medium text-gray-700 hover:text-viflomax-azul-800 focus-visible:ring-2 focus-visible:ring-viflomax-azul-700 md:inline">Contacto</Link>
            <a href="/#pedido" className="inline-flex min-h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-viflomax-verde-700 px-4 py-2 text-xs font-bold text-white hover:bg-viflomax-verde-800 focus-visible:ring-2 focus-visible:ring-viflomax-azul-700 md:px-6 md:text-sm">Pedir ahora</a>
          </div>
        </nav>
      </div>
    </header>
  )
}
