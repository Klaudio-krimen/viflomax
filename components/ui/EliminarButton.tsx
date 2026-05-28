'use client'

import React, { useTransition } from 'react'
import { useRouter } from 'next/navigation'

type EliminarButtonProps = {
  url: string
  confirmar?: string
  label?: string
  className?: string
  onSuccess?: () => void
}

export function EliminarButton({
  url,
  confirmar = '¿Eliminar este registro? Esta acción no se puede deshacer.',
  label = 'Eliminar',
  className,
  onSuccess,
}: EliminarButtonProps) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleClick() {
    if (!window.confirm(confirmar)) return
    startTransition(async () => {
      try {
        await fetch(url, { method: 'DELETE' })
      } catch {
        // silencioso
      }
      if (onSuccess) onSuccess()
      else router.refresh()
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={
        className ??
        'px-2.5 py-1 text-xs bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium font-outfit border border-red-200 disabled:opacity-50'
      }
    >
      {pending ? '…' : label}
    </button>
  )
}
