'use client'

import { EliminarButton } from '@/components/ui/EliminarButton'

export function EliminarPedidoButton({ id, numero }: { id: string; numero: number | null }) {
  return (
    <EliminarButton
      url={`/api/pedidos/${id}`}
      confirmar={`¿Eliminar pedido${numero ? ` #${numero}` : ''}? Esta acción no se puede deshacer.`}
    />
  )
}
