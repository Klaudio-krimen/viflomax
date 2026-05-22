import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Precios — Viflomax Admin' }

export default async function PreciosPage() {
  const supabase = await createClient()

  const [{ count: totalEmpresas }, { count: totalMayoristas }, { count: totalDetalle }] =
    await Promise.all([
      supabase.from('empresas').select('*', { count: 'exact', head: true }).eq('activo', true),
      supabase.from('precios_mayoristas').select('*', { count: 'exact', head: true }),
      supabase.from('precios_detalle').select('*', { count: 'exact', head: true }),
    ])

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="font-nunito text-2xl font-extrabold text-gray-900">Precios</h2>
        <p className="text-sm font-outfit text-gray-500 mt-0.5">Gestión de precios mayoristas y por sector</p>
      </div>

      {/* Tabs / sub-navegación */}
      <div className="flex gap-3 border-b border-gray-200 pb-1">
        <Link
          href="/admin/precios/mayoristas"
          className="px-4 py-2 text-sm font-outfit font-medium text-gray-600 hover:text-viflomax-verde hover:border-b-2 hover:border-viflomax-verde transition-colors"
        >
          Mayoristas
        </Link>
        <Link
          href="/admin/precios/sectores"
          className="px-4 py-2 text-sm font-outfit font-medium text-gray-600 hover:text-viflomax-verde hover:border-b-2 hover:border-viflomax-verde transition-colors"
        >
          Sectores
        </Link>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-5">
          <p className="text-3xl font-nunito font-extrabold text-gray-900">{totalEmpresas ?? 0}</p>
          <p className="text-sm font-outfit text-gray-500 mt-0.5">Empresas mayoristas activas</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-5">
          <p className="text-3xl font-nunito font-extrabold text-gray-900">{totalMayoristas ?? 0}</p>
          <p className="text-sm font-outfit text-gray-500 mt-0.5">Tramos de precio mayorista</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-5">
          <p className="text-3xl font-nunito font-extrabold text-gray-900">{totalDetalle ?? 0}</p>
          <p className="text-sm font-outfit text-gray-500 mt-0.5">Tramos de precio detalle</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <p className="text-sm font-outfit text-blue-800">
          Selecciona una pestaña arriba para gestionar los precios por empresa mayorista o por sector.
        </p>
      </div>
    </div>
  )
}
