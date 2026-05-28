import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { RegistrarEntregaForm } from '@/components/chofer/RegistrarEntregaForm'
import type { PedidoConDetalle } from '@/lib/types'

export const metadata = { title: 'Registrar Entrega — Viflomax' }

type PageProps = { params: Promise<{ id: string }> }

export default async function EntregaPage({ params }: PageProps) {
  const { id } = await params
  const session = await auth()

  if (!session?.user) redirect('/login')

  const pedidoRaw = await db.pedido.findUnique({
    where: { id },
    include: {
      cliente: true,
      empresa: true,
      chofer: true,
      items: { include: { producto: true } },
      entrega: true,
    },
  })

  if (!pedidoRaw) notFound()

  // Verificar acceso del chofer
  if (session.user.role === 'chofer') {
    const chofer = await db.chofer.findUnique({
      where: { user_id: session.user.id },
      select: { id: true },
    })
    if (!chofer || pedidoRaw.chofer_id !== chofer.id) {
      redirect('/chofer')
    }
  }

  // Si ya fue entregado, redirigir
  if (pedidoRaw.estado === 'entregado') {
    redirect('/chofer')
  }

  // Adaptar tipos
  const pedidoConDetalle = {
    ...pedidoRaw,
    fecha_pedido: pedidoRaw.fecha_pedido.toISOString(),
    created_at: pedidoRaw.created_at.toISOString(),
    monto_total: pedidoRaw.monto_total ? Number(pedidoRaw.monto_total) : null,
    fecha_entrega_programada: pedidoRaw.fecha_entrega_programada?.toISOString() ?? null,
    cliente: pedidoRaw.cliente
      ? { ...pedidoRaw.cliente, created_at: pedidoRaw.cliente.created_at.toISOString() }
      : null,
    empresa: pedidoRaw.empresa
      ? { ...pedidoRaw.empresa, created_at: pedidoRaw.empresa.created_at.toISOString() }
      : null,
    items: pedidoRaw.items.map((item) => ({
      ...item,
      precio_unitario: Number(item.precio_unitario),
      subtotal: Number(item.subtotal),
      producto: { ...item.producto, precio_base: item.producto.precio_base ? Number(item.producto.precio_base) : null },
    })),
    entrega: pedidoRaw.entrega
      ? {
          ...pedidoRaw.entrega,
          timestamp_entrega: pedidoRaw.entrega.timestamp_entrega.toISOString(),
          monto_cobrado: pedidoRaw.entrega.monto_cobrado ? Number(pedidoRaw.entrega.monto_cobrado) : null,
          latitud: pedidoRaw.entrega.latitud ? Number(pedidoRaw.entrega.latitud) : null,
          longitud: pedidoRaw.entrega.longitud ? Number(pedidoRaw.entrega.longitud) : null,
        }
      : null,
  } as unknown as PedidoConDetalle

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="flex items-center gap-3">
        <Link
          href="/chofer"
          className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-viflomax-azul"
          aria-label="Volver a mis entregas"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="font-nunito font-extrabold text-xl text-gray-900">Registrar Entrega</h1>
          {pedidoConDetalle.numero_pedido && (
            <p className="font-outfit text-sm text-gray-500">
              Pedido #{pedidoConDetalle.numero_pedido}
            </p>
          )}
        </div>
      </div>

      {/* Resumen del cliente */}
      {pedidoConDetalle.cliente && (
        <div className="bg-viflomax-azul bg-opacity-10 rounded-xl px-5 py-3 border border-viflomax-azul border-opacity-20">
          <p className="font-outfit font-semibold text-base text-gray-900">
            {pedidoConDetalle.cliente.nombre}
          </p>
          {pedidoConDetalle.cliente.direccion && (
            <p className="font-outfit text-sm text-gray-600 mt-0.5">
              {pedidoConDetalle.cliente.direccion}
              {pedidoConDetalle.cliente.comuna ? `, ${pedidoConDetalle.cliente.comuna}` : ''}
            </p>
          )}
          {pedidoConDetalle.cliente.telefono && (
            <a
              href={`tel:${pedidoConDetalle.cliente.telefono}`}
              className="inline-flex items-center gap-1 font-outfit text-sm text-viflomax-azul-oscuro mt-1"
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
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              {pedidoConDetalle.cliente.telefono}
            </a>
          )}
        </div>
      )}

      {/* Formulario */}
      <RegistrarEntregaForm pedido={pedidoConDetalle} />
    </div>
  )
}
