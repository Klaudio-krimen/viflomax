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
    <section id="productos" className="scroll-mt-32 bg-white py-12 md:py-16">
      <div className="relative max-w-6xl mx-auto px-6">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-8">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-viflomax-verde-700">Elige tu formato</p>
            <h2 className="font-nunito text-3xl font-bold tracking-tight text-viflomax-azul-800 md:text-4xl">Agua, dispensadores y extras</h2>
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
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {visibles.map((producto) => (
              <article
                key={producto.nombre}
                className={`group overflow-hidden rounded-2xl border border-viflomax-azul-300 ${
                  producto.destacado
                    ? 'bg-viflomax-azul-100 md:col-span-2 md:grid md:grid-cols-[0.8fr_1.2fr]'
                    : 'flex flex-col bg-white'
                }`}
              >
                {/* Foto */}
                <div className="relative aspect-[4/5] overflow-hidden bg-viflomax-azul-100">
                  <ProductoImagen src={producto.imagen} alt={producto.nombre} />
                </div>

                {/* Contenido */}
                <div className={`flex flex-1 flex-col p-6 ${producto.destacado ? 'md:justify-center md:p-10' : ''}`}>
                  {producto.badge && (
                    <span className="mb-4 w-fit rounded-full bg-viflomax-verde-700 px-3 py-1.5 text-xs font-bold text-white">{producto.badge}</span>
                  )}
                  <h3 className={`mb-2 font-nunito font-bold text-viflomax-azul-800 ${producto.destacado ? 'text-2xl md:text-3xl' : 'text-xl'}`}>
                    {producto.nombre}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4 flex-1">
                    {producto.descripcion}
                  </p>
                  <p className="text-viflomax-azul-800 font-extrabold text-2xl mb-4">
                    {formatCLP(producto.precio)}
                  </p>
                  <button
                    type="button"
                    onClick={() => irAlFormulario(producto.nombre)}
                    className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-viflomax-verde-700 px-6 py-3 font-semibold text-white hover:bg-viflomax-verde-800 focus-visible:ring-2 focus-visible:ring-viflomax-azul-700"
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
