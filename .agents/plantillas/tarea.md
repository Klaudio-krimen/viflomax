---
id: VFX-NNN
titulo: Verbo + objeto, en una línea
estado: propuesta        # propuesta | lista | en-curso | bloqueada | en-revision | hecha
prioridad: p1            # p0 (rompe producción) | p1 | p2 | p3
asignado:                # claude | codex | (vacío)
revisor:                 # el otro agente
area:                    # landing | admin | chofer | api | db | auth | infra | docs
depende_de: []           # [VFX-001, ...]
blueprint:               # opcional: <carpeta>/<id de tasks.json>
rama:                    # claude/VFX-NNN-slug | codex/VFX-NNN-slug
archivos: []             # candado: rutas o globs que esta tarea edita
bloqueo:                 # solo si estado = bloqueada
creado: AAAA-MM-DD
actualizado: AAAA-MM-DD
---

## Contexto

Por qué existe esta tarea y qué problema real resuelve. Enlaces a archivos (`ruta:línea`),
decisiones (`.agents/decisiones/…`) o blueprints relevantes.

## Criterios de aceptación

Cada uno observable y verificable por una máquina o una persona sin ambigüedad.

- [ ] CUANDO … EL SISTEMA DEBERÁ …
- [ ] `npm run lint && npx jest && npm run build` sale con código 0.

## Fuera de alcance

- Lo que explícitamente NO se hace en esta tarea.

## Notas de implementación

Pistas, riesgos, reglas diferidas a leer (`.claude/rules/…`).

## Bitácora

<!-- Solo agregar al final. Formato: ### AAAA-MM-DD · agente · estado-anterior → estado-nuevo -->

## Revisión

<!-- ### AAAA-MM-DD · agente revisa · CAMBIOS | APROBADA -->
