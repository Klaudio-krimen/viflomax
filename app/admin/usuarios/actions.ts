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

// ─── Crear cuenta 'visor' (solo lectura de pedidos) ──────────────────────────
export async function crearUsuarioVisor(formData: FormData): Promise<ActionResult> {
  if (!(await verificarAdmin())) return { error: 'No autorizado' }

  const nombre = (formData.get('nombre') as string)?.trim()
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = (formData.get('password') as string)?.trim()

  if (!nombre) return { error: 'El nombre es requerido' }
  if (!email) return { error: 'El email es requerido' }
  if (!password || password.length < 6)
    return { error: 'La contraseña debe tener al menos 6 caracteres' }

  const existe = await db.user.findUnique({ where: { email } })
  if (existe) return { error: 'Ya existe una cuenta con ese email' }

  const hashedPassword = await bcrypt.hash(password, 12)

  try {
    await db.user.create({
      data: {
        email,
        name: nombre,
        password: hashedPassword,
        role: 'visor',
        mustChangePassword: true,
      },
    })
  } catch {
    return { error: 'Error creando la cuenta. Intenta nuevamente.' }
  }

  revalidatePath('/admin/usuarios')
  return { error: null }
}

// ─── Eliminar cuenta 'visor' ──────────────────────────────────────────────────
// Hard-delete directo: a diferencia de un chofer, una cuenta visor no tiene
// historial de negocio asociado (entregas, turnos, pedidos), así que no
// aplica la restricción de "desactivar en vez de eliminar".
export async function eliminarUsuarioVisor(id: string): Promise<ActionResult> {
  if (!(await verificarAdmin())) return { error: 'No autorizado' }

  try {
    const usuario = await db.user.findUnique({ where: { id }, select: { role: true } })
    if (!usuario) return { error: 'Usuario no encontrado' }
    if (usuario.role !== 'visor') return { error: 'Esta acción solo aplica a cuentas de tipo visor' }

    await db.user.delete({ where: { id } })
  } catch {
    return { error: 'Error eliminando la cuenta' }
  }

  revalidatePath('/admin/usuarios')
  return { error: null }
}
