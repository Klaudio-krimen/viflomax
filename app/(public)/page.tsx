import { Hero } from '@/components/public/Hero'
import { ProductGrid } from '@/components/public/ProductGrid'
import { PorQueElegirnos } from '@/components/public/PorQueElegirnos'
import { Cobertura } from '@/components/public/Cobertura'
import { PedidoForm } from '@/components/public/PedidoForm'
import { PedidoProvider } from '@/components/public/PedidoProvider'

export default function HomePage() {
  return (
    <>
      <Hero />

      {/* PorQueElegirnos y Cobertura se pasan como children de un Client
          Component: siguen renderizando en el servidor, con cero JS propio. */}
      <PedidoProvider>
        <ProductGrid />
        <PorQueElegirnos />
        <Cobertura />
        <section id="pedido" className="scroll-mt-32 py-16 bg-white">
          <PedidoForm />
        </section>
      </PedidoProvider>
    </>
  )
}
