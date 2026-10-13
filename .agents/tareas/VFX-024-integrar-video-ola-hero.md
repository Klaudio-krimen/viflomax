---
id: VFX-024
titulo: Integrar el video de la ola en el hero como capa decorativa con carga diferida y una vez por sesión
estado: lista
prioridad: p2
asignado:
revisor: claude
area: landing
depende_de: [VFX-021, VFX-023]
blueprint:
rama:
archivos: [components/public/HeroOla.tsx, components/public/Hero.tsx, lib/landing/ola.ts, lib/landing/ola.test.ts]
bloqueo:
creado: 2026-10-13
actualizado: 2026-10-13
---

## Contexto

ADR [`0003`](../decisiones/0003-video-ola-hero.md). Los assets salen de VFX-023. Se monta sobre el hero que integra Codex en VFX-021 (`Hero.tsx` está bloqueado por esa tarea mientras siga en curso), en `public/video/hero-ola-*`.

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
- [ ] El First Load JS de `/` sube ≤ 1,5 kB respecto de VFX-021 (anotar las dos cifras).
- [ ] Lighthouse móvil: el elemento LCP **no** es el video y el LCP queda ≤ línea base + 200 ms.
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

## Revisión
