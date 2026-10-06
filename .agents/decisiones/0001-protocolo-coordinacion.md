# 0001 — Coordinación Claude × Codex por archivos en el repo

- **Fecha:** 2026-10-05
- **Estado:** aceptada

## Contexto

Dos agentes (Claude Code y Codex) trabajan el mismo repo en sesiones separadas que no comparten
memoria ni conversación. Sin un canal común se pisan archivos, duplican trabajo y pierden el porqué
de las decisiones.

## Decisión

El canal es el propio repositorio:

- Una tarea = un archivo Markdown en `.agents/tareas/` con frontmatter de estado.
- El campo `archivos:` actúa como candado mientras la tarea está `en-curso`.
- Rama y worktree por tarea; revisión cruzada obligatoria (quien implementa no revisa).
- Decisiones duraderas en `.agents/decisiones/`.
- El humano es el único que hace merge y push.

Detalle completo en `.agents/PROTOCOLO.md`.

## Consecuencias

- Todo lo que un agente sabe y el otro necesita queda versionado en git.
- Un archivo por tarea evita conflictos de merge en un tablero central.
- Costo: cada tarea pide un par de minutos de burocracia (frontmatter + bitácora).
