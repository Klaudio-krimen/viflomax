import { db } from '@/lib/db'
import type { Chofer } from '@/lib/types'
import { ChoferesClient } from './ChoferesClient'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Choferes — Viflomax Admin' }

export default async function ChoferesPage() {
  const choferes = await db.chofer.findMany({
    orderBy: [{ activo: 'desc' }, { nombre: 'asc' }],
  })

  return <ChoferesClient choferes={choferes as unknown as Chofer[]} />
}
