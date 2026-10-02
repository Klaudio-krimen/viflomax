import { db } from '@/lib/db'
import type { Chofer } from '@/lib/types'
import { ChoferesClient } from './ChoferesClient'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Choferes — Viflomax Admin' }

export default async function ChoferesPage() {
  const choferes = await db.chofer.findMany({
    orderBy: [{ activo: 'desc' }, { nombre: 'asc' }],
    include: {
      _count: { select: { entregas: true, turnos: true } },
      user: { select: { email: true } },
    },
  })

  const choferesConHistorial = choferes.map((c) => ({
    ...c,
    tieneHistorial: c._count.entregas > 0 || c._count.turnos > 0,
    entregasCount: c._count.entregas,
    turnosCount: c._count.turnos,
    email: c.user?.email ?? null,
  }))

  return (
    <ChoferesClient
      choferes={
        choferesConHistorial as unknown as (Chofer & {
          tieneHistorial: boolean
          entregasCount: number
          turnosCount: number
          email: string | null
        })[]
      }
    />
  )
}
