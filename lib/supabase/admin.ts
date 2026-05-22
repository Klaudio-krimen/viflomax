import { createClient } from '@supabase/supabase-js'

/**
 * Cliente Supabase con rol de servicio (admin).
 * Permite crear/eliminar usuarios en auth.users y hacer operaciones sin RLS.
 *
 * ⚠️  SOLO usar en Server Actions o Route Handlers.
 *     NUNCA importar en código cliente (componentes, hooks, etc.)
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      'Faltan variables de entorno Supabase Admin. ' +
        'Asegúrate de tener SUPABASE_SERVICE_ROLE_KEY en .env.local'
    )
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
