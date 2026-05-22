import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/Badge'
import type { Chofer } from '@/lib/types'

export const metadata = { title: 'Choferes — Viflomax Admin' }

export default async function ChoferesPage() {
  const supabase = await createClient()

  const { data: choferes } = await supabase
    .from('choferes')
    .select('*')
    .order('nombre', { ascending: true })

  const choferesList = (choferes ?? []) as Chofer[]

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="font-nunito text-2xl font-extrabold text-gray-900">Choferes</h2>
        <p className="text-sm font-outfit text-gray-500 mt-0.5">
          {choferesList.length} chofer{choferesList.length !== 1 ? 'es' : ''} registrado{choferesList.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {choferesList.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500 font-outfit text-sm">
            No hay choferes registrados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-outfit">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Nombre</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Teléfono</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Vehículo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {choferesList.map((chofer) => (
                  <tr key={chofer.id} className="hover:bg-blue-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{chofer.nombre}</td>
                    <td className="px-4 py-3 text-gray-500">{chofer.telefono ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{chofer.vehiculo ?? '—'}</td>
                    <td className="px-4 py-3">
                      {chofer.activo ? (
                        <Badge variant="success" size="sm">Activo</Badge>
                      ) : (
                        <Badge variant="error" size="sm">Inactivo</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/pedidos?chofer=${chofer.id}`}
                        className="px-2.5 py-1 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                      >
                        Ver entregas
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
