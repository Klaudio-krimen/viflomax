'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

type ActionResult = { error: string | null }

// ─── Guard: verifica que el usuario sea admin ────────────────────────────────
async function verificarAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return !!user && user.app_metadata?.role === 'admin'
}

// ─── Crear chofer (auth user + registro en tabla) ────────────────────────────
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

  const admin = createAdminClient()

  // 1. Crear usuario en Supabase Auth con rol 'chofer'
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: 'chofer' },
  })

  if (authError || !authData.user) {
    const msg = authError?.message ?? 'Error al crear usuario'
    if (msg.toLowerCase().includes('already registered'))
      return { error: 'Ya existe una cuenta con ese email' }
    return { error: msg }
  }

  // 2. Crear registro en tabla choferes
  const { error: dbError } = await admin.from('choferes').insert({
    user_id: authData.user.id,
    nombre,
    telefono,
    vehiculo,
    activo: true,
  })

  if (dbError) {
    // Rollback: eliminar usuario de Auth para no dejar huérfanos
    await admin.auth.admin.deleteUser(authData.user.id)
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

  const admin = createAdminClient()
  const { error } = await admin
    .from('choferes')
    .update({ nombre, telefono, vehiculo })
    .eq('id', id)

  if (error) return { error: 'Error actualizando datos del chofer' }

  revalidatePath('/admin/choferes')
  return { error: null }
}

// ─── Activar / Desactivar chofer ─────────────────────────────────────────────
export async function toggleActivoChofer(
  id: string,
  activoActual: boolean
): Promise<ActionResult> {
  if (!(await verificarAdmin())) return { error: 'No autorizado' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('choferes')
    .update({ activo: !activoActual })
    .eq('id', id)

  if (error) return { error: 'Error actualizando estado del chofer' }

  revalidatePath('/admin/choferes')
  return { error: null }
}
