import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge, estadoPedidoBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { EstadoPedido, PedidoConDetalle } from '@/lib/types'

export const metadata = { title: 'Pedidos — Viflomax Admin' }

const PAGE_SIZE = 20

const ESTADOS: { value: string; label: string }[] = [
  { value: '', label: 'Todos los estados' },
  { value: 'nuevo', label: 'Nuevo' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'en_ruta', label: 'En ruta' },
  { value: 'entregado', label: 'Entregado' },
  { value: 'cancelado', label: 'Cancelado' },
]

function formatCLP(amount: number | null): string {
  if (amount === null) return '—'
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(amount)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

type SearchParams = {
  estado?: string
  fecha?: string
  pagina?: string
}

export default async function PedidosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const supabase = await createClient()

  const estado = params.estado ?? ''
  const fecha = params.fecha ?? ''
  const pagina = Math.max(1, Number(params.pagina ?? 1))
  const offset = (pagina - 1) * PAGE_SIZE

  let query = supabase
    .from('pedidos')
    .select('*, cliente:clientes(id, nombre, telefono)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (estado) {
    query = query.eq('estado', estado as EstadoPedido)
  }
  if (fecha) {
    query = query.gte('created_at', `${fecha}T00:00:00`).lte('created_at', `${fecha}T23:59:59`)
  }

  const { data: pedidos, count } = await query

  const totalPaginas = Math.ceil((count ?? 0) / PAGE_SIZE)
  const pedidosList = (pedidos ?? []) as PedidoConDetalle[]

  // Build URL helper
  function buildUrl(overrides: Partial<SearchParams>): string {
    const p = { estado, fecha, pagina: String(pagina), ...overrides }
    const qs = new URLSearchParams()
    if (p.estado) qs.set('estado', p.estado)
    if (p.fecha) qs.set('fecha', p.fecha)
    if (p.pagina && p.pagina !== '1') qs.set('pagina', p.pagina)
    const str = qs.toString()
    return `/admin/pedidos${str ? '?' + str : ''}`
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-nunito text-2xl font-extrabold text-gray-900">Pedidos</h2>
          <p className="text-sm font-outfit text-gray-500 mt-0.5">{count ?? 0} pedidos encontrados</p>
        </div>
        <Link href="/admin/pedidos/nuevo">
          <Button variant="primary" size="sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Pedido
          </Button>
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label htmlFor="filtro-estado" className="text-xs font-outfit text-gray-600 font-medium">Estado</label>
          <form>
            <select
              id="filtro-estado"
              name="estado"
              defaultValue={estado}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-outfit text-gray-900 focus:outline-none focus:ring-2 focus:ring-viflomax-azul"
            >
              {ESTADOS.map((e) => (
                <option key={e.value} value={e.value}>{e.label}</option>
              ))}
            </select>
          </form>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="filtro-fecha" className="text-xs font-outfit text-gray-600 font-medium">Fecha</label>
          <input
            id="filtro-fecha"
            type="date"
            defaultValue={fecha}
            name="fecha"
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-outfit text-gray-900 focus:outline-none focus:ring-2 focus:ring-viflomax-azul"
            form="filtros-form"
          />
        </div>
        <form id="filtros-form" action="/admin/pedidos" method="GET">
          <input type="hidden" name="estado" value={estado} />
          <button type="submit" className="px-4 py-1.5 bg-viflomax-verde text-white text-sm font-outfit rounded-lg hover:bg-viflomax-verde-claro transition-colors">
            Filtrar
          </button>
        </form>
        {(estado || fecha) && (
          <Link href="/admin/pedidos" className="px-4 py-1.5 border border-gray-300 text-gray-700 text-sm font-outfit rounded-lg hover:bg-gray-50 transition-colors">
            Limpiar
          </Link>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {pedidosList.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500 font-outfit text-sm">
            No hay pedidos con los filtros seleccionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-outfit">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">N° Pedido</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Origen</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pedidosList.map((pedido) => {
                  const badge = estadoPedidoBadge(pedido.estado)
                  return (
                    <tr key={pedido.id} className="hover:bg-blue-50 transition-colors">
                      <td className="px-4 py-3 text-gray-500">
                        {pedido.numero_pedido ? `#${pedido.numero_pedido}` : '—'}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {pedido.cliente?.nombre ?? <span className="text-gray-400 italic">Sin cliente</span>}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={badge.variant} size="sm">{badge.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{formatCLP(pedido.monto_total)}</td>
                      <td className="px-4 py-3 text-gray-500 capitalize">{pedido.origen}</td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(pedido.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/pedidos/${pedido.id}`}
                            className="px-2.5 py-1 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                          >
                            Ver
                          </Link>
                          <span className="px-2.5 py-1 text-xs bg-gray-50 text-gray-500 rounded-lg border border-gray-200 cursor-not-allowed">
                            Asignar Chofer
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm font-outfit text-gray-500">
            Página {pagina} de {totalPaginas}
          </p>
          <div className="flex gap-2">
            {pagina > 1 && (
              <Link
                href={buildUrl({ pagina: String(pagina - 1) })}
                className="px-3 py-1.5 text-sm font-outfit border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Anterior
              </Link>
            )}
            {pagina < totalPaginas && (
              <Link
                href={buildUrl({ pagina: String(pagina + 1) })}
                className="px-3 py-1.5 text-sm font-outfit bg-viflomax-verde text-white rounded-lg hover:bg-viflomax-verde-claro transition-colors"
              >
                Siguiente
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
