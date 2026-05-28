import Link from 'next/link'
import { db } from '@/lib/db'
import type { Inventario, Producto } from '@/lib/types'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Inventario — Viflomax Chofer' }

type InventarioConProducto = Inventario & {
  producto: Pick<Producto, 'id' | 'nombre' | 'categoria'> | null
}

function AlertaStock({ stock, minimo }: { stock: number; minimo: number }) {
  if (stock <= 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-outfit font-semibold text-rose-700 bg-rose-50 rounded-full px-2 py-0.5">
        <span aria-hidden="true">&#9888;</span> Sin stock
      </span>
    )
  }
  if (stock <= minimo) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-outfit font-semibold text-amber-700 bg-amber-50 rounded-full px-2 py-0.5">
        <span aria-hidden="true">&#9888;</span> Stock bajo
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-outfit font-semibold text-emerald-700 bg-emerald-50 rounded-full px-2 py-0.5">
      <span aria-hidden="true">&#10003;</span> OK
    </span>
  )
}

export default async function InventarioChoferPage() {
  const inventario = await db.inventario.findMany({
    orderBy: { updated_at: 'desc' },
    include: { producto: { select: { id: true, nombre: true, categoria: true } } },
  })

  const inventarioList = inventario.map((i) => ({
    ...i,
    updated_at: i.updated_at.toISOString(),
  })) as unknown as InventarioConProducto[]

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="flex items-center gap-3">
        <Link
          href="/chofer"
          className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-viflomax-azul"
          aria-label="Volver a mis entregas"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="font-nunito font-extrabold text-xl text-gray-900">Inventario</h1>
          <p className="font-outfit text-sm text-gray-500">Stock actual de productos</p>
        </div>
      </div>

      {inventarioList.length === 0 ? (
        <div className="py-12 text-center">
          <p className="font-outfit text-gray-500">No hay datos de inventario disponibles.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {inventarioList.map((inv) => (
            <div
              key={inv.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 px-5 py-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-outfit font-semibold text-base text-gray-900 leading-snug">
                    {inv.producto?.nombre ?? 'Producto desconocido'}
                  </p>
                  {inv.producto?.categoria && (
                    <p className="font-outfit text-xs text-gray-400 capitalize mt-0.5">
                      {inv.producto.categoria}
                    </p>
                  )}
                </div>
                <AlertaStock stock={inv.stock_bodega} minimo={inv.stock_minimo_alerta} />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <p className="font-nunito font-extrabold text-2xl text-gray-900">
                    {inv.stock_bodega}
                  </p>
                  <p className="font-outfit text-xs text-gray-500 mt-0.5">Bodega</p>
                </div>
                <div className="text-center">
                  <p className="font-nunito font-extrabold text-2xl text-viflomax-azul-oscuro">
                    {inv.stock_en_ruta}
                  </p>
                  <p className="font-outfit text-xs text-gray-500 mt-0.5">En Ruta</p>
                </div>
                <div className="text-center">
                  <p className="font-nunito font-extrabold text-2xl text-gray-400">
                    {inv.stock_vacios_bodega}
                  </p>
                  <p className="font-outfit text-xs text-gray-500 mt-0.5">Vacíos</p>
                </div>
              </div>

              <p className="font-outfit text-xs text-gray-400">
                Alerta cuando stock bodega ≤ {inv.stock_minimo_alerta}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
