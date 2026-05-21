import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { RegistrarEntregaForm } from '@/components/chofer/RegistrarEntregaForm'
import type { PedidoConDetalle } from '@/lib/types'

export const metadata = { title: 'Registrar Entrega — Viflomax' }

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function EntregaPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) redirect('/login')

  const { data: pedido, error } = await supabase
    .from('pedidos')
    .select(
      `
      *,
      cliente:clientes(id, nombre, telefono, email, direccion, comuna, sector, tipo_cliente, empresa_id, activo, notas, created_at),
      empresa:empresas(id, razon_social, rut, contacto, telefono, email, direccion, activo, notas_comerciales, created_at),
      chofer:choferes(id, user_id, nombre, telefono, vehiculo, activo),
      items:pedido_items(
        id, pedido_id, producto_id, cantidad, precio_unitario, precio_origen, subtotal,
        producto:productos(id, nombre, descripcion, categoria, precio_base, activo)
      ),
      entrega:entregas(id, pedido_id, chofer_id, timestamp_entrega, latitud, longitud, bidones_vacios_recibidos, monto_cobrado, metodo_pago, foto_url, observaciones)
    `
    )
    .eq('id', id)
    .single()

  if (error || !pedido) {
    notFound()
  }

  const pedidoConDetalle = pedido as PedidoConDetalle

  // Verificar que el chofer tiene acceso a este pedido
  const rol = user.app_metadata?.role as string | undefined
  const choferIdMeta = user.app_metadata?.chofer_id as string | undefined

  if (rol === 'chofer' && pedidoConDetalle.chofer_id !== choferIdMeta) {
    redirect('/chofer')
  }

  // Si ya fue entregado, redirigir al listado
  if (pedidoConDetalle.estado === 'entregado') {
    redirect('/chofer')
  }

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="flex items-center gap-3">
        <Link
          href="/chofer"
          className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
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
          <h1 className="font-nunito font-extrabold text-xl text-gray-900">
            Registrar Entrega
          </h1>
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
              {pedidoConDetalle.cliente.comuna
                ? `, ${pedidoConDetalle.cliente.comuna}`
                : ''}
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
