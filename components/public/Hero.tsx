import Link from 'next/link'

const bubbles = [
  { size: 'w-8 h-8', opacity: 'opacity-20', duration: '4s', top: '15%', left: '10%' },
  { size: 'w-16 h-16', opacity: 'opacity-10', duration: '6s', top: '60%', left: '5%' },
  { size: 'w-12 h-12', opacity: 'opacity-20', duration: '5s', top: '25%', left: '80%' },
  { size: 'w-24 h-24', opacity: 'opacity-10', duration: '8s', top: '70%', left: '75%' },
  { size: 'w-10 h-10', opacity: 'opacity-30', duration: '3s', top: '45%', left: '90%' },
  { size: 'w-20 h-20', opacity: 'opacity-10', duration: '7s', top: '80%', left: '40%' },
]

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-viflomax-azul-oscuro via-viflomax-azul to-viflomax-verde min-h-[90vh] flex items-center">
      {/* Bubbles */}
      {bubbles.map((b, i) => (
        <span
          key={i}
          className={`bubble absolute rounded-full bg-white ${b.size} ${b.opacity}`}
          style={{
            top: b.top,
            left: b.left,
            animationDuration: b.duration,
          }}
        />
      ))}

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-24 text-center text-white">
        {/* Tag */}
        <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-sm font-semibold px-4 py-1.5 rounded-full mb-6 tracking-wide">
          Distribución en Maipú y alrededores
        </span>

        {/* Title */}
        <h1 className="font-nunito text-5xl md:text-7xl font-extrabold leading-tight mb-6 whitespace-pre-line">
          {'Agua Purificada\na Domicilio'}
        </h1>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-xl mx-auto">
          Entrega rápida en Maipú y alrededores
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/pedir"
            className="inline-flex items-center justify-center bg-white text-viflomax-azul-oscuro font-bold text-lg px-8 py-4 rounded-xl shadow-lg hover:bg-gray-100 transition-colors duration-200"
          >
            Pedir Ahora
          </Link>
          <a
            href="#productos"
            className="inline-flex items-center justify-center border-2 border-white text-white font-bold text-lg px-8 py-4 rounded-xl hover:bg-white/10 transition-colors duration-200"
          >
            Ver Productos
          </a>
        </div>
      </div>
    </section>
  )
}
