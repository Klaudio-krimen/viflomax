import { Suspense } from 'react'
import { OrderForm } from '@/components/public/OrderForm'

export const metadata = {
  title: 'Hacer un Pedido — Agua Viflomax',
  description: 'Pide agua purificada a domicilio en Maipú. Completa el formulario y te contactamos.',
}

export default function PedirPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="font-nunito text-3xl font-bold text-gray-900 mb-2">
          Hacer un Pedido
        </h1>
        <p className="text-gray-600 mb-8">
          Completa el formulario y te contactamos para confirmar.
        </p>
        <Suspense fallback={<div className="text-gray-500 text-sm">Cargando formulario…</div>}>
          <OrderForm />
        </Suspense>
      </div>
    </main>
  )
}
