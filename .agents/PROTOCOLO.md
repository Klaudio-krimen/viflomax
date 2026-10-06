# Protocolo de coordinación entre agentes — Claude Code × Codex

Este repo lo trabajan dos agentes de IA y una persona. Este archivo es el contrato entre ellos.
Lo leen **los dos agentes antes de tocar código** (Claude lo ve desde `CLAUDE.md`, Codex desde
`AGENTS.md`). Si este protocolo y una instrucción del humano chocan, gana el humano.

## 1. Quién hace qué

| Actor | Rol principal | También |
|---|---|---|
| **Humano (Claudio)** | Dueño del producto. Prioriza, aprueba, hace merge a `main` y push. | Desempata cualquier conflicto. |
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
| `en-curso` | Un agente la tomó (`asignado` + `rama` completos). | El agente que la toma |
| `bloqueada` | No puede avanzar; `bloqueo:` dice por qué y qué se necesita. | El agente asignado |
| `en-revision` | Compuerta en verde, commit hecho, espera revisión cruzada. | El agente asignado |
| `hecha` | Revisión aprobada y el humano hizo merge. | Humano (o revisor con su permiso) |

## 4. Tomar una tarea (claim)

1. `git pull` / revisar `main`. Correr el tablero y elegir una `lista` sin dependencias abiertas.
2. Verificar que **ningún archivo de su `archivos:` aparece en otra tarea `en-curso`**. Si choca,
   no se toma: se elige otra o se anota en la bitácora.
3. Editar el frontmatter: `estado: en-curso`, `asignado: claude|codex`, `rama: …`, `actualizado:`.
4. Crear la rama (ver §6) y commitear **solo el cambio de estado** como primer commit:
   `chore(agentes): VFX-NNN en-curso`.

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

## 6. Git

- **Rama por tarea:** `claude/VFX-NNN-slug` o `codex/VFX-NNN-slug`, siempre desde `main`.
- **Trabajo en paralelo:** cada agente en su propio worktree para no pisarse el working tree:
  `git worktree add ../viflomax-codex codex/VFX-NNN-slug`.
- **Commits:** convencionales y con el ID — `feat(chofer): VFX-012 cola offline de entregas`.
- **Nunca:** push, merge a `main`, `reset --hard`, `prisma migrate` contra la base real ni editar
  archivos generados. Eso lo hace el humano.
- Una tarea = un PR/merge. Si crece más de ~400 líneas de diff, se parte en tareas nuevas.

## 7. Revisión cruzada

El revisor lee el diff (`git diff main...rama`) contra los criterios de aceptación y deja en la
sección `## Revisión` del archivo de la tarea:

```
### 2026-10-05 · claude revisa · CAMBIOS | APROBADA
- [bloqueante] archivo.ts:42 — descripción concreta y por qué.
- [sugerencia] …
```

Checklist mínimo del revisor: criterios cumplidos · reglas *Innegociables* de `CLAUDE.md` ·
fronteras de importación · seguridad (authz por rol en cada `app/api/**`, validación en servidor,
nada de secretos) · tests que cubran el cambio · accesibilidad/contraste si toca UI.

`CAMBIOS` → la tarea vuelve a `en-curso` con el mismo asignado. `APROBADA` → queda esperando el
merge del humano, que la pasa a `hecha`.

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

Si la compuerta no puede correr (por ejemplo, falta `DATABASE_URL`), la tarea queda `bloqueada`,
no `en-revision`.
