import { createClient } from '@/lib/supabase/server'
import type { Chofer } from '@/lib/types'
import { ChoferesClient } from './ChoferesClient'

export const metadata = { title: 'Choferes — Viflomax Admin' }

export default async function ChoferesPage() {
  const supabase = await createClient()

  const { data: choferes } = await supabase
    .from('choferes')
    .select('*')
    .order('activo', { ascending: false }) // activos primero
    .order('nombre', { ascending: true })

  return <ChoferesClient choferes={(choferes ?? []) as Chofer[]} />
}
