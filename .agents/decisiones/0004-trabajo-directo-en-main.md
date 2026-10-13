# 0004 — Trabajo directo en `main`: sin ramas, sin worktrees, sin fusiones

- **Fecha:** 2026-10-13
- **Estado:** aceptada (pedido explícito de Claudio)
- **Reemplaza:** la parte de git de la [0001](0001-protocolo-coordinacion.md) (rama y worktree por tarea, merge del humano)

## Contexto

El flujo de rama por tarea + worktree + merge generó fricción real: la portada nueva quedó publicada
solo como Preview en Vercel porque vivía en una rama y `main` no avanzaba. Claudio quiere que, al
terminar cada tarea, le baste con un commit y un push simples.

## Decisión

1. **Una sola carpeta y una sola rama:** los dos agentes trabajan en `D:\CLAUDEKODE\viflomax`, sobre `main`.
   No se crean ramas ni worktrees y no se hacen merges.
2. **Los agentes no hacen commit ni push.** Al terminar dejan la tarea "lista para commitear":
   compuerta en verde y una sección `## Commit` en el archivo de la tarea con el bloque exacto:
   ```bash
   git add <solo los archivos de la tarea>
   git commit -m "tipo(área): VFX-NNN descripción"
   git push
   ```
   **Nunca `git add .` ni `git add -A`:** el árbol de trabajo es compartido y puede contener trabajo a
   medias del otro agente.
3. **El candado `archivos:` pasa a ser la única protección** contra pisarse. Se respeta sin excepciones;
   tocar un archivo fuera de la lista exige agregarlo antes y anotarlo en la bitácora.
4. **Push a `main` = deploy a producción en Vercel.** Por eso la revisión cruzada ocurre **antes** del
   commit, sobre el diff sin commitear (`git diff -- <archivos>`, y `git status` para los nuevos). Si
   Claudio decide publicar sin revisión, es su decisión y queda anotado en la bitácora.
5. El campo `rama:` del frontmatter queda en desuso.

## Consecuencias

- Desaparece el paso de merge y el riesgo de "está en una rama pero no en producción".
- Desaparecen los previews de Vercel por rama: lo que se pushea se publica. La compuerta
  (`npm run lint && npx jest && npm run build`) y la revisión pasan a ser la única red antes de producción.
- Dos agentes editando a la vez en la misma carpeta pueden romperse el build mutuamente. Si la
  compuerta falla por archivos de la otra tarea, se anota en la bitácora y no se "arregla" código ajeno.
