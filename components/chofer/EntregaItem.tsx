import Link from 'next/link'
import type { Pedido, Cliente, PedidoItem, Producto } from '@/lib/types'
import { formatCLP, colorEstado } from '@/lib/utils'

type PedidoItemConProducto = PedidoItem & { producto: Producto }

type EntregaItemProps = {
  pedido: Pedido & {
    cliente: Cliente | null
    items: PedidoItemConProducto[]
  }
}

const ESTADO_LABELS: Record<string, string> = {
  nuevo: 'Nuevo',
  confirmado: 'Confirmado',
  en_ruta: 'En Ruta',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}

export function EntregaItem({ pedido }: EntregaItemProps) {
  const esEntregado = pedido.estado === 'entregado'

  return (
    <article
      className={[
        'bg-white rounded-xl shadow-sm overflow-hidden transition-opacity',
        esEntregado
          ? 'border border-gray-200 opacity-70'
          : 'border-2 border-viflomax-verde',
      ].join(' ')}
    >
      <div className="py-4 px-5 space-y-3">
        {/* Cabecera: número de pedido + badge de estado */}
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-nunito font-extrabold text-xl text-gray-900">
            {pedido.numero_pedido ? `Pedido #${pedido.numero_pedido}` : 'Sin número'}
          </h2>
          <span
            className={`shrink-0 inline-block px-2.5 py-1 rounded-full text-xs font-outfit font-semibold ${colorEstado(
              pedido.estado
            )}`}
          >
            {ESTADO_LABELS[pedido.estado] ?? pedido.estado}
          </span>
        </div>

        {/* Cliente y dirección */}
        <div className="space-y-0.5">
          <p className="font-outfit font-semibold text-base text-gray-800 leading-snug">
            {pedido.cliente?.nombre ?? <span className="text-gray-400 italic">Sin cliente</span>}
          </p>
          {pedido.cliente?.direccion && (
            <p className="font-outfit text-sm text-gray-500 leading-snug">
              {pedido.cliente.direccion}
              {pedido.cliente.comuna ? `, ${pedido.cliente.comuna}` : ''}
            </p>
          )}
        </div>

        {/* Lista de productos */}
        {pedido.items.length > 0 && (
          <ul className="space-y-1" aria-label="Productos del pedido">
            {pedido.items.map((item) => (
              <li
                key={item.id}
                className="flex justify-between text-sm font-outfit text-gray-700"
              >
                <span>
                  <span className="font-semibold text-viflomax-azul-oscuro">
                    {item.cantidad}&times;
                  </span>{' '}
                  {item.producto.nombre}
                </span>
                <span className="text-gray-500">{formatCLP(item.subtotal)}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Monto total */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-2">
          <span className="font-outfit text-sm text-gray-500">Total</span>
          <span className="font-nunito font-extrabold text-lg text-gray-900">
            {pedido.monto_total != null ? formatCLP(pedido.monto_total) : '—'}
          </span>
        </div>

        {/* Acción */}
        {esEntregado ? (
          <div className="flex items-center gap-2 py-2 text-emerald-700 font-outfit font-semibold text-base">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Entregado
          </div>
        ) : (
          <Link
            href={`/chofer/entrega/${pedido.id}`}
            className="block w-full text-center bg-viflomax-verde hover:bg-viflomax-verde-claro text-white font-outfit font-bold text-base rounded-xl py-3 px-4 transition-colors min-h-[52px] flex items-center justify-center"
          >
            Registrar Entrega
          </Link>
        )}
      </div>
    </article>
  )
}
