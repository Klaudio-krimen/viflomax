'use client'

export function CambiarEstadoButton({
  pedidoId,
  estado,
  label,
}: {
  pedidoId: string
  estado: string
  label: string
}) {
  const isDestructive = estado === 'cancelado'

  async function handleClick() {
    await fetch(`/api/pedidos/${pedidoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado }),
    })
    window.location.reload()
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`px-3 py-1.5 text-xs rounded-lg font-outfit font-medium transition-colors border ${
        isDestructive
          ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
          : 'bg-viflomax-verde text-white border-viflomax-verde hover:opacity-90'
      }`}
    >
      {label}
    </button>
  )
}
