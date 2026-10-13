---
id: VFX-020
titulo: Evaluar cáusticas de agua en WebGL como mejora progresiva del hero
estado: propuesta
prioridad: p3
asignado: claude
revisor: codex
area: landing
depende_de: [VFX-016]
blueprint:
rama:
archivos: []
bloqueo:
creado: 2026-10-13
actualizado: 2026-10-13
---

## Contexto

La "firma" premium sería un shader de cáusticas (la red de luz que se forma en el fondo de una
piscina) sobre el gradiente del hero, en tiempo real. Es el único efecto del plan que necesita JS,
así que **contradice la ADR 0002 §1** y requiere una decisión nueva. Por eso queda en `propuesta`.

## Condiciones para pasar a `lista`

1. VFX-016 en producción, con su LCP medido como línea base.
2. Claudio aprueba gastar presupuesto de JS en el hero.
3. Claude escribe la ADR 0003 y un prototipo aislado que cumpla:
   - WebGL1 crudo, **sin librerías** (≤ 4 kB gzip entre shader y loader).
   - Isla cliente cargada con `next/dynamic` y `ssr: false`, después de `requestIdleCallback`.
   - `<canvas aria-hidden>` con DPR limitado a 1,5 y 30 fps en mobile.
   - Pausa con `visibilitychange` y cuando el hero sale de la vista.
   - No arranca con `prefers-reduced-motion`, `navigator.connection.saveData` ni
     `hardwareConcurrency ≤ 4`, y tampoco si `getContext('webgl')` falla. En todos esos casos
     queda la aurora CSS de VFX-016.
   - La capa va debajo del scrim, para que el contraste no cambie.
   - LCP móvil ≤ línea base + 100 ms.

## Bitácora

### 2026-10-13 · claude · → propuesta
- Abierta como idea de fase 3. No se implementa sin la ADR 0003.

## Revisión
