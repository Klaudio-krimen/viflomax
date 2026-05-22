import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { EntregaItem } from '@/components/chofer/EntregaItem'
import { formatFecha } from '@/lib/utils'
import type { Pedido, Cliente, PedidoItem, Producto } from '@/lib/types'

export const metadata = { title: 'Mis Entregas — Viflomax' }

type PedidoConItems = Pedido & {
  cliente: Cliente | null
  items: (PedidoItem & { producto: Producto })[]
}

export default async function ChoferPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) redirect('/login')

  const choferIdMeta = user.app_metadata?.chofer_id as string | undefined

  if (!choferIdMeta) {
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

  // Fecha de hoy en zona horaria local (Chile) — usar UTC con rango de 24h
  const hoy = new Date()
  const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).toISOString()
  const finDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1).toISOString()

  const { data: pedidos } = await supabase
    .from('pedidos')
    .select(
      `
      *,
      cliente:clientes(id, nombre, telefono, email, direccion, comuna, sector, tipo_cliente, empresa_id, activo, notas, created_at),
      items:pedido_items(
        id, pedido_id, producto_id, cantidad, precio_unitario, precio_origen, subtotal,
        producto:productos(id, nombre, descripcion, categoria, precio_base, activo)
      )
    `
    )
    .eq('chofer_id', choferIdMeta)
    .in('estado', ['confirmado', 'en_ruta'])
    .gte('fecha_pedido', inicioDia)
    .lt('fecha_pedido', finDia)
    .order('numero_pedido', { ascending: true })

  const pedidosList = (pedidos ?? []) as PedidoConItems[]
  const fechaHoy = formatFecha(hoy)
  const totalPendientes = pedidosList.length

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="space-y-1">
        <h1 className="font-nunito font-extrabold text-2xl text-gray-900">
          Mis Entregas
        </h1>
        <p className="font-outfit text-base text-gray-500">{fechaHoy}</p>
      </div>

      {/* Contador + acceso a inventario */}
      <div className="flex items-center justify-between">
        <span className="font-outfit text-base font-semibold text-gray-700">
          {totalPendientes === 0
            ? 'Sin entregas pendientes'
            : `${totalPendientes} entrega${totalPendientes !== 1 ? 's' : ''} pendiente${totalPendientes !== 1 ? 's' : ''}`}
        </span>
        <Link
          href="/chofer/inventario"
          className="text-sm font-outfit text-viflomax-azul-oscuro underline underline-offset-2"
        >
          Ver inventario
        </Link>
      </div>

      {/* Lista de pedidos */}
      {pedidosList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 text-gray-300"
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
          <p className="font-outfit text-gray-500 text-lg font-medium">
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
