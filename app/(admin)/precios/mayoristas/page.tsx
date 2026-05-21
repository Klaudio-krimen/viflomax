import React from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Empresa, PrecioMayorista } from '@/lib/types'
import { AgregarTramoButton } from './AgregarTramoButton'

export const metadata = { title: 'Precios Mayoristas — Viflomax Admin' }

function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(amount)
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default async function PreciosMayoristasPage() {
  const supabase = await createClient()

  const [{ data: empresas }, { data: tramos }] = await Promise.all([
    supabase.from('empresas').select('id, razon_social, activo').eq('activo', true).order('razon_social'),
    supabase.from('precios_mayorista').select('*').order('vigente_desde', { ascending: false }),
  ])

  const empresasList = (empresas ?? []) as Pick<Empresa, 'id' | 'razon_social' | 'activo'>[]
  const tramosList = (tramos ?? []) as PrecioMayorista[]

  const tramosPorEmpresa = (empresaId: string) =>
    tramosList.filter((t) => t.empresa_id === empresaId)

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-4">
        <Link href="/admin/precios" className="text-sm font-outfit text-gray-400 hover:text-gray-600 transition-colors">
          ← Precios
        </Link>
        <h2 className="font-nunito text-2xl font-extrabold text-gray-900">Precios Mayoristas</h2>
      </div>

      {empresasList.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-10 text-center text-gray-500 font-outfit text-sm">
          No hay empresas mayoristas activas.
        </div>
      ) : (
        <div className="space-y-4">
          {empresasList.map((empresa) => {
            const tramosEmpresa = tramosPorEmpresa(empresa.id)
            return (
              <div key={empresa.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-nunito font-semibold text-gray-900">{empresa.razon_social}</h3>
                  <AgregarTramoButton empresaId={empresa.id} empresaNombre={empresa.razon_social} />
                </div>
                {tramosEmpresa.length === 0 ? (
                  <div className="px-6 py-6 text-sm font-outfit text-gray-400">
                    Sin tramos de precio configurados.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm font-outfit">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Producto ID</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Vol. Mín</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Vol. Máx</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Precio</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Vigencia</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {tramosEmpresa.map((tramo) => (
                          <tr key={tramo.id} className="hover:bg-blue-50 transition-colors">
                            <td className="px-4 py-2 text-gray-500 text-xs font-mono">{tramo.producto_id}</td>
                            <td className="px-4 py-2 text-gray-700">{tramo.volumen_minimo}</td>
                            <td className="px-4 py-2 text-gray-500">{tramo.volumen_maximo ?? 'Sin límite'}</td>
                            <td className="px-4 py-2 font-semibold text-gray-900">{formatCLP(tramo.precio)}</td>
                            <td className="px-4 py-2 text-gray-500 text-xs">
                              {formatDate(tramo.vigente_desde)}
                              {tramo.vigente_hasta ? ` → ${formatDate(tramo.vigente_hasta)}` : ' (sin vencimiento)'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
