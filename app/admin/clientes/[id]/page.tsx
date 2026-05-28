import { notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import { Badge, estadoPedidoBadge } from '@/components/ui/Badge'
import type { ClienteConEmpresa, Pedido } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Ficha de Cliente — Viflomax Admin' }

const TIPO_BADGE: Record<string, { variant: 'success' | 'info' | 'default'; label: string }> = {
  mayorista: { variant: 'success', label: 'Mayorista' },
  detalle: { variant: 'info', label: 'Detalle' },
  nuevo: { variant: 'default', label: 'Nuevo' },
}

function formatCLP(amount: number | null): string {
  if (amount === null) return '—'
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default async function ClienteFichaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const cliente = await db.cliente.findUnique({
    where: { id },
    include: { empresa: { select: { id: true, razon_social: true } } },
  })

  if (!cliente) notFound()

  const pedidos = await db.pedido.findMany({
    where: { cliente_id: id },
    orderBy: { created_at: 'desc' },
    take: 10,
  })

  const clienteAdaptado = {
    ...cliente,
    created_at: cliente.created_at.toISOString(),
  } as unknown as ClienteConEmpresa

  const pedidosList = pedidos.map((p) => ({
    ...p,
    fecha_pedido: p.fecha_pedido.toISOString(),
    created_at: p.created_at.toISOString(),
    monto_total: p.monto_total ? Number(p.monto_total) : null,
    fecha_entrega_programada: p.fecha_entrega_programada?.toISOString() ?? null,
  })) as unknown as Pedido[]

  const tipoBadge = TIPO_BADGE[clienteAdaptado.tipo_cliente] ?? TIPO_BADGE.nuevo

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      {/* Encabezado */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/admin/clientes"
            className="text-sm font-outfit text-gray-400 hover:text-gray-600 transition-colors"
          >
            ← Volver a clientes
          </Link>
          <h2 className="font-nunito text-2xl font-extrabold text-gray-900 mt-1">
            {clienteAdaptado.nombre}
          </h2>
          <div className="flex items-center gap-2 mt-1.5">
            <Badge variant={tipoBadge.variant} size="sm">
              {tipoBadge.label}
            </Badge>
            {!clienteAdaptado.activo && (
              <Badge variant="error" size="sm">
                Inactivo
              </Badge>
            )}
          </div>
        </div>
        <button
          type="button"
          className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-outfit rounded-lg hover:bg-gray-50 transition-colors cursor-not-allowed opacity-60"
          title="Editar cliente (próximamente)"
          aria-disabled="true"
        >
          Editar
        </button>
      </div>

      {/* Datos del cliente */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="font-nunito font-semibold text-gray-900 text-lg mb-4">Datos de contacto</h3>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm font-outfit">
          <div>
            <dt className="text-gray-500 text-xs uppercase tracking-wider font-medium mb-0.5">
              Teléfono
            </dt>
            <dd className="text-gray-900">{clienteAdaptado.telefono ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-500 text-xs uppercase tracking-wider font-medium mb-0.5">
              Email
            </dt>
            <dd className="text-gray-900">{clienteAdaptado.email ?? '—'}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-gray-500 text-xs uppercase tracking-wider font-medium mb-0.5">
              Dirección
            </dt>
            <dd className="text-gray-900">{clienteAdaptado.direccion ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-500 text-xs uppercase tracking-wider font-medium mb-0.5">
              Comuna
            </dt>
            <dd className="text-gray-900">{clienteAdaptado.comuna ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-500 text-xs uppercase tracking-wider font-medium mb-0.5">
              Sector
            </dt>
            <dd className="text-gray-900">{clienteAdaptado.sector ?? '—'}</dd>
          </div>
          {clienteAdaptado.empresa && (
            <div className="col-span-2">
              <dt className="text-gray-500 text-xs uppercase tracking-wider font-medium mb-0.5">
                Empresa
              </dt>
              <dd className="text-gray-900">{clienteAdaptado.empresa.razon_social}</dd>
            </div>
          )}
          {clienteAdaptado.notas && (
            <div className="col-span-2">
              <dt className="text-gray-500 text-xs uppercase tracking-wider font-medium mb-0.5">
                Notas
              </dt>
              <dd className="text-gray-900 whitespace-pre-wrap">{clienteAdaptado.notas}</dd>
            </div>
          )}
          <div>
            <dt className="text-gray-500 text-xs uppercase tracking-wider font-medium mb-0.5">
              Cliente desde
            </dt>
            <dd className="text-gray-900">{formatDate(new Date(clienteAdaptado.created_at))}</dd>
          </div>
        </dl>
      </div>

      {/* Historial de pedidos */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-nunito font-semibold text-gray-900 text-lg">Últimos 10 pedidos</h3>
        </div>
        {pedidosList.length === 0 ? (
          <div className="px-6 py-10 text-center text-gray-500 font-outfit text-sm">
            Este cliente aún no tiene pedidos.
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
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Origen
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Fecha
                  </th>
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
                      <td className="px-4 py-3">
                        <Badge variant={badge.variant} size="sm">
                          {badge.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{formatCLP(pedido.monto_total)}</td>
                      <td className="px-4 py-3 text-gray-500 capitalize">{pedido.origen}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {formatDate(new Date(pedido.created_at))}
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
