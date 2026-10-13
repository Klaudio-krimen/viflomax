---
id: VFX-024
titulo: Integrar el video de la ola en el hero como capa decorativa con carga diferida y una vez por sesión
estado: lista
prioridad: p2
asignado: codex
revisor: claude
area: landing
depende_de: [VFX-021, VFX-023]
blueprint:
rama:
archivos: [components/public/HeroOla.tsx, components/public/Hero.tsx, app/globals.css, lib/landing/ola.ts, lib/landing/ola.test.ts]
bloqueo:
creado: 2026-10-13
actualizado: 2026-10-13
---

## Contexto

ADR [`0003`](../decisiones/0003-video-ola-hero.md). Los assets salen de VFX-023. Se monta sobre el hero que integró Codex en VFX-021, aprobado "sin ola": Claudio confirmó el 2026-10-13 que la ola va encima como **capa de temporada**. Los assets están en `public/video/hero-ola-*`.

**Requisito previo:** VFX-021 tiene que estar commiteada antes de tocar `Hero.tsx` (su candado incluye ese archivo y `app/globals.css`).

**Orden de capas dentro de la `<section>` (que ya es `isolate`):** fondo azul-900 → manchas difusas → **video** (`mix-blend-screen`) → scrim `bg-black/30` → contenido → ola SVG blanca inferior. `isolate` asegura que `screen` se mezcle solo con el hero.

**Cómo debe verse:** `design_handoff_landing_redesign/agua-viva/video/renders/hoja-hero-*.png` y `preview-hero-*.mp4`, compuestos sobre el fondo real (se regeneran con `npm run render` en esa carpeta).

## Criterios de aceptación

- [ ] `lib/landing/ola.ts` exporta `debeReproducirOla(entorno)` como función pura. Recibe
      `{ reduceMotion: boolean; saveData: boolean; effectiveType?: string; yaVista: boolean }` y
      devuelve `false` si se cumple cualquier condición de exclusión de la ADR. `ola.test.ts` cubre
      cada condición y el caso positivo.
- [ ] `components/public/HeroOla.tsx` es la **única** isla `'use client'` nueva. Antes de montar,
      renderiza `null`, para que el HTML del servidor no tenga `<video>` y no haya hydration mismatch.
      Después de `requestIdleCallback` (o de `setTimeout(…, 200)`), si `debeReproducirOla` da `true`,
      monta `<video muted playsInline autoPlay preload="auto" aria-hidden="true" tabIndex={-1} disablePictureInPicture>`
      con `<source>` 9:16 (`media="(max-aspect-ratio: 1/1)"`) y 16:9, cada uno en WebM y MP4.
- [ ] El video se monta en una capa `absolute inset-0 object-cover mix-blend-screen pointer-events-none`
      **debajo** del scrim `bg-black/30`; el contenido sigue encima.
- [ ] En `ended` y en `error`, o si `play()` rechaza la promesa, el componente se desmonta. La marca de
      sesión `viflomax:ola-vista` se escribe con `try/catch`.
- [ ] La entrada del H1 y de la imagen no depende del video: con la red cortada (DevTools → Offline después de la carga), el hero se ve completo e igual.
- [ ] **Entrada sin `opacity` (ADR 0003 §4 enmendada; sale de la revisión de VFX-021):** en `app/globals.css`, `@keyframes hero-palabra` anima solo `translateY` dentro de `.hero-palabra-mascara`, y `.hero-imagen-entrada` usa un keyframe que anima solo `transform` (sin `hero-aparecer`). En el cuadro 0, ni las palabras ni la imagen tienen `opacity` < 1. Se mantienen el ritmo (500 ms + 180 ms × índice, 1,1 s) y el bloque de reduced-motion. `.hero-intro` puede seguir con `opacity`, porque no es candidato a LCP.
- [ ] `key` de las palabras del H1 = `` `${fila}-${columna}` `` (hoy `key={palabra}` duplica claves si una palabra se repite).
- [ ] La lámina cruza entre 0,2 y 1,8 s, mientras entran las palabras. Hay que verificar a 375 px y a 1440 px que el H1 se lea durante todo el pase. Si lo tapa, el ajuste va en la capa (`opacity` del `<video>` o un `mask-image` que apague la columna del texto), **no** en re-renderizar el video.
- [ ] El First Load JS de `/` sube ≤ 1,5 kB respecto de VFX-021 (anotar las dos cifras).
- [ ] Lighthouse móvil: el elemento LCP es la imagen del producto o el H1, nunca el video. Anotar el LCP de VFX-021 (antes) y el de esta tarea (después); el después no puede superar al antes + 200 ms, y lo esperable es que baje al quitar `opacity:0`.
- [ ] Con reduced-motion emulado, la pestaña Network no hace ninguna petición a `/video/`.
- [ ] Al recargar en la misma pestaña, el video no se vuelve a reproducir. En una pestaña nueva sí.
- [ ] `npm run lint && npx jest && npm run build` sale con código 0.

## Fuera de alcance

- Producir o re-encodear el video (VFX-023).
- Controles de reproducción: el clip dura ≤ 2,5 s, no lleva información y no se repite (WCAG 2.2.2 no aplica).

## Bitácora

### 2026-10-13 · claude · → lista
- Para codex. Puede avanzar con un video de prueba cualquiera (por ejemplo negro con un destello) mientras VFX-023 está bloqueada; el cierre exige los assets finales.

### 2026-10-13 · claude · nota
- Los assets ya existen en `public/video/hero-ola-{16x9,9x16}.{mp4,webm}` (VFX-023, en revisión). La línea base de First Load JS de `/` medida hoy con `next build` es 100 kB.
- Ya no hace falta un video de prueba: usar los reales. El preview de cómo debe verse compuesto está en `design_handoff_landing_redesign/agua-viva/video/renders/preview-hero-*.mp4` (se genera con `npm run render`).

### 2026-10-13 · claude · nota (revisión del plan con Claudio)
- Se asigna a codex. Se agrega `app/globals.css` al candado para corregir la entrada con `opacity:0` (ADR 0003 §4 enmendada). Nuevos criterios: entrada solo con `transform`, `key` única en el H1, legibilidad del H1 durante el pase y LCP antes/después.
- Depende de que VFX-021 esté commiteada.

## Revisión
