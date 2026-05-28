import { db } from '@/lib/db'
import { DashboardStats } from '@/components/admin/DashboardStats'
import { Badge, estadoPedidoBadge } from '@/components/ui/Badge'
import type { PedidoConDetalle } from '@/lib/types'

export const metadata = { title: 'Dashboard — Viflomax Admin' }

function formatCLP(amount: number | null): string {
  if (amount === null) return '—'
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
}

export default async function DashboardPage() {
  const hoyInicio = new Date()
  hoyInicio.setHours(0, 0, 0, 0)
  const hoyFin = new Date()
  hoyFin.setHours(23, 59, 59, 999)

  const [pedidosHoy, pedidosPendientes, entregasHoy, entregasHoyData, ultimosPedidos] =
    await Promise.all([
      db.pedido.count({
        where: { created_at: { gte: hoyInicio, lte: hoyFin } },
      }),
      db.pedido.count({
        where: { estado: { in: ['nuevo', 'confirmado'] } },
      }),
      db.entrega.count({
        where: { timestamp_entrega: { gte: hoyInicio, lte: hoyFin } },
      }),
      db.entrega.findMany({
        where: { timestamp_entrega: { gte: hoyInicio, lte: hoyFin } },
        select: { monto_cobrado: true },
      }),
      db.pedido.findMany({
        where: { created_at: { gte: hoyInicio, lte: hoyFin } },
        orderBy: { created_at: 'desc' },
        take: 10,
        include: { cliente: { select: { id: true, nombre: true, telefono: true } } },
      }),
    ])

  const ingresosHoy = entregasHoyData.reduce(
    (sum, e) => sum + Number(e.monto_cobrado ?? 0),
    0
  )

  // Adaptar al tipo PedidoConDetalle (campos de fecha a string para compatibilidad)
  const pedidosAdaptados = ultimosPedidos.map((p) => ({
    ...p,
    fecha_pedido: p.fecha_pedido.toISOString(),
    created_at: p.created_at.toISOString(),
    monto_total: p.monto_total ? Number(p.monto_total) : null,
    fecha_entrega_programada: p.fecha_entrega_programada?.toISOString() ?? null,
  })) as unknown as PedidoConDetalle[]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="font-nunito text-2xl font-extrabold text-gray-900">Dashboard</h2>
        <p className="text-sm font-outfit text-gray-500 mt-0.5">
          Resumen del día —{' '}
          {new Date().toLocaleDateString('es-CL', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      </div>

      <DashboardStats
        pedidosHoy={pedidosHoy}
        pedidosPendientes={pedidosPendientes}
        entregasHoy={entregasHoy}
        ingresosHoy={ingresosHoy}
      />

      {/* Últimos pedidos del día */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-nunito font-semibold text-gray-900 text-lg">Pedidos de hoy</h3>
        </div>
        {pedidosAdaptados.length === 0 ? (
          <div className="px-6 py-10 text-center text-gray-500 font-outfit text-sm">
            No hay pedidos registrados hoy.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-outfit">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    N° Pedido
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Hora
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pedidosAdaptados.map((pedido) => {
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
                        <Badge variant={badge.variant} size="sm">
                          {badge.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {formatCLP(pedido.monto_total)}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {formatTime(new Date(pedido.created_at))}
                      </td>
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
