// Tablero de tareas entre agentes: lee el frontmatter de .agents/tareas/*.md.
// Uso: node scripts/agentes-tablero.mjs [--estado en-curso] [--asignado codex]
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const DIR = join(process.cwd(), '.agents', 'tareas')
const ORDEN = ['en-curso', 'en-revision', 'bloqueada', 'lista', 'propuesta', 'hecha']

function leerFrontmatter(texto) {
  const m = texto.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!m) return null
  const datos = {}
  for (const linea of m[1].split(/\r?\n/)) {
    const kv = linea.match(/^(\w+):\s*(.*?)\s*(?:#.*)?$/)
    if (!kv) continue
    const valor = kv[2]
    datos[kv[1]] = valor.startsWith('[')
      ? valor.slice(1, -1).split(',').map((s) => s.trim()).filter(Boolean)
      : valor
  }
  return datos
}

const args = process.argv.slice(2)
const filtro = {}
for (let i = 0; i < args.length; i += 2) filtro[args[i].replace(/^--/, '')] = args[i + 1]

const tareas = readdirSync(DIR)
  .filter((f) => /^VFX-\d+.*\.md$/.test(f))
  .map((f) => ({ archivo: f, ...leerFrontmatter(readFileSync(join(DIR, f), 'utf8')) }))
  .filter((t) => Object.entries(filtro).every(([k, v]) => t[k] === v))

// Candados: un mismo archivo reclamado por dos tareas en curso es un conflicto.
const enCurso = tareas.filter((t) => t.estado === 'en-curso')
const dueños = new Map()
for (const t of enCurso) for (const a of t.archivos ?? []) {
  dueños.set(a, [...(dueños.get(a) ?? []), t.id])
}
const conflictos = [...dueños].filter(([, ids]) => ids.length > 1)

for (const estado of ORDEN) {
  const grupo = tareas.filter((t) => t.estado === estado)
  if (!grupo.length) continue
  console.log(`\n${estado.toUpperCase()} (${grupo.length})`)
  for (const t of grupo) {
    const quien = t.asignado ? ` @${t.asignado}` : ''
    const deps = t.depende_de?.length ? ` ← ${t.depende_de.join(', ')}` : ''
    const bloqueo = t.bloqueo ? `  ⚠ ${t.bloqueo}` : ''
    console.log(`  ${t.id} [${t.prioridad}]${quien} ${t.titulo}${deps}${bloqueo}`)
  }
}

if (conflictos.length) {
  console.log('\n⛔ CONFLICTO DE CANDADOS')
  for (const [archivo, ids] of conflictos) console.log(`  ${archivo}: ${ids.join(', ')}`)
  process.exitCode = 1
}

const ultimo = Math.max(0, ...readdirSync(DIR).map((f) => Number(f.match(/^VFX-(\d+)/)?.[1] ?? 0)))
console.log(`\nSiguiente ID libre: VFX-${String(ultimo + 1).padStart(3, '0')}`)
