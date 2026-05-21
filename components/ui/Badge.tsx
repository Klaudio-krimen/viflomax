import React, { ReactNode } from 'react'
import type { EstadoPedido } from '@/lib/types'

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'default'
type BadgeSize = 'sm' | 'md'

type BadgeProps = {
  variant?: BadgeVariant
  size?: BadgeSize
  children: ReactNode
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
  default: 'bg-gray-100 text-gray-700',
}

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
}

export function Badge({ variant = 'default', size = 'md', children }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full font-outfit font-medium',
        variantClasses[variant],
        sizeClasses[size],
      ].join(' ')}
    >
      {children}
    </span>
  )
}

// ============================================================================
// HELPER: Badge para estados de pedido
// ============================================================================

type EstadoPedidoBadgeResult = {
  variant: BadgeVariant
  label: string
}

export function estadoPedidoBadge(estado: EstadoPedido): EstadoPedidoBadgeResult {
  const map: Record<EstadoPedido, EstadoPedidoBadgeResult> = {
    nuevo: { variant: 'default', label: 'Nuevo' },
    confirmado: { variant: 'info', label: 'Confirmado' },
    en_ruta: { variant: 'warning', label: 'En ruta' },
    entregado: { variant: 'success', label: 'Entregado' },
    cancelado: { variant: 'error', label: 'Cancelado' },
  }
  return map[estado]
}
