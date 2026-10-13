'use client'

import { useState } from 'react'
import { CATEGORIAS, PRODUCTOS, formatCLP, filtrarPorCategoria, type CategoriaId } from '@/lib/productos'
import { ProductoImagen } from './ProductoImagen'
import { usePedido } from './PedidoProvider'

type Filtro = 'todos' | CategoriaId

export function ProductGrid() {
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const { setProductoSeleccionado } = usePedido()

  const visibles = filtrarPorCategoria(PRODUCTOS, filtro)

  const irAlFormulario = (nombreProducto: string) => {
    setProductoSeleccionado(nombreProducto)
    window.location.hash = 'pedido'
    document.getElementById('pedido')?.scrollIntoView({ behavior: 'auto', block: 'start' })
  }

  return (
    <section id="productos" aria-labelledby="productos-titulo" className="scroll-mt-32 bg-white py-12 md:py-16">
      <div className="relative max-w-6xl mx-auto px-6">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-8">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-viflomax-verde-700">Elige tu formato</p>
            <h2 id="productos-titulo" className="font-nunito text-3xl font-bold tracking-tight text-viflomax-azul-800 md:text-4xl">Agua, dispensadores y extras</h2>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-gray-600">
            Precio final en Maipú. Para otras comunas se confirma al hacer el pedido.
          </p>
        </div>

        {/* Filtros por categoría */}
        <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="Filtrar productos">
          {([{ id: 'todos', label: 'Todos' }, ...CATEGORIAS] as { id: Filtro; label: string }[]).map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={filtro === c.id}
              onClick={() => setFiltro(c.id)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-viflomax-azul-700 ${
                filtro === c.id
                  ? 'bg-viflomax-azul-800 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-viflomax-azul'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {visibles.length === 0 ? (
          <p className="text-center text-gray-600 text-lg py-12">
            No hay productos en esta categoría
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {visibles.map((producto) => (
              <article
                key={producto.nombre}
                className={`overflow-hidden rounded-2xl border border-viflomax-azul-300 ${
                  producto.destacado
                    ? 'bg-viflomax-azul-100 md:col-span-2 md:grid md:grid-cols-[0.7fr_1.3fr] lg:col-span-3'
                    : producto.categoria === 'agua' ? 'flex flex-col bg-white' : 'grid grid-cols-[112px_minmax(0,1fr)] bg-white md:flex md:flex-col'
                }`}
              >
                {/* Foto */}
                <a href={producto.imagen} target="_blank" rel="noopener noreferrer" aria-label={`Ampliar imagen de ${producto.nombre} (se abre en una pestaña nueva)`} className={`relative block overflow-hidden bg-viflomax-azul-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-viflomax-azul-700 ${producto.destacado ? 'h-64 md:h-72' : producto.categoria === 'agua' ? 'h-56 md:h-60' : 'min-h-44 md:h-60'}`}>
                  <ProductoImagen src={producto.imagen} alt={producto.nombre} sizes={producto.destacado ? '(max-width: 767px) calc(100vw - 48px), 400px' : producto.categoria === 'agua' ? '(max-width: 767px) calc(100vw - 48px), (max-width: 1023px) 50vw, 352px' : '(max-width: 767px) 112px, (max-width: 1023px) 50vw, 352px'} />
                  <span aria-hidden="true" className="absolute right-2 top-2 rounded-full bg-white p-1.5 text-viflomax-azul-800">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4"><path d="M14 4h6v6M20 4l-8 8M10 4H4v16h16v-6" /></svg>
                  </span>
                </a>

                {/* Contenido */}
                <div className={`flex min-w-0 flex-1 flex-col p-4 md:p-5 ${producto.destacado ? 'md:justify-center md:p-8' : ''}`}>
                  {producto.badge && (
                    <span className="mb-3 w-fit rounded-full bg-viflomax-verde-700 px-3 py-1.5 text-xs font-bold text-white">{producto.badge}</span>
                  )}
                  <h3 className={`mb-2 font-nunito font-bold leading-tight text-viflomax-azul-800 ${producto.destacado ? 'text-2xl md:text-3xl' : 'text-lg md:text-xl'}`}>
                    {producto.nombre}
                  </h3>
                  <p className={`mb-3 text-sm leading-relaxed text-gray-600 ${producto.destacado ? '' : 'flex-1'}`}>
                    {producto.descripcion}
                  </p>
                  <p className="mb-3 text-2xl font-extrabold text-viflomax-azul-800">
                    {formatCLP(producto.precio)}
                  </p>
                  <button
                    type="button"
                    onClick={() => irAlFormulario(producto.nombre)}
                    className={`inline-flex min-h-11 items-center justify-center rounded-full bg-viflomax-verde-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-viflomax-verde-800 focus-visible:ring-2 focus-visible:ring-viflomax-azul-700 ${producto.destacado ? 'md:w-fit md:px-8' : 'w-full'}`}
                  >
                    Pedir este
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
