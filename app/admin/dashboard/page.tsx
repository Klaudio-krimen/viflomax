import { createClient } from '@/lib/supabase/server'
import { DashboardStats } from '@/components/admin/DashboardStats'
import { Badge, estadoPedidoBadge } from '@/components/ui/Badge'
import type { PedidoConDetalle } from '@/lib/types'

export const metadata = { title: 'Dashboard — Viflomax Admin' }

async function getDashboardStats(supabase: Awaited<ReturnType<typeof createClient>>, hoy: string) {
  // Pedidos hoy
  const { count: pedidosHoy } = await supabase
    .from('pedidos')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', `${hoy}T00:00:00`)
    .lte('created_at', `${hoy}T23:59:59`)

  // Pedidos pendientes
  const { count: pedidosPendientes } = await supabase
    .from('pedidos')
    .select('*', { count: 'exact', head: true })
    .in('estado', ['nuevo', 'confirmado'])

  // Entregas hoy
  const { count: entregasHoy } = await supabase
    .from('entregas')
    .select('*', { count: 'exact', head: true })
    .gte('timestamp_entrega', `${hoy}T00:00:00`)
    .lte('timestamp_entrega', `${hoy}T23:59:59`)

  // Ingresos hoy (suma monto_cobrado)
  const { data: entregasHoyData } = await supabase
    .from('entregas')
    .select('monto_cobrado')
    .gte('timestamp_entrega', `${hoy}T00:00:00`)
    .lte('timestamp_entrega', `${hoy}T23:59:59`)

  const ingresosHoy = (entregasHoyData ?? []).reduce(
    (sum, e) => sum + (e.monto_cobrado ?? 0),
    0
  )

  // Últimos 10 pedidos del día con cliente
  const { data: ultimosPedidos } = await supabase
    .from('pedidos')
    .select('*, cliente:clientes(id, nombre, telefono)')
    .gte('created_at', `${hoy}T00:00:00`)
    .lte('created_at', `${hoy}T23:59:59`)
    .order('created_at', { ascending: false })
    .limit(10)

  return {
    pedidosHoy: pedidosHoy ?? 0,
    pedidosPendientes: pedidosPendientes ?? 0,
    entregasHoy: entregasHoy ?? 0,
    ingresosHoy,
    ultimosPedidos: (ultimosPedidos ?? []) as PedidoConDetalle[],
  }
}

function formatCLP(amount: number | null): string {
  if (amount === null) return '—'
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const hoy = new Date().toISOString().split('T')[0]

  const stats = await getDashboardStats(supabase, hoy)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="font-nunito text-2xl font-extrabold text-gray-900">Dashboard</h2>
        <p className="text-sm font-outfit text-gray-500 mt-0.5">
          Resumen del día — {new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      <DashboardStats
        pedidosHoy={stats.pedidosHoy}
        pedidosPendientes={stats.pedidosPendientes}
        entregasHoy={stats.entregasHoy}
        ingresosHoy={stats.ingresosHoy}
      />

      {/* Últimos pedidos del día */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-nunito font-semibold text-gray-900 text-lg">Pedidos de hoy</h3>
        </div>
        {stats.ultimosPedidos.length === 0 ? (
          <div className="px-6 py-10 text-center text-gray-500 font-outfit text-sm">
            No hay pedidos registrados hoy.
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.ultimosPedidos.map((pedido) => {
                  const badge = estadoPedidoBadge(pedido.estado)
                  return (
                    <tr key={pedido.id} className="hover:bg-blue-50 transition-colors">
                      <td className="px-4 py-3 text-gray-500">
                        {pedido.numero_pedido ? `#${pedido.numero_pedido}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-900 font-medium">
                        {pedido.cliente?.nombre ?? 'Sin cliente'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={badge.variant} size="sm">{badge.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{formatCLP(pedido.monto_total)}</td>
                      <td className="px-4 py-3 text-gray-500">{formatTime(pedido.created_at)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
