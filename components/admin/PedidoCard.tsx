'use client'

import React, { useState } from 'react'
import { Badge, estadoPedidoBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { Pedido, Cliente, EstadoPedido } from '@/lib/types'

type PedidoCardProps = {
  pedido: Pedido
  cliente: Cliente | null
  onEstadoChange?: (pedidoId: string, nuevoEstado: EstadoPedido) => void
}

const ESTADOS: { value: EstadoPedido; label: string }[] = [
  { value: 'nuevo', label: 'Nuevo' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'en_ruta', label: 'En ruta' },
  { value: 'entregado', label: 'Entregado' },
  { value: 'cancelado', label: 'Cancelado' },
]

function formatCLP(amount: number | null): string {
  if (amount === null) return '—'
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function PedidoCard({ pedido, cliente, onEstadoChange }: PedidoCardProps) {
  const [showEstadoMenu, setShowEstadoMenu] = useState(false)
  const badgeProps = estadoPedidoBadge(pedido.estado)

  const handleEstadoSelect = (estado: EstadoPedido) => {
    setShowEstadoMenu(false)
    onEstadoChange?.(pedido.id, estado)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {pedido.numero_pedido && (
            <p className="text-xs font-outfit text-gray-400 mb-0.5">#{pedido.numero_pedido}</p>
          )}
          <p className="font-nunito font-semibold text-gray-900 truncate">
            {cliente?.nombre ?? 'Cliente desconocido'}
          </p>
          <p className="text-sm font-outfit text-gray-500 mt-0.5">
            {formatDate(pedido.fecha_pedido)}
          </p>
        </div>
        <Badge variant={badgeProps.variant} size="sm">
          {badgeProps.label}
        </Badge>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <p className="text-base font-nunito font-bold text-gray-800">
          {formatCLP(pedido.monto_total)}
        </p>
        <div className="flex items-center gap-2">
          {onEstadoChange && (
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEstadoMenu((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={showEstadoMenu}
              >
                Cambiar estado
              </Button>
              {showEstadoMenu && (
                <div
                  className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-10"
                  role="listbox"
                  aria-label="Seleccionar estado"
                >
                  {ESTADOS.map((e) => (
                    <button
                      key={e.value}
                      role="option"
                      aria-selected={pedido.estado === e.value}
                      onClick={() => handleEstadoSelect(e.value)}
                      className={[
                        'w-full text-left px-4 py-2 text-sm font-outfit hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg transition-colors',
                        pedido.estado === e.value ? 'font-semibold text-viflomax-verde' : 'text-gray-700',
                      ].join(' ')}
                    >
                      {e.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
