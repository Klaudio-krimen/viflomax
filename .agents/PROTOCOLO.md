# Protocolo de coordinación entre agentes — Claude Code × Codex

Este repo lo trabajan dos agentes de IA y una persona. Este archivo es el contrato entre ellos.
Lo leen **los dos agentes antes de tocar código** (Claude lo ve desde `CLAUDE.md`, Codex desde
`AGENTS.md`). Si este protocolo y una instrucción del humano chocan, gana el humano.

## 1. Quién hace qué

| Actor | Rol principal | También |
|---|---|---|
| **Humano (Claudio)** | Dueño del producto. Prioriza, aprueba, y hace commit y push a `main` con el bloque que deja cada tarea. | Desempata cualquier conflicto. |
| **Claude Code** | Arquitecto y revisor. Descompone trabajo en tareas, escribe blueprints, decide diseño, revisa seguridad y UX. | Implementa lo transversal o ambiguo (auth, esquema Prisma, contratos, refactors). |
| **Codex** | Implementador. Toma tareas `lista` bien especificadas y las ejecuta con tests. | Revisa el trabajo de Claude (revisión cruzada). |

Regla de oro: **quien implementa no se revisa a sí mismo.** Si Claude implementa, revisa Codex, y
viceversa.

## 2. La unidad de trabajo: un archivo por tarea

Toda tarea vive en `.agents/tareas/VFX-NNN-slug.md`, creada desde
[`plantillas/tarea.md`](plantillas/tarea.md). Un archivo por tarea (y no un tablero compartido)
evita conflictos de merge entre agentes.

- **ID:** `VFX-` + número correlativo de 3 dígitos. El siguiente número es el mayor existente + 1.
- **Frontmatter** = estado legible por máquina. **Cuerpo** = contexto, criterios y bitácora.
- `asignado: humano` marca lo que solo puede hacer Claudio (configurar Vercel, decidir sobre una regla innegociable, dar un dato).
- Las auditorías van a `.agents/auditorias/AAAA-MM-DD-tema.md` y cada hallazgo accionable se vuelve una tarea.
- Ver el tablero completo: `node scripts/agentes-tablero.mjs`.

Las épicas grandes siguen usando `blueprints/<nombre>/` (blueprint + `tasks.json`). En ese caso,
cada tarea del blueprint que se reparte entre agentes se espeja como un `VFX-NNN` con
`blueprint: <nombre>/<id>` en el frontmatter; el `tasks.json` se marca `done` solo al cerrar la
tarea VFX.

## 3. Ciclo de vida

```
propuesta ──► lista ──► en-curso ──► en-revision ──► hecha
                 ▲          │              │
                 │          ▼              │ cambios pedidos
                 └──── bloqueada ◄─────────┘ (vuelve a en-curso)
```

| Estado | Significa | Quién lo pone |
|---|---|---|
| `propuesta` | Idea o hallazgo, falta especificar. | Cualquiera |
| `lista` | Tiene criterios de aceptación verificables y lista de archivos. | Claude o humano |
| `en-curso` | Un agente la tomó (`asignado` completo). | El agente que la toma |
| `bloqueada` | No puede avanzar; `bloqueo:` dice por qué y qué se necesita. | El agente asignado |
| `en-revision` | Compuerta en verde, sección `## Commit` lista, espera revisión cruzada. | El agente asignado |
| `hecha` | Revisión aprobada y el humano hizo commit + push. | Humano (o revisor con su permiso) |

## 4. Tomar una tarea (claim)

1. Estar en `main`, en `D:\CLAUDEKODE\viflomax`. Correr el tablero y elegir una `lista` sin dependencias abiertas.
2. Verificar que **ningún archivo de su `archivos:` aparece en otra tarea `en-curso`**. Si choca,
   no se toma: se elige otra o se anota en la bitácora.
3. Editar el frontmatter: `estado: en-curso`, `asignado: claude|codex`, `actualizado:`. Sin rama ni commit.

El campo `archivos:` es un **candado**: el agente asignado es el único que edita esos archivos
mientras la tarea esté `en-curso`. Si descubre que necesita tocar uno fuera de la lista, lo agrega
a `archivos:` y lo anota en la bitácora antes de editarlo.

## 5. Bitácora y handoff

