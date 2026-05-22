'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import type { InventarioConProducto } from './page'

type AjusteForm = {
  stock_bodega: string
  stock_vacios_bodega: string
}

type InventarioTableProps = {
  inventario: InventarioConProducto[]
}

export function InventarioTable({ inventario }: InventarioTableProps) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedRow, setSelectedRow] = useState<InventarioConProducto | null>(null)
  const [ajuste, setAjuste] = useState<AjusteForm>({ stock_bodega: '', stock_vacios_bodega: '' })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const openAjuste = (row: InventarioConProducto) => {
    setSelectedRow(row)
    setAjuste({
      stock_bodega: String(row.stock_bodega),
      stock_vacios_bodega: String(row.stock_vacios_bodega),
    })
    setSaveError(null)
    setModalOpen(true)
  }

  const handleSaveAjuste = async () => {
    if (!selectedRow) return
    setSaving(true)
    setSaveError(null)
    try {
      const res = await fetch('/api/inventario', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          producto_id: selectedRow.producto_id,
          stock_bodega: Number(ajuste.stock_bodega),
          stock_vacios_bodega: Number(ajuste.stock_vacios_bodega),
        }),
      })
      const json = await res.json() as { error?: string }
      if (!res.ok) throw new Error(json.error ?? 'Error al guardar')
      setModalOpen(false)
      router.refresh()
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setSaving(false)
    }
  }

  if (inventario.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 px-6 py-10 text-center text-gray-500 font-outfit text-sm">
        No hay registros de inventario.
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-outfit">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Producto</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Stock Bodega</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Stock Vacíos</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">En Ruta</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Alerta</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {inventario.map((row) => {
                const enAlerta = row.stock_bodega < row.stock_minimo_alerta
                return (
                  <tr
                    key={row.id}
                    className={enAlerta ? 'bg-red-50 hover:bg-red-100 transition-colors' : 'hover:bg-blue-50 transition-colors'}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {row.producto?.nombre ?? row.producto_id}
                    </td>
                    <td className="px-4 py-3 text-gray-700 font-semibold">{row.stock_bodega}</td>
                    <td className="px-4 py-3 text-gray-700">{row.stock_vacios_bodega}</td>
                    <td className="px-4 py-3 text-gray-700">{row.stock_en_ruta}</td>
                    <td className="px-4 py-3">
                      {enAlerta ? (
                        <Badge variant="error" size="sm">Stock bajo ({row.stock_minimo_alerta} mín)</Badge>
                      ) : (
                        <Badge variant="success" size="sm">OK</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm" onClick={() => openAjuste(row)}>
                        Ajustar Stock
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal ajuste */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Ajustar Stock — ${selectedRow?.producto?.nombre ?? ''}`}
        size="sm"
      >
        <div className="space-y-4">
          {saveError && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg px-3 py-2 text-sm font-outfit">
              {saveError}
            </div>
          )}
          <Input
            label="Stock en bodega"
            id="aj-stock-bodega"
            type="number"
            min="0"
            value={ajuste.stock_bodega}
            onChange={(e) => setAjuste((prev) => ({ ...prev, stock_bodega: e.target.value }))}
          />
          <Input
            label="Stock vacíos bodega"
            id="aj-stock-vacios"
            type="number"
            min="0"
            value={ajuste.stock_vacios_bodega}
            onChange={(e) => setAjuste((prev) => ({ ...prev, stock_vacios_bodega: e.target.value }))}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button variant="primary" size="sm" loading={saving} onClick={handleSaveAjuste}>
              Guardar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
