'use client'

import React, { useState, useEffect, FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

type PrecioEditorTipo = 'mayorista' | 'detalle'

type PrecioEditorProps = {
  tipo: PrecioEditorTipo
  empresaId?: string
  onSave: () => void
  onCancel: () => void
}

type ProductoOption = { id: string; nombre: string; categoria: string }

function validarVolumenes(min: string, max: string): string | null {
  if (!min) return null
  const minNum = Number(min)
  if (isNaN(minNum) || minNum < 0) return 'Volumen mínimo inválido'
  if (max) {
    const maxNum = Number(max)
    if (isNaN(maxNum) || maxNum < minNum) return 'Volumen máximo debe ser ≥ volumen mínimo'
  }
  return null
}

export function PrecioEditor({ tipo, empresaId, onSave, onCancel }: PrecioEditorProps) {
  const [productos, setProductos] = useState<ProductoOption[]>([])
  const [loadingProductos, setLoadingProductos] = useState(true)

  const [productoId, setProductoId] = useState('')
  const [volMin, setVolMin] = useState('1')
  const [volMax, setVolMax] = useState('')
  const [precio, setPrecio] = useState('')
  const [sector, setSector] = useState('')
  const [vigentDesde, setVigentDesde] = useState(() => new Date().toISOString().split('T')[0])
  const [vigentHasta, setVigentHasta] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/productos')
      .then((r) => r.json())
      .then((json: { data?: ProductoOption[] }) => setProductos(json.data ?? []))
      .catch(() => setProductos([]))
      .finally(() => setLoadingProductos(false))
  }, [])

  const volError = validarVolumenes(volMin, volMax)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (!productoId) { setError('Selecciona un producto'); return }
    if (!precio || isNaN(Number(precio)) || Number(precio) < 0) { setError('Precio inválido'); return }
    if (volError) { setError(volError); return }

    setLoading(true)
    try {
      const endpoint = tipo === 'mayorista' ? '/api/precios/mayoristas' : '/api/precios/sectores'
      const body =
        tipo === 'mayorista'
          ? {
              empresa_id: empresaId,
              producto_id: productoId,
              volumen_minimo: Number(volMin) || 1,
              volumen_maximo: volMax ? Number(volMax) : null,
              precio: Number(precio),
              vigente_desde: vigentDesde,
              vigente_hasta: vigentHasta || null,
            }
          : {
              producto_id: productoId,
              sector: sector || null,
              cantidad_minima: Number(volMin) || 1,
              cantidad_maxima: volMax ? Number(volMax) : null,
              precio: Number(precio),
              vigente_desde: vigentDesde,
              vigente_hasta: vigentHasta || null,
            }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error((json as { error?: string }).error ?? 'Error al guardar')
      }
      onSave()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg px-4 py-2.5 text-sm font-outfit">
          {error}
        </div>
      )}

      {/* Producto */}
      <div className="flex flex-col gap-1">
        <label htmlFor="pe-producto" className="font-medium text-sm text-gray-700 font-outfit">
          Producto <span className="text-red-500" aria-hidden="true">*</span>
        </label>
        {loadingProductos ? (
          <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
        ) : productos.length === 0 ? (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 font-outfit">
            No hay productos. Crea productos primero en Inventario.
          </p>
        ) : (
          <select
            id="pe-producto"
            required
            value={productoId}
            onChange={(e) => setProductoId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-outfit text-gray-900 focus:outline-none focus:ring-2 focus:ring-viflomax-azul"
          >
            <option value="">Seleccionar producto…</option>
            {productos.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre} ({p.categoria})</option>
            ))}
          </select>
        )}
      </div>

      {/* Sector (solo detalle) */}
      {tipo === 'detalle' && (
        <Input
          label="Sector"
          id="pe-sector"
          value={sector}
          onChange={(e) => setSector(e.target.value)}
          placeholder="ej: sur, norte, centro (opcional)"
          helperText="Deja vacío para aplicar a todos los sectores"
        />
      )}

      {/* Volúmenes */}
      <div className="grid grid-cols-2 gap-3">
        <Input
          label={tipo === 'mayorista' ? 'Vol. mínimo' : 'Cant. mínima'}
          id="pe-vol-min" type="number" min="1" step="1" required
          value={volMin} onChange={(e) => setVolMin(e.target.value)}
          error={volError ?? undefined}
        />
        <Input
          label={tipo === 'mayorista' ? 'Vol. máximo' : 'Cant. máxima'}
          id="pe-vol-max" type="number" min="1" step="1"
          value={volMax} onChange={(e) => setVolMax(e.target.value)}
          placeholder="sin límite" helperText="Opcional"
        />
      </div>

      <Input
        label="Precio (CLP)" id="pe-precio" type="number" min="0" step="1" required
        value={precio} onChange={(e) => setPrecio(e.target.value)} placeholder="ej: 2500"
      />

      <div className="grid grid-cols-2 gap-3">
        <Input label="Vigente desde" id="pe-desde" type="date" required
          value={vigentDesde} onChange={(e) => setVigentDesde(e.target.value)}
        />
        <Input label="Vigente hasta" id="pe-hasta" type="date"
          value={vigentHasta} onChange={(e) => setVigentHasta(e.target.value)}
          helperText="Opcional"
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" size="sm" loading={loading}
          disabled={loadingProductos || productos.length === 0}>
          Guardar
        </Button>
      </div>
    </form>
  )
}
