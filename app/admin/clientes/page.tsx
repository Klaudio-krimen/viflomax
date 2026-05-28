import Link from 'next/link'
import { db } from '@/lib/db'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { ClienteConEmpresa } from '@/lib/types'
import { Prisma } from '@prisma/client'

export const metadata = { title: 'Clientes — Viflomax Admin' }

type SearchParams = { q?: string }

const TIPO_BADGE: Record<string, { variant: 'success' | 'info' | 'default'; label: string }> = {
  mayorista: { variant: 'success', label: 'Mayorista' },
  detalle: { variant: 'info', label: 'Detalle' },
  nuevo: { variant: 'default', label: 'Nuevo' },
}

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const q = params.q?.trim() ?? ''

  const where: Prisma.ClienteWhereInput = q
    ? {
        OR: [
          { nombre: { contains: q, mode: 'insensitive' } },
          { telefono: { contains: q, mode: 'insensitive' } },
        ],
      }
    : {}

  const [clientes, total] = await Promise.all([
    db.cliente.findMany({
      where,
      orderBy: { nombre: 'asc' },
      take: 50,
      include: { empresa: { select: { id: true, razon_social: true } } },
    }),
    db.cliente.count({ where }),
  ])

  const clientesList = clientes.map((c) => ({
    ...c,
    created_at: c.created_at.toISOString(),
  })) as unknown as ClienteConEmpresa[]

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-nunito text-2xl font-extrabold text-gray-900">Clientes</h2>
          <p className="text-sm font-outfit text-gray-500 mt-0.5">{total} clientes registrados</p>
        </div>
        <Link href="/admin/clientes/nuevo">
          <Button variant="primary" size="sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Cliente
          </Button>
        </Link>
      </div>

      {/* Buscador */}
      <form action="/admin/clientes" method="GET" className="flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre o teléfono…"
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm font-outfit focus:outline-none focus:ring-2 focus:ring-viflomax-azul"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-viflomax-verde text-white text-sm font-outfit rounded-lg hover:bg-viflomax-verde-claro transition-colors"
        >
          Buscar
        </button>
        {q && (
          <Link
            href="/admin/clientes"
            className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-outfit rounded-lg hover:bg-gray-50 transition-colors"
          >
            Limpiar
          </Link>
        )}
      </form>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {clientesList.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500 font-outfit text-sm">
            {q ? `No se encontraron clientes para "${q}".` : 'No hay clientes registrados.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-outfit">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Teléfono
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Sector
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Empresa
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {clientesList.map((cliente) => {
                  const tipoBadge = TIPO_BADGE[cliente.tipo_cliente] ?? TIPO_BADGE.nuevo
                  return (
                    <tr key={cliente.id} className="hover:bg-blue-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{cliente.nombre}</td>
                      <td className="px-4 py-3 text-gray-500">{cliente.telefono ?? '—'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={tipoBadge.variant} size="sm">
                          {tipoBadge.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{cliente.sector ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {cliente.empresa?.razon_social ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/clientes/${cliente.id}`}
                          className="px-2.5 py-1 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                        >
                          Ver ficha
                        </Link>
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
