import Link from 'next/link'

type Producto = {
  nombre: string
  emoji: string
  precio: number
}

const PRODUCTOS: Producto[] = [
  { nombre: 'Envase 20 Litros', emoji: '💧', precio: 5500 },
  { nombre: 'Envase 10 Litros', emoji: '💧', precio: 3500 },
  { nombre: 'Recarga 20 Litros', emoji: '♻️', precio: 2500 },
  { nombre: 'Recarga 10 Litros', emoji: '♻️', precio: 1800 },
  { nombre: 'Dispensador Bomba USB', emoji: '⚡', precio: 25000 },
  { nombre: 'Dispensador Básico Sobremesa', emoji: '🏠', precio: 15000 },
  { nombre: 'Dispensador USB Sobremesa', emoji: '🏠', precio: 20000 },
  { nombre: 'Hielo Purificado', emoji: '🧊', precio: 2000 },
  { nombre: 'Manilla Transportadora', emoji: '🎒', precio: 1500 },
]

const formatCLP = (precio: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(precio)

export function ProductGrid() {
  return (
    <section id="productos" className="py-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="font-nunito text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Nuestros Productos
          </h2>
          <p className="text-gray-500 text-lg">
            Precios base desde. Entrega a domicilio en Maipú.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {PRODUCTOS.map((producto) => {
            const slug = encodeURIComponent(producto.nombre)
            return (
              <div
                key={producto.nombre}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center hover:shadow-md transition-shadow duration-200"
              >
                <span className="text-5xl mb-4" role="img" aria-label={producto.nombre}>
                  {producto.emoji}
                </span>
                <h3 className="font-nunito font-bold text-gray-900 text-lg mb-2">
                  {producto.nombre}
                </h3>
                <p className="text-viflomax-azul-oscuro font-semibold text-xl mb-5">
                  {formatCLP(producto.precio)}
                </p>
                <Link
                  href={`/pedir?producto=${slug}`}
                  className="w-full inline-flex items-center justify-center bg-viflomax-verde hover:bg-viflomax-verde-claro text-white font-semibold py-2.5 px-6 rounded-lg transition-colors duration-200"
                >
                  Pedir Este
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
