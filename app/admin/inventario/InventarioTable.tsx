'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { EliminarButton } from '@/components/ui/EliminarButton'
import type { InventarioConProducto } from './page'

type AjusteForm = {
  stock_bodega: string
  stock_vacios_bodega: string
}

type NuevoProductoForm = {
  nombre: string
  categoria: string
  descripcion: string
  precio_base: string
  stock_bodega: string
  stock_minimo_alerta: string
}

const CATEGORIAS = [
  { value: 'envase', label: 'Envase' },
  { value: 'recarga', label: 'Recarga' },
  { value: 'dispensador', label: 'Dispensador' },
  { value: 'accesorio', label: 'Accesorio' },
]

type InventarioTableProps = {
  inventario: InventarioConProducto[]
}

export function InventarioTable({ inventario }: InventarioTableProps) {
  const router = useRouter()

  // --- Ajuste stock ---
  const [ajusteOpen, setAjusteOpen] = useState(false)
  const [selectedRow, setSelectedRow] = useState<InventarioConProducto | null>(null)
  const [ajuste, setAjuste] = useState<AjusteForm>({ stock_bodega: '', stock_vacios_bodega: '' })
  const [savingAjuste, setSavingAjuste] = useState(false)
  const [ajusteError, setAjusteError] = useState<string | null>(null)

  // --- Editar producto ---
  const [editOpen, setEditOpen] = useState(false)
  const [editRow, setEditRow] = useState<InventarioConProducto | null>(null)
  const [editForm, setEditForm] = useState({ nombre: '', categoria: 'envase', precio_base: '' })
  const [savingEdit, setSavingEdit] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  // --- Nuevo producto ---
  const [nuevoOpen, setNuevoOpen] = useState(false)
  const [nuevoForm, setNuevoForm] = useState<NuevoProductoForm>({
    nombre: '',
    categoria: 'envase',
    descripcion: '',
    precio_base: '',
    stock_bodega: '0',
    stock_minimo_alerta: '5',
  })
  const [savingNuevo, setSavingNuevo] = useState(false)
  const [nuevoError, setNuevoError] = useState<string | null>(null)

  const openEdit = (row: InventarioConProducto) => {
    setEditRow(row)
    setEditForm({
      nombre: row.producto?.nombre ?? '',
      categoria: row.producto?.categoria ?? 'envase',
      precio_base: row.producto?.precio_base != null ? String(row.producto.precio_base) : '',
    })
    setEditError(null)
    setEditOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editRow || !editForm.nombre.trim()) {
      setEditError('El nombre es obligatorio')
      return
    }
    setSavingEdit(true)
    setEditError(null)
    try {
      const res = await fetch(`/api/productos/${editRow.producto_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: editForm.nombre.trim(),
          categoria: editForm.categoria,
          precio_base: editForm.precio_base ? Number(editForm.precio_base) : null,
        }),
      })
      const json = await res.json() as { error?: string }
      if (!res.ok) throw new Error(json.error ?? 'Error al guardar')
      setEditOpen(false)
      router.refresh()
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setSavingEdit(false)
    }
  }

  const openAjuste = (row: InventarioConProducto) => {
    setSelectedRow(row)
    setAjuste({
      stock_bodega: String(row.stock_bodega),
      stock_vacios_bodega: String(row.stock_vacios_bodega),
    })
    setAjusteError(null)
    setAjusteOpen(true)
  }

  const handleSaveAjuste = async () => {
    if (!selectedRow) return
    setSavingAjuste(true)
    setAjusteError(null)
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
      setAjusteOpen(false)
      router.refresh()
    } catch (err: unknown) {
      setAjusteError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setSavingAjuste(false)
    }
  }

  const openNuevo = () => {
    setNuevoForm({ nombre: '', categoria: 'envase', descripcion: '', precio_base: '', stock_bodega: '0', stock_minimo_alerta: '5' })
    setNuevoError(null)
    setNuevoOpen(true)
  }

  const handleSaveNuevo = async () => {
    if (!nuevoForm.nombre.trim()) {
      setNuevoError('El nombre del producto es obligatorio')
      return
    }
    setSavingNuevo(true)
    setNuevoError(null)
    try {
      const res = await fetch('/api/productos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nuevoForm.nombre.trim(),
          categoria: nuevoForm.categoria,
          descripcion: nuevoForm.descripcion.trim() || undefined,
          precio_base: nuevoForm.precio_base ? Number(nuevoForm.precio_base) : undefined,
          stock_bodega: Number(nuevoForm.stock_bodega) || 0,
          stock_minimo_alerta: Number(nuevoForm.stock_minimo_alerta) || 5,
        }),
      })
      const json = await res.json() as { error?: string }
      if (!res.ok) throw new Error(json.error ?? 'Error al crear producto')
      setNuevoOpen(false)
      router.refresh()
    } catch (err: unknown) {
      setNuevoError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setSavingNuevo(false)
    }
  }

  return (
    <>
      {/* Encabezado con botón */}
      <div className="flex justify-end">
        <Button variant="primary" size="sm" onClick={openNuevo}>
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
          Nuevo Producto
        </Button>
      </div>

      {/* Tabla */}
      {inventario.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-10 text-center text-gray-500 font-outfit text-sm">
          No hay registros de inventario. Crea tu primer producto con el botón de arriba.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-outfit">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Producto</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Categoría</th>
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
                      <td className="px-4 py-3 text-gray-500 capitalize">
                        {row.producto?.categoria ?? '—'}
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
                        <div className="flex items-center gap-2 flex-wrap">
                          <Button variant="ghost" size="sm" onClick={() => openAjuste(row)}>
                            Ajustar Stock
                          </Button>
                          <button
                            type="button"
                            onClick={() => openEdit(row)}
                            className="px-2.5 py-1 text-xs bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium font-outfit border border-gray-200"
                          >
                            Editar
                          </button>
                          <EliminarButton
                            url={`/api/productos/${row.producto_id}`}
                            confirmar={`¿Eliminar "${row.producto?.nombre}"? Se eliminará también su inventario y precios asociados.`}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal editar producto */}
      <Modal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title={`Editar — ${editRow?.producto?.nombre ?? ''}`}
        size="md"
      >
        <div className="space-y-4">
          {editError && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg px-3 py-2 text-sm font-outfit">
              {editError}
            </div>
          )}
          <Input
            label="Nombre *"
            value={editForm.nombre}
            onChange={(e) => setEditForm((p) => ({ ...p, nombre: e.target.value }))}
            required
          />
          <div className="flex flex-col gap-1.5">
            <label className="font-medium text-sm text-gray-700 font-outfit">Categoría</label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIAS.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setEditForm((p) => ({ ...p, categoria: cat.value }))}
                  className={`py-2 px-3 rounded-lg border text-sm font-outfit font-medium transition-colors ${
                    editForm.categoria === cat.value
                      ? 'bg-viflomax-azul text-white border-viflomax-azul'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
          <Input
            label="Precio base (CLP)"
            type="number"
            min="0"
            value={editForm.precio_base}
            onChange={(e) => setEditForm((p) => ({ ...p, precio_base: e.target.value }))}
            placeholder="0"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setEditOpen(false)} disabled={savingEdit}>
              Cancelar
            </Button>
            <Button variant="primary" size="sm" loading={savingEdit} onClick={handleSaveEdit}>
              Guardar Cambios
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal ajuste de stock */}
      <Modal
        isOpen={ajusteOpen}
        onClose={() => setAjusteOpen(false)}
        title={`Ajustar Stock — ${selectedRow?.producto?.nombre ?? ''}`}
        size="sm"
      >
        <div className="space-y-4">
          {ajusteError && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg px-3 py-2 text-sm font-outfit">
              {ajusteError}
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
            <Button variant="ghost" size="sm" onClick={() => setAjusteOpen(false)} disabled={savingAjuste}>
              Cancelar
            </Button>
            <Button variant="primary" size="sm" loading={savingAjuste} onClick={handleSaveAjuste}>
              Guardar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal nuevo producto */}
      <Modal
        isOpen={nuevoOpen}
        onClose={() => setNuevoOpen(false)}
        title="Nuevo Producto"
        size="md"
      >
        <div className="space-y-4">
          {nuevoError && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg px-3 py-2 text-sm font-outfit">
              {nuevoError}
            </div>
          )}

          <Input
            label="Nombre *"
            id="np-nombre"
            value={nuevoForm.nombre}
            onChange={(e) => setNuevoForm((p) => ({ ...p, nombre: e.target.value }))}
            placeholder="Ej: Bidón 20L, Recarga 10L…"
            required
          />

          {/* Categoría */}
          <div className="flex flex-col gap-1.5">
            <label className="font-medium text-sm text-gray-700 font-outfit">Categoría *</label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIAS.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setNuevoForm((p) => ({ ...p, categoria: cat.value }))}
                  className={`py-2 px-3 rounded-lg border text-sm font-outfit font-medium transition-colors ${
                    nuevoForm.categoria === cat.value
                      ? 'bg-viflomax-azul text-white border-viflomax-azul'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Descripción"
            id="np-descripcion"
            value={nuevoForm.descripcion}
            onChange={(e) => setNuevoForm((p) => ({ ...p, descripcion: e.target.value }))}
            placeholder="Descripción opcional"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Precio base (CLP)"
              id="np-precio"
              type="number"
              min="0"
              value={nuevoForm.precio_base}
              onChange={(e) => setNuevoForm((p) => ({ ...p, precio_base: e.target.value }))}
              placeholder="0"
            />
            <Input
              label="Stock inicial"
              id="np-stock"
              type="number"
              min="0"
              value={nuevoForm.stock_bodega}
              onChange={(e) => setNuevoForm((p) => ({ ...p, stock_bodega: e.target.value }))}
            />
          </div>

          <Input
            label="Alerta de stock mínimo"
            id="np-alerta"
            type="number"
            min="0"
            value={nuevoForm.stock_minimo_alerta}
            onChange={(e) => setNuevoForm((p) => ({ ...p, stock_minimo_alerta: e.target.value }))}
            helperText="Se mostrará alerta cuando el stock baje de este número"
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setNuevoOpen(false)} disabled={savingNuevo}>
              Cancelar
            </Button>
            <Button variant="primary" size="sm" loading={savingNuevo} onClick={handleSaveNuevo}>
              Crear Producto
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