Cada tarea tiene una sección `## Bitácora`, **solo se agrega al final, nunca se reescribe**.
Formato de entrada:

```
### 2026-10-05 · codex · en-curso → en-revision
- Hecho: …
- Decisiones: … (por qué, no solo qué)
- Pendiente / riesgos: …
- Compuerta: lint ✅ jest ✅ (42) build ✅
- Siguiente: claude revisa seguridad del endpoint nuevo.
```

Un **handoff** es simplemente una entrada de bitácora que deja el estado en algo que el otro agente
toma (`en-revision`, `bloqueada`, o `lista` con nota "para codex"). Todo lo que el otro agente
necesita saber va ahí: el otro agente **no ve tu conversación**, solo el repo.

## 6. Git — directo en `main` (decisión [0004](decisiones/0004-trabajo-directo-en-main.md))

- **Sin ramas, sin worktrees, sin merges.** Los dos agentes trabajan en `D:\CLAUDEKODE\viflomax`, sobre `main`.
- **Los agentes no hacen commit ni push.** Al terminar, la tarea queda con una sección `## Commit`:
  ```bash
  git add <cada archivo de la tarea, uno por uno>
  git commit -m "feat(landing): VFX-NNN descripción corta"
  git push
  ```
  Claudio la copia y la ejecuta tal cual.
- **Nunca `git add .` ni `git add -A`**: el árbol es compartido y puede tener trabajo a medias del
  otro agente. El bloque lista solo los archivos de la tarea, que son los de su `archivos:` más el
  propio `.agents/tareas/VFX-NNN-*.md`, verificados con `git status --short`.
- **Push a `main` es deploy a producción** (Vercel). Por eso el bloque se ejecuta *después* de la revisión `APROBADA`.
- **Commits:** convencionales y con el ID — `feat(chofer): VFX-012 cola offline de entregas`.
- **Nunca:** commit, push, `reset --hard`, `checkout -- <archivo ajeno>`, `stash` de cambios ajenos,
  `prisma migrate` contra la base real ni editar archivos generados.
- Una tarea = un commit. Si crece más de ~400 líneas de diff, se parte en tareas nuevas.

## 7. Revisión cruzada

El revisor lee el diff **sin commitear** de los archivos de la tarea (`git diff -- <archivos>` y,
para los nuevos, `git status --short` + lectura completa) contra los criterios de aceptación y deja en la
sección `## Revisión` del archivo de la tarea:

```
### 2026-10-05 · claude revisa · CAMBIOS | APROBADA
- [bloqueante] archivo.ts:42 — descripción concreta y por qué.
- [sugerencia] …
```

Checklist mínimo del revisor: criterios cumplidos · reglas *Innegociables* de `CLAUDE.md` ·
fronteras de importación · seguridad (authz por rol en cada `app/api/**`, validación en servidor,
nada de secretos) · tests que cubran el cambio · accesibilidad/contraste si toca UI.

`CAMBIOS` → la tarea vuelve a `en-curso` con el mismo asignado. `APROBADA` → Claudio ejecuta el
bloque de `## Commit` y la pasa a `hecha`.

## 8. Decisiones de arquitectura

Toda decisión que el otro agente debe respetar en el futuro (elegir una librería, cambiar un
patrón, un contrato) va a `.agents/decisiones/NNNN-slug.md` (formato ADR corto: contexto,
decisión, consecuencias). Las tareas enlazan la decisión; nadie la contradice sin escribir una
nueva que la reemplace.

## 9. Definición de "hecho"

Una tarea solo pasa a `en-revision` si:

1. `npm run lint && npx jest && npm run build` en verde (pegar el resultado en la bitácora).
2. Cada criterio de aceptación tiene evidencia (test, comando o captura descrita).
3. Las reglas de `CLAUDE.md` → *Innegociable* siguen cumpliéndose.
4. La bitácora deja claro qué quedó pendiente.
5. Los servidores locales de desarrollo o preview de Viflomax utilizados en la tarea quedan
   cerrados, salvo pedido explícito del humano. La entrega queda en `D:\CLAUDEKODE\viflomax`,
   sobre `main`, con los archivos y comandos exactos para commit/push en un solo lugar.

Si la compuerta no puede correr (por ejemplo, falta `DATABASE_URL`), la tarea queda `bloqueada`,
no `en-revision`.
