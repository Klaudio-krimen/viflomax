import React from 'react'
import Link from 'next/link'
import { db } from '@/lib/db'
import type { PrecioDetalle } from '@/lib/types'
import { NuevoPrecioButton } from './NuevoPrecioButton'
import { EliminarButton } from '@/components/ui/EliminarButton'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Precios Sectores — Viflomax Admin' }

function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default async function PreciosSectoresPage() {
  const [precios, productos] = await Promise.all([
    db.precioDetalle.findMany({
      orderBy: { vigente_desde: 'desc' },
    }),
    db.producto.findMany({
      where: { activo: true },
      select: { id: true, nombre: true },
    }),
  ])

  const productoMap = new Map(productos.map((p) => [p.id, p.nombre]))

  const preciosList = precios.map((p) => ({
    ...p,
    precio: Number(p.precio),
    vigente_desde: p.vigente_desde.toISOString(),
    vigente_hasta: p.vigente_hasta?.toISOString() ?? null,
    created_at: p.created_at.toISOString(),
  })) as unknown as PrecioDetalle[]

  const sectoresSet = new Set(preciosList.map((p) => p.sector ?? 'General'))
  const sectores = Array.from(sectoresSet).sort()

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/precios"
            className="text-sm font-outfit text-gray-400 hover:text-gray-600 transition-colors"
          >
            ← Precios
          </Link>
          <h2 className="font-nunito text-2xl font-extrabold text-gray-900">Precios por Sector</h2>
        </div>
        <NuevoPrecioButton />
      </div>

      {preciosList.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-10 text-center text-gray-500 font-outfit text-sm">
          No hay precios por sector configurados.
        </div>
      ) : (
        <div className="space-y-4">
          {sectores.map((sector) => {
            const preciosSector = preciosList.filter((p) => (p.sector ?? 'General') === sector)
            return (
              <div
                key={sector}
                className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
              >
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="font-nunito font-semibold text-gray-900">Sector: {sector}</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm font-outfit">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Producto
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Cant. Mín
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Cant. Máx
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Precio
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Vigencia
                        </th>
                        <th className="px-4 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {preciosSector.map((precio) => (
                        <tr key={precio.id} className="hover:bg-blue-50 transition-colors">
                          <td className="px-4 py-2 text-gray-700">
                            {productoMap.get(precio.producto_id) ?? (
                              <span className="text-gray-400 text-xs font-mono">{precio.producto_id}</span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-gray-700">{precio.cantidad_minima}</td>
                          <td className="px-4 py-2 text-gray-500">
                            {precio.cantidad_maxima ?? 'Sin límite'}
                          </td>
                          <td className="px-4 py-2 font-semibold text-gray-900">
                            {formatCLP(precio.precio)}
                          </td>
                          <td className="px-4 py-2 text-gray-500 text-xs">
                            {formatDate(new Date(precio.vigente_desde))}
                            {precio.vigente_hasta
                              ? ` → ${formatDate(new Date(precio.vigente_hasta))}`
                              : ' (sin vencimiento)'}
                          </td>
                          <td className="px-4 py-2">
                            <EliminarButton
                              url={`/api/precios/sectores/${precio.id}`}
                              confirmar="¿Eliminar este precio de sector?"
                              label="Eliminar"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
