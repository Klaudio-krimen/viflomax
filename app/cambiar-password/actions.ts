'use server'

import bcrypt from 'bcryptjs'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

type ActionResult = { error: string | null }

export async function cambiarPassword(actual: string, nueva: string): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user) return { error: 'No autorizado' }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { password: true },
  })
  if (!user?.password) return { error: 'No se pudo verificar tu cuenta' }

  const actualOk = await bcrypt.compare(actual ?? '', user.password)
  if (!actualOk) return { error: 'La contraseña actual no es correcta' }

  const nuevaTrim = (nueva ?? '').trim()
  if (nuevaTrim.length < 6)
    return { error: 'La contraseña debe tener al menos 6 caracteres' }

  if (nuevaTrim === actual)
    return { error: 'La nueva contraseña debe ser distinta a la actual' }

  const hashedPassword = await bcrypt.hash(nuevaTrim, 12)
  await db.user.update({
    where: { id: session.user.id },
    data: { password: hashedPassword, mustChangePassword: false },
  })

  return { error: null }
}
