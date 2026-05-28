'use server'

import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

type ActionResult = { error: string | null }

// ─── Guard: verifica que el usuario sea admin ────────────────────────────────
async function verificarAdmin(): Promise<boolean> {
  const session = await auth()
  return !!session?.user && session.user.role === 'admin'
}

// ─── Crear chofer (User en NextAuth + registro en tabla choferes) ────────────
export async function crearChofer(formData: FormData): Promise<ActionResult> {
  if (!(await verificarAdmin())) return { error: 'No autorizado' }

  const nombre = (formData.get('nombre') as string)?.trim()
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = (formData.get('password') as string)?.trim()
  const telefono = (formData.get('telefono') as string)?.trim() || null
  const vehiculo = (formData.get('vehiculo') as string)?.trim() || null

  if (!nombre) return { error: 'El nombre es requerido' }
  if (!email) return { error: 'El email es requerido' }
  if (!password || password.length < 6)
    return { error: 'La contraseña debe tener al menos 6 caracteres' }

  // Verificar si el email ya existe
  const existe = await db.user.findUnique({ where: { email } })
  if (existe) return { error: 'Ya existe una cuenta con ese email' }

  // Hashear contraseña
  const hashedPassword = await bcrypt.hash(password, 12)

  try {
    // Transacción: crear User + Chofer atómicamente
    await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          name: nombre,
          password: hashedPassword,
          role: 'chofer',
        },
      })

      await tx.chofer.create({
        data: {
          user_id: user.id,
          nombre,
          telefono,
          vehiculo,
          activo: true,
        },
      })
    })
  } catch {
    return { error: 'Error guardando datos del chofer. Intenta nuevamente.' }
  }

  revalidatePath('/admin/choferes')
  return { error: null }
}

// ─── Editar datos del chofer (NO cambia email ni contraseña) ─────────────────
export async function editarChofer(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  if (!(await verificarAdmin())) return { error: 'No autorizado' }

  const nombre = (formData.get('nombre') as string)?.trim()
  const telefono = (formData.get('telefono') as string)?.trim() || null
  const vehiculo = (formData.get('vehiculo') as string)?.trim() || null

  if (!nombre) return { error: 'El nombre es requerido' }

  try {
    await db.chofer.update({
      where: { id },
      data: { nombre, telefono, vehiculo },
    })
  } catch {
    return { error: 'Error actualizando datos del chofer' }
  }

  revalidatePath('/admin/choferes')
  return { error: null }
}

// ─── Activar / Desactivar chofer ─────────────────────────────────────────────
export async function toggleActivoChofer(
  id: string,
  activoActual: boolean
): Promise<ActionResult> {
  if (!(await verificarAdmin())) return { error: 'No autorizado' }

  try {
    await db.chofer.update({
      where: { id },
      data: { activo: !activoActual },
    })
  } catch {
    return { error: 'Error actualizando estado del chofer' }
  }

  revalidatePath('/admin/choferes')
  return { error: null }
}
