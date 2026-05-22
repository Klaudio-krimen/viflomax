import Link from 'next/link'
import { Hero } from '@/components/public/Hero'
import { ProductGrid } from '@/components/public/ProductGrid'

export default function HomePage() {
  return (
    <>
      {/* 1. Hero */}
      <Hero />

      {/* 2. Product grid */}
      <ProductGrid />

      {/* 3. Why choose us */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-nunito text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              ¿Por qué elegirnos?
            </h2>
            <p className="text-gray-500 text-lg">
              Tu bienestar y comodidad son nuestra prioridad.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="flex flex-col items-center text-center p-8 rounded-2xl bg-gray-50 border border-gray-100">
              <span className="flex items-center justify-center w-16 h-16 rounded-full bg-viflomax-azul/10 mb-5">
                {/* Water drop SVG */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="w-8 h-8 fill-viflomax-azul"
                  aria-hidden="true"
                >
                  <path d="M12 2C8.13 2 5 7.36 5 12a7 7 0 0014 0c0-4.64-3.13-10-7-10zm0 17a5 5 0 01-5-5c0-3.53 2.5-7.95 5-9.93 2.5 1.98 5 6.4 5 9.93a5 5 0 01-5 5z" />
                </svg>
              </span>
              <h3 className="font-nunito font-bold text-gray-900 text-xl mb-2">
                Agua 100% Purificada
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Proceso de purificación certificado para garantizar agua limpia y segura para toda tu familia.
              </p>
            </div>

            {/* Card 2 */}
            <div className="flex flex-col items-center text-center p-8 rounded-2xl bg-gray-50 border border-gray-100">
              <span className="flex items-center justify-center w-16 h-16 rounded-full bg-viflomax-verde/10 mb-5">
                {/* Truck SVG */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="w-8 h-8 fill-viflomax-verde"
                  aria-hidden="true"
                >
                  <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zM18 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
                </svg>
              </span>
              <h3 className="font-nunito font-bold text-gray-900 text-xl mb-2">
                Entrega el Mismo Día
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Pedidos realizados antes del mediodía son entregados el mismo día en Maipú y comunas cercanas.
              </p>
            </div>

            {/* Card 3 */}
            <div className="flex flex-col items-center text-center p-8 rounded-2xl bg-gray-50 border border-gray-100">
              <span className="flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 mb-5">
                {/* Price tag SVG */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="w-8 h-8 fill-yellow-600"
                  aria-hidden="true"
                >
                  <path d="M21.41 11.58l-9-9A2 2 0 0011 2H4a2 2 0 00-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58s1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41s-.23-1.06-.59-1.42zM5.5 7A1.5 1.5 0 114 5.5 1.5 1.5 0 015.5 7z" />
                </svg>
              </span>
              <h3 className="font-nunito font-bold text-gray-900 text-xl mb-2">
                Precio Justo
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Tarifas accesibles y transparentes, sin sorpresas. Descuentos especiales para pedidos recurrentes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CTA section */}
      <section className="py-16 bg-gradient-to-r from-viflomax-azul-oscuro to-viflomax-azul text-white text-center">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="font-nunito text-3xl md:text-4xl font-bold mb-4">
            ¿Listo para pedir?
          </h2>
          <p className="text-white/80 text-lg mb-8">
            Completa tu pedido en minutos y lo tendrás en tu puerta hoy mismo.
          </p>
          <Link
            href="/pedir"
            className="inline-flex items-center justify-center bg-viflomax-verde hover:bg-viflomax-verde-claro text-white font-bold text-xl px-10 py-5 rounded-xl shadow-xl transition-colors duration-200"
          >
            Hacer mi Pedido
          </Link>
        </div>
      </section>
    </>
  )
}
