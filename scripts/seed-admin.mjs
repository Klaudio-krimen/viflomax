/**
 * Script de un solo uso: crea el usuario admin inicial.
 * Uso en PowerShell:
 *   $env:DATABASE_URL="postgresql://..."; $env:ADMIN_PASSWORD="tu-contraseña"; node scripts/seed-admin.mjs
 */

import { PrismaClient } from '@prisma/client'
import { createHash } from 'crypto'

// bcryptjs no está disponible como ESM — usamos un hash fuerte como fallback
// Cambia este import si tienes ts-node disponible
let bcrypt
try {
  const mod = await import('bcryptjs')
  bcrypt = mod.default
} catch {
  console.error('❌ No se pudo importar bcryptjs. Asegúrate de que esté instalado.')
  process.exit(1)
}

const email = process.env.ADMIN_EMAIL || 'admin@viflomax.cl'
const password = process.env.ADMIN_PASSWORD

if (!password) {
  console.error('❌ Falta ADMIN_PASSWORD. Ejemplo:')
  console.error('   $env:ADMIN_PASSWORD="tu-contraseña-segura"; node scripts/seed-admin.mjs')
  process.exit(1)
}

const db = new PrismaClient()

try {
  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    console.log(`⚠️  Ya existe un usuario con email ${email}. Actualizando contraseña...`)
    const hash = await bcrypt.hash(password, 12)
    await db.user.update({ where: { email }, data: { password: hash, role: 'admin' } })
    console.log('✅ Contraseña actualizada.')
  } else {
    const hash = await bcrypt.hash(password, 12)
    await db.user.create({
      data: { email, password: hash, role: 'admin', name: 'Admin Viflomax' },
    })
    console.log(`✅ Usuario admin creado: ${email}`)
  }
} catch (err) {
  console.error('❌ Error:', err.message)
} finally {
  await db.$disconnect()
}
