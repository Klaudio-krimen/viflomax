'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { PrecioEditor } from '@/components/admin/PrecioEditor'

type AgregarTramoButtonProps = {
  empresaId: string
  empresaNombre: string
}

export function AgregarTramoButton({ empresaId, empresaNombre }: AgregarTramoButtonProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const router = useRouter()

  const handleSave = () => {
    setModalOpen(false)
    router.refresh()
  }

  return (
    <>
      <Button variant="primary" size="sm" onClick={() => setModalOpen(true)}>
        + Agregar Tramo
      </Button>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Nuevo Tramo — ${empresaNombre}`}
        size="md"
      >
        <PrecioEditor
          tipo="mayorista"
          empresaId={empresaId}
          onSave={handleSave}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>
    </>
  )
}
