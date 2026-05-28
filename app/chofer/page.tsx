import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { EntregaItem } from '@/components/chofer/EntregaItem'
import { formatFecha } from '@/lib/utils'
import type { Pedido, Cliente, PedidoItem, Producto } from '@/lib/types'

export const metadata = { title: 'Mis Entregas — Viflomax' }

type PedidoConItems = Pedido & {
  cliente: Cliente | null
  items: (PedidoItem & { producto: Producto })[]
}

export default async function ChoferPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  // Buscar el registro de chofer vinculado al usuario
  const chofer = await db.chofer.findUnique({
    where: { user_id: session.user.id },
    select: { id: true },
  })

  if (!chofer) {
    return (
      <div className="py-12 text-center space-y-3">
        <p className="font-outfit text-gray-600 text-lg">
          Tu cuenta no está vinculada a ningún chofer.
        </p>
        <p className="font-outfit text-gray-400 text-sm">
          Contacta al administrador para configurar tu perfil.
        </p>
      </div>
    )
  }

  const hoy = new Date()
  const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
  const finDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1)

  const pedidos = await db.pedido.findMany({
    where: {
      chofer_id: chofer.id,
      estado: { in: ['confirmado', 'en_ruta'] },
      fecha_pedido: { gte: inicioDia, lt: finDia },
    },
    orderBy: { numero_pedido: 'asc' },
    include: {
      cliente: true,
      items: { include: { producto: true } },
    },
  })

  // Adaptar tipos para compatibilidad con componentes existentes
  const pedidosList = pedidos.map((p) => ({
    ...p,
    fecha_pedido: p.fecha_pedido.toISOString(),
    created_at: p.created_at.toISOString(),
    monto_total: p.monto_total ? Number(p.monto_total) : null,
    fecha_entrega_programada: p.fecha_entrega_programada?.toISOString() ?? null,
    items: p.items.map((item) => ({
      ...item,
      precio_unitario: Number(item.precio_unitario),
      subtotal: Number(item.subtotal),
    })),
  })) as unknown as PedidoConItems[]

  const fechaHoy = formatFecha(hoy)
  const totalPendientes = pedidosList.length

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="space-y-1">
        <h1 className="font-nunito font-extrabold text-2xl text-gray-900">Mis Entregas</h1>
        <p className="font-outfit text-base text-gray-500">{fechaHoy}</p>
      </div>

      {/* Contador + acceso a inventario */}
      <div className="flex items-center justify-between">
        <span
          className={[
            'font-outfit text-base font-semibold',
            totalPendientes > 0 ? 'text-viflomax-azul-oscuro' : 'text-gray-500',
          ].join(' ')}
        >
          {totalPendientes === 0
            ? 'Sin entregas pendientes'
            : `${totalPendientes} entrega${totalPendientes !== 1 ? 's' : ''} pendiente${totalPendientes !== 1 ? 's' : ''}`}
        </span>
        <Link
          href="/chofer/inventario"
          className="inline-flex items-center gap-1.5 text-sm font-outfit font-semibold text-viflomax-azul-oscuro bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-viflomax-azul"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
          Inventario
        </Link>
      </div>

      {/* Lista de pedidos */}
      {pedidosList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
          <div className="w-20 h-20 rounded-full bg-viflomax-verde bg-opacity-10 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-viflomax-verde opacity-60"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <p className="font-outfit text-gray-600 text-lg font-medium">
            No tienes entregas asignadas hoy
          </p>
          <p className="font-outfit text-gray-400 text-sm">
            Si esperas pedidos, contacta al administrador.
          </p>
        </div>
      ) : (
        <ul className="space-y-3" aria-label="Lista de entregas del día">
          {pedidosList.map((pedido) => (
            <li key={pedido.id}>
              <EntregaItem pedido={pedido} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
