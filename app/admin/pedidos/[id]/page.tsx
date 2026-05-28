import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { Badge, estadoPedidoBadge } from '@/components/ui/Badge'
import { EliminarPedidoButton } from '../EliminarPedidoButton'
import { CambiarEstadoButton } from './CambiarEstadoButton'
import type { EstadoPedido } from '@/lib/types'

export const dynamic = 'force-dynamic'

function formatCLP(amount: number | null): string {
  if (amount === null) return '—'
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const ESTADOS_SIGUIENTE: Record<string, { value: string; label: string }[]> = {
  nuevo: [{ value: 'confirmado', label: 'Confirmar' }, { value: 'cancelado', label: 'Cancelar' }],
  confirmado: [{ value: 'en_ruta', label: 'Poner en ruta' }, { value: 'cancelado', label: 'Cancelar' }],
  en_ruta: [{ value: 'entregado', label: 'Marcar entregado' }, { value: 'confirmado', label: 'Devolver a confirmado' }],
  entregado: [],
  cancelado: [{ value: 'nuevo', label: 'Reabrir' }],
}

export default async function PedidoDetallePage({ params }: { params: { id: string } }) {
  const pedido = await db.pedido.findUnique({
    where: { id: params.id },
    include: {
      cliente: true,
      chofer: true,
      items: {
        include: { producto: true },
      },
      entrega: true,
    },
  })

  if (!pedido) notFound()

  const choferes = await db.chofer.findMany({
    where: { activo: true },
    orderBy: { nombre: 'asc' },
    select: { id: true, nombre: true },
  })

  const badge = estadoPedidoBadge(pedido.estado as EstadoPedido)
  const siguientesEstados = ESTADOS_SIGUIENTE[pedido.estado as string] ?? []

  const montoTotal = pedido.monto_total ? Number(pedido.monto_total) : null

  return (
    <div className="p-6 space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/pedidos"
            className="text-sm font-outfit text-gray-400 hover:text-gray-600 transition-colors"
          >
            ← Pedidos
          </Link>
          <div>
            <h2 className="font-nunito text-2xl font-extrabold text-gray-900">
              {pedido.numero_pedido ? `Pedido #${pedido.numero_pedido}` : 'Pedido sin número'}
            </h2>
            <p className="text-sm font-outfit text-gray-500 mt-0.5">
              Creado el {formatDate(pedido.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={badge.variant} size="sm">{badge.label}</Badge>
          <EliminarPedidoButton id={pedido.id} numero={pedido.numero_pedido} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Info general */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
          <h3 className="font-nunito font-semibold text-gray-900 text-sm uppercase tracking-wider text-gray-500">
            Información
          </h3>
          <div className="space-y-2 text-sm font-outfit">
            <div className="flex justify-between">
              <span className="text-gray-500">Cliente</span>
              <span className="font-medium text-gray-900">
                {pedido.cliente?.nombre ?? <span className="text-gray-400 italic">Sin cliente</span>}
              </span>
            </div>
            {pedido.cliente?.telefono && (
              <div className="flex justify-between">
                <span className="text-gray-500">Teléfono</span>
                <a href={`tel:${pedido.cliente.telefono}`} className="text-viflomax-azul hover:underline">
                  {pedido.cliente.telefono}
                </a>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Origen</span>
              <span className="capitalize text-gray-700">{pedido.origen}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Total</span>
              <span className="font-semibold text-gray-900">{formatCLP(montoTotal)}</span>
            </div>
            {pedido.fecha_entrega_programada && (
              <div className="flex justify-between">
                <span className="text-gray-500">Entrega programada</span>
                <span className="text-gray-700">{formatDate(pedido.fecha_entrega_programada)}</span>
              </div>
            )}
            {pedido.notas && (
              <div className="pt-1 border-t border-gray-100">
                <span className="text-gray-500 block mb-1">Notas</span>
                <span className="text-gray-700">{pedido.notas}</span>
              </div>
            )}
          </div>
        </div>

        {/* Chofer y acciones */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
          <h3 className="font-nunito font-semibold text-sm uppercase tracking-wider text-gray-500">
            Chofer y Estado
          </h3>

          {/* Asignar chofer */}
          <form action={`/api/pedidos/${pedido.id}`} method="POST" className="space-y-2">
            <label className="text-xs font-outfit font-medium text-gray-600 uppercase tracking-wider">
              Chofer asignado
            </label>
            <div className="flex gap-2">
              <select
                name="chofer_id"
                defaultValue={pedido.chofer_id ?? ''}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-outfit text-gray-900 focus:outline-none focus:ring-2 focus:ring-viflomax-azul"
              >
                <option value="">Sin chofer</option>
                {choferes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
            <p className="text-xs text-gray-400 font-outfit">
              Actualmente: {pedido.chofer?.nombre ?? 'Sin asignar'}
            </p>
          </form>

          {/* Cambio de estado */}
          {siguientesEstados.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-outfit font-medium text-gray-600 uppercase tracking-wider">
                Cambiar estado
              </label>
              <div className="flex flex-wrap gap-2">
                {siguientesEstados.map((s) => (
                  <CambiarEstadoButton
                    key={s.value}
                    pedidoId={pedido.id}
                    estado={s.value}
                    label={s.label}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Items del pedido */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-nunito font-semibold text-gray-900">Productos</h3>
        </div>
        {pedido.items.length === 0 ? (
          <div className="px-5 py-6 text-sm font-outfit text-gray-400">
            Sin productos en este pedido.
          </div>
        ) : (
          <table className="w-full text-sm font-outfit">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Producto</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Cant.</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Precio unit.</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Subtotal</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Origen precio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pedido.items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900 font-medium">{item.producto?.nombre ?? item.producto_id}</td>
                  <td className="px-4 py-3 text-gray-700">{item.cantidad}</td>
                  <td className="px-4 py-3 text-gray-700">{formatCLP(Number(item.precio_unitario))}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{formatCLP(Number(item.subtotal))}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs capitalize">{item.precio_origen}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50">
                <td colSpan={3} className="px-4 py-3 text-right font-medium text-gray-700 font-outfit text-sm">Total</td>
                <td className="px-4 py-3 font-bold text-gray-900 font-outfit">{formatCLP(montoTotal)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* Entrega */}
      {pedido.entrega && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
          <h3 className="font-nunito font-semibold text-gray-900">Entrega registrada</h3>
          <div className="grid grid-cols-2 gap-3 text-sm font-outfit">
            <div>
              <span className="text-gray-500 block text-xs uppercase tracking-wider mb-1">Fecha</span>
              <span className="text-gray-900">{formatDate(pedido.entrega.timestamp_entrega)}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-xs uppercase tracking-wider mb-1">Monto cobrado</span>
              <span className="text-gray-900 font-semibold">{formatCLP(pedido.entrega.monto_cobrado ? Number(pedido.entrega.monto_cobrado) : null)}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-xs uppercase tracking-wider mb-1">Método de pago</span>
              <span className="text-gray-900 capitalize">{pedido.entrega.metodo_pago ?? '—'}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-xs uppercase tracking-wider mb-1">Bidones vacíos</span>
              <span className="text-gray-900">{pedido.entrega.bidones_vacios_recibidos}</span>
            </div>
            {pedido.entrega.observaciones && (
              <div className="col-span-2">
                <span className="text-gray-500 block text-xs uppercase tracking-wider mb-1">Observaciones</span>
                <span className="text-gray-700">{pedido.entrega.observaciones}</span>
              </div>
            )}
            {pedido.entrega.foto_url && (
              <div className="col-span-2">
                <span className="text-gray-500 block text-xs uppercase tracking-wider mb-1">Foto</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pedido.entrega.foto_url}
                  alt="Foto de entrega"
                  className="rounded-lg max-h-48 border border-gray-200"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

