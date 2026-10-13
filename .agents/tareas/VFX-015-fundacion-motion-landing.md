---
id: VFX-015
titulo: Crear la fundación de motion de la landing (tokens, keyframes, TextoRevelado y generadores puros)
estado: lista
prioridad: p1
asignado:
revisor: claude
area: landing
depende_de: []
blueprint:
rama:
archivos: [app/globals.css, tailwind.config.ts, lib/landing/palabras.ts, lib/landing/palabras.test.ts, lib/landing/burbujas.ts, lib/landing/burbujas.test.ts, components/public/TextoRevelado.tsx]
bloqueo:
creado: 2026-10-13
actualizado: 2026-10-13
---

## Contexto

Base técnica para VFX-016 a VFX-019. Implementa la decisión
[`0002-motion-landing-css-first`](../decisiones/0002-motion-landing-css-first.md). **Leerla entera
antes de empezar.** Esta tarea no cambia nada visible todavía: solo deja las piezas listas y probadas.

## Criterios de aceptación

- [ ] **Línea base:** antes de tocar nada, correr `npm run build` en `main` y anotar en la bitácora el
      *First Load JS* de `/`. Las tareas siguientes se miden contra ese número.
- [ ] `tailwind.config.ts` agrega en `theme.extend`:
      `transitionTimingFunction.agua = 'cubic-bezier(0.22, 1, 0.36, 1)'` y
      `transitionTimingFunction['agua-suave'] = 'cubic-bezier(0.65, 0, 0.35, 1)'`. No se toca
      ningún color existente.
- [ ] `lib/landing/palabras.ts` exporta `partirEnPalabras(texto: string): { palabra: string; indice: number }[]`.
      Separa por espacios en blanco, colapsa los espacios repetidos, conserva la puntuación pegada a
      la palabra y trata `\n` como un salto que **no** consume índice (devuelve `{ palabra: '\n' }`
      para que el renderer pinte un `<br />`). Es pura: sin React, sin `window`.
- [ ] `lib/landing/palabras.test.ts` cubre: texto simple, espacios dobles, `\n`, puntuación
      (`"¿Por qué elegirnos?"` → 3 palabras), cadena vacía → `[]`, índices consecutivos sin saltos.
- [ ] `lib/landing/burbujas.ts` exporta `generarBurbujas(semilla, cantidad)` → `{ left, tamano, duracion, retraso, opacidad, deriva }[]`
      con el mismo LCG de `gotas.ts` (extraer el LCG a una función compartida si se quiere, sin
      cambiar la salida de `generarGotas`; los tests de gotas siguen en verde sin editarlos).
      Rangos: `left` 0–100, `tamano` 6–22 px, `duracion` 6–14 s, `retraso` −14–0 s, `opacidad`
      0,15–0,45, `deriva` −30–30 px.
- [ ] `lib/landing/burbujas.test.ts` verifica: misma semilla → mismo array; semillas distintas →
      arrays distintos; todos los valores dentro de sus rangos para 500 burbujas.
- [ ] `components/public/TextoRevelado.tsx` es un **Server Component** (sin `'use client'`) con props
      `{ texto: string; as?: 'h1' | 'h2' | 'p' | 'span'; className?: string; retrasoBase?: number; paso?: number; modo?: 'carga' | 'scroll' }`.
      Pinta: el texto completo en `<span className="sr-only">`, y cada palabra como
      `<span aria-hidden="true" class="palabra-mascara"><span class="palabra" style="--i:N">…</span></span>`
      separadas por espacios reales (el texto sigue haciendo wrap normal). `retrasoBase` (ms, default
      0) y `paso` (ms, default 70) llegan como variables CSS.
- [ ] `app/globals.css` agrega, sin romper `logo-float` ni `waterfall`:
      - `.palabra-mascara { display:inline-block; overflow:hidden; vertical-align:bottom; padding-bottom:0.08em }`
        (el padding evita cortar descendentes como "g", "p", "q").
      - `.palabra { display:inline-block }` (estado por defecto: visible, sin transform).
      - `@keyframes palabra-sube { from { transform: translateY(110%) } to { transform: translateY(0) } }`
        y `@keyframes aparecer-arriba { from { opacity:0; transform: translateY(12px) } to { opacity:1; transform:none } }`.
      - Dentro de `@media (prefers-reduced-motion: no-preference)`: `[data-modo="carga"] .palabra`
        anima `palabra-sube` 650 ms `cubic-bezier(0.22,1,0.36,1)` `both` con
        `animation-delay: calc(var(--retraso-base, 0ms) + var(--i) * var(--paso, 70ms))`.
      - Dentro de `@media (prefers-reduced-motion: no-preference)` **y**
        `@supports (animation-timeline: view())`: `[data-modo="scroll"] .palabra` usa la misma
        keyframe con `animation-timeline: view()` y `animation-range: entry 10% cover 30%`.
      - Clase utilitaria `.aparecer` (usa `aparecer-arriba`, 500 ms, `both`, con `--retraso`) bajo la
        misma regla de no-preference.
- [ ] `rg -n "animation|transition" app/globals.css` solo muestra keyframes que tocan `transform` y/o `opacity`.
- [ ] Con *Emulate CSS prefers-reduced-motion: reduce* en DevTools, ningún elemento queda invisible ni desplazado.
- [ ] `npm run lint && npx jest && npm run build` sale con código 0, y el First Load JS de `/` es igual a la línea base.

## Fuera de alcance

- Usar `TextoRevelado` en cualquier sección (eso es VFX-016 y VFX-018).
- Cambiar colores, copy o layout.

## Notas de implementación

- Leer `.claude/rules/landing-publica.md`.
- Los tests importan con especificador relativo (`./palabras`), como `gotas.test.ts`.
- `animation-fill-mode: both` es clave: las palabras con retraso deben arrancar ya ocultas (en
  `translateY(110%)`), pero **solo** dentro del bloque no-preference.

## Bitácora

### 2026-10-13 · claude · propuesta → lista
- Especificada desde la ADR 0002. Para codex.

## Revisión
