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
          mustChangePassword: true,
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

// ─── Restablecer contraseña de acceso ────────────────────────────────────────
// Para cuando el chofer olvida su contraseña: el admin genera una nueva y se
// la comunica. No pide la contraseña anterior — es un reset, no un cambio.
export async function resetPasswordChofer(
  id: string,
  nuevaPassword: string
): Promise<ActionResult> {
  if (!(await verificarAdmin())) return { error: 'No autorizado' }

  const password = nuevaPassword?.trim()
  if (!password || password.length < 6)
    return { error: 'La contraseña debe tener al menos 6 caracteres' }

  const chofer = await db.chofer.findUnique({
    where: { id },
    select: { user_id: true },
  })
  if (!chofer) return { error: 'Chofer no encontrado' }
  if (!chofer.user_id)
    return { error: 'Este chofer no tiene cuenta de acceso al sistema' }

  try {
    const hashedPassword = await bcrypt.hash(password, 12)
    await db.user.update({
      where: { id: chofer.user_id },
      data: { password: hashedPassword, mustChangePassword: true },
    })
  } catch {
    return { error: 'Error actualizando la contraseña' }
  }

  revalidatePath('/admin/choferes')
  return { error: null }
}

// ─── Eliminar chofer ─────────────────────────────────────────────────────────
// `forzar`: cuando el chofer tiene historial (entregas/turnos), por defecto se
// bloquea el borrado. Con forzar=true se elimina en cascada: se borran sus
// entregas y turnos, y los pedidos vinculados quedan con chofer_id = null
// (los pedidos en sí NO se eliminan). Pensado para limpiar datos de prueba.
export async function eliminarChofer(id: string, forzar = false): Promise<ActionResult> {
  if (!(await verificarAdmin())) return { error: 'No autorizado' }

  try {
    const chofer = await db.chofer.findUnique({
      where: { id },
      select: { user_id: true },
    })
    if (!chofer) return { error: 'Chofer no encontrado' }

    const [entregas, turnos] = await Promise.all([
      db.entrega.count({ where: { chofer_id: id } }),
      db.turno.count({ where: { chofer_id: id } }),
    ])
    const tieneHistorial = entregas > 0 || turnos > 0

    if (tieneHistorial && !forzar) {
      return {
        error:
          'Este chofer tiene entregas o turnos registrados. Desactívalo en vez de eliminarlo.',
      }
    }

    await db.$transaction(async (tx) => {
      // Entrega.chofer_id es ON DELETE RESTRICT: hay que borrarlas antes.
      // Turno.chofer_id es ON DELETE CASCADE y Pedido.chofer_id es ON DELETE
      // SET NULL, así que la base de datos se encarga de esos dos al borrar
      // el chofer.
      if (tieneHistorial) {
        await tx.entrega.deleteMany({ where: { chofer_id: id } })
      }
      await tx.chofer.delete({ where: { id } })
      if (chofer.user_id) {
        await tx.user.delete({ where: { id: chofer.user_id } })
      }
    })
  } catch {
    return { error: 'Error eliminando el chofer' }
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
