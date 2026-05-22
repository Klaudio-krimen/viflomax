'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { PrecioEditor } from '@/components/admin/PrecioEditor'

export function NuevoPrecioButton() {
  const [modalOpen, setModalOpen] = useState(false)
  const router = useRouter()

  const handleSave = () => {
    setModalOpen(false)
    router.refresh()
  }

  return (
    <>
      <Button variant="primary" size="sm" onClick={() => setModalOpen(true)}>
        + Nuevo Precio
      </Button>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nuevo Precio por Sector"
        size="md"
      >
        <PrecioEditor
          tipo="detalle"
          onSave={handleSave}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>
    </>
  )
}
