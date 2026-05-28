import type { Metadata } from 'next'
import { Nunito, Outfit } from 'next/font/google'
import { SessionProvider } from '@/components/providers/SessionProvider'
import './globals.css'

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  display: 'swap',
})

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Agua Viflomax — Agua Purificada a Domicilio en Maipú',
  description:
    'Distribución de agua purificada a domicilio en Maipú. Envases 20L, 10L, recargas y dispensadores. Pedidos rápidos vía web o WhatsApp.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body
        className={`${nunito.variable} ${outfit.variable} font-outfit antialiased`}
      >
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  )
}
