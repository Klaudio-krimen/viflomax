import React from 'react'
import { createClient } from '@/lib/supabase/server'
import type { Inventario, Producto } from '@/lib/types'
import { InventarioTable } from './InventarioTable'

export const metadata = { title: 'Inventario — Viflomax Admin' }

export type InventarioConProducto = Inventario & {
  producto: Pick<Producto, 'id' | 'nombre' | 'categoria'> | null
}

export default async function InventarioPage() {
  const supabase = await createClient()

  const { data: inventario } = await supabase
    .from('inventario')
    .select('*, producto:productos(id, nombre, categoria)')
    .order('updated_at', { ascending: false })

  const inventarioList = (inventario ?? []) as InventarioConProducto[]

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="font-nunito text-2xl font-extrabold text-gray-900">Inventario</h2>
        <p className="text-sm font-outfit text-gray-500 mt-0.5">Control de stock de productos</p>
      </div>
      <InventarioTable inventario={inventarioList} />
    </div>
  )
}
