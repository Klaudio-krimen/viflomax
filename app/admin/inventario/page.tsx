import React from 'react'
import { db } from '@/lib/db'
import type { Inventario, Producto } from '@/lib/types'
import { InventarioTable } from './InventarioTable'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Inventario — Viflomax Admin' }

export type InventarioConProducto = Inventario & {
  producto: Pick<Producto, 'id' | 'nombre' | 'categoria'> | null
}

export default async function InventarioPage() {
  const inventario = await db.inventario.findMany({
    orderBy: { updated_at: 'desc' },
    include: { producto: { select: { id: true, nombre: true, categoria: true } } },
  })

  const inventarioList = inventario.map((i) => ({
    ...i,
    updated_at: i.updated_at.toISOString(),
  })) as unknown as InventarioConProducto[]

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-nunito text-2xl font-extrabold text-gray-900">Inventario</h2>
          <p className="text-sm font-outfit text-gray-500 mt-0.5">Control de stock de productos</p>
        </div>
      </div>
      <InventarioTable inventario={inventarioList} />
    </div>
  )
}
