---
id: VFX-016
titulo: Dar vida al hero con texto palabra por palabra, coreografía de entrada, aurora y burbujas
estado: lista
prioridad: p1
asignado:
revisor: claude
area: landing
depende_de: [VFX-015]
blueprint:
rama:
archivos: [components/public/Hero.tsx, components/public/AuroraFondo.tsx, components/public/BurbujasHero.tsx, app/globals.css]
bloqueo:
creado: 2026-10-13
actualizado: 2026-10-13
---

## Contexto

El hero es lo primero que ve el cliente y hoy es un póster fijo. Concepto: **"agua viva"**, luz
que se mueve bajo el agua y burbujas que suben mientras el titular emerge palabra por palabra, como
si saliera a la superficie. Decisión: [`0002`](../decisiones/0002-motion-landing-css-first.md).

### Pila de capas del hero (de atrás hacia adelante)

| z | Capa | Detalle |
|---|---|---|
| 0 | Gradiente base | El actual `from-viflomax-azul-900 via-viflomax-azul to-viflomax-verde`. |
| 1 | `AuroraFondo` | 3 blobs grandes (≈ 40–60 vw), `blur-3xl` estático, colores `viflomax-azul-400`, `viflomax-verde-400` y blanco, a opacidad 0,25–0,35. Cada uno deriva con su propia keyframe `aurora-1..3` (translate ± 8–12 %, scale 0,9–1,15) en 18 s, 23 s y 29 s `ease-in-out infinite alternate`. Periodos coprimos: el patrón nunca se repite a la vista. |
| 2 | `BurbujasHero` | 6 burbujas de `generarBurbujas(41, 6)` a nivel de módulo: círculos con `border border-white/40` y relleno `bg-white/10`; keyframe `burbuja` sube de `translateY(0)` a `translateY(-110vh)` con `translateX(var(--deriva))` y opacidad 0 → valor → 0. |
| 3 | Scrim | El `bg-black/30` actual. **Se queda y va encima de todo lo decorativo.** Sin él ningún texto pasa AA. |
| 4 | Contenido | Texto y CTAs. |

### Coreografía de texto (desde la carga, total ≤ 1,4 s)

| t (ms) | Elemento | Animación |
|---|---|---|
| 0 | Pill "Distribución en Maipú y Padre Hurtado" | `.aparecer` |
| 120 | H1 "Agua Purificada / a Domicilio" | `TextoRevelado` modo `carga`, `paso` 80 ms; cada palabra sube desde su máscara |
| ~600 | Palabra rotativa (ver abajo) | arranca cuando termina el H1 |
| 700 | Subtítulo | `.aparecer` con `--retraso: 700ms` |
| 850 / 930 | CTA "Pedir ahora" / "Ver productos" | `.aparecer` escalonado |
| — | ~~Brillo del CTA a 1600 ms~~ | **Retirado** (2026-10-13): no cabía en la coreografía y competía con la ola del video (VFX-024). |

**Palabra rotativa:** la segunda línea del H1 alterna `a Domicilio → en tu Puerta → a Domicilio` (se quitó "el Mismo Día": es una promesa operativa que hoy no está respaldada).
Es un stack vertical dentro de una máscara que se traslada en `translateY` por pasos. Hace **2 ciclos
y se detiene en "a Domicilio"** (`animation-iteration-count` finito, `forwards`). El texto `sr-only`
del H1 es siempre "Agua Purificada a Domicilio". Las palabras viven en una constante en `Hero.tsx`
para que Claudio pueda cambiarlas.

## Criterios de aceptación

- [ ] `Hero.tsx`, `AuroraFondo.tsx` y `BurbujasHero.tsx` son Server Components (sin `'use client'`).
- [ ] El H1 se renderiza con `TextoRevelado` y en el HTML del servidor (`curl localhost:3000 | grep`)
      aparece el texto completo "Agua Purificada a Domicilio" exactamente una vez fuera de `aria-hidden`.
- [ ] La pila de capas respeta la tabla: aurora y burbujas quedan **debajo** del scrim (`z-index`
      o el orden del DOM) y todas llevan `aria-hidden="true"` y `pointer-events-none`.
- [ ] Contraste: el texto blanco más débil del hero (`text-white/90`) pasa 4.5:1 en el peor punto
      del fondo (la parada verde con un blob blanco encima). La medición, con el método usado, queda
      anotada en la bitácora. Si no pasa, se baja la opacidad de los blobs, nunca el scrim.
- [ ] Todas las keyframes nuevas (`aurora-1..3`, `burbuja`, `rotar-palabra`, `brillo-cta`) animan
      solo `transform`/`opacity`, y todas viven dentro de `@media (prefers-reduced-motion: no-preference)`.
- [ ] Con reduced-motion emulado, el hero se ve estático y completo, y la segunda línea dice "a Domicilio".
- [ ] La palabra rotativa termina detenida en "a Domicilio" a los ≤ 9 s de la carga.
- [ ] Las palabras del H1 animan **solo `transform`** (nunca `opacity`), y el H1 completo termina en ≤ 1,2 s (ADR 0003 §4).
- [ ] La imagen o el logo del hero se ven desde el primer frame: nunca parten de `opacity: 0`.
- [ ] El total de elementos animados a la vez en el hero es ≤ 30 (anotar el conteo en la bitácora).
- [ ] Se mantienen: `logo-float`, el `priority` de la imagen del logo, `focus-visible:ring` en los dos
      CTAs, `bg-viflomax-verde-700` en el CTA primario y los `href` actuales (`#pedido`, `#productos`).
- [ ] Mobile (375 px): el H1 no se corta, ninguna palabra queda partida dentro de su máscara y no hay
      scroll horizontal (`overflow-hidden` en la sección).
- [ ] `npm run lint && npx jest && npm run build` sale con código 0; First Load JS de `/` = línea base.

## Fuera de alcance

- El bidón animado y las olas divisoras (VFX-017).
- Cambiar el layout a dos columnas: eso también lo hace VFX-017, junto con el bidón.
- Cambiar el copy del subtítulo o de los CTAs.

## Notas de implementación

- `blur-3xl` sobre un elemento que solo se traslada se rasteriza una vez; agregar `will-change: transform` solo a los 3 blobs.
- `BurbujasHero` es hermano conceptual de `LluviaDeGotas`; seguir su estilo (renderer puro, datos a nivel de módulo).
- Para la palabra rotativa, la altura de la máscara es `1lh` (con fallback a `1.1em`) y cada paso es `translateY(-100%)`, `-200%`, etc.

## Bitácora

### 2026-10-13 · claude · propuesta → lista
- Dirección creativa y coreografía definidas. Para codex, después de VFX-015.

### 2026-10-13 · claude · lista → lista (ajuste de criterios)
- Se incorporan hallazgos de la maqueta de Codex (`design_handoff_landing_redesign/agua-viva/`): 6 burbujas en lugar de 14 (presupuesto de 30 elementos animados), palabras solo con transform (LCP), imagen visible desde t=0, se retira el brillo del CTA y se quita "el Mismo Día".
- La ola del video entra después, en VFX-024 (ADR 0003); esta tarea no depende de ella.

## Revisión
