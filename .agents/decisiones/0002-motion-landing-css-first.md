# 0002 — Motion de la landing: CSS primero, cero JS, cero dependencias

- **Fecha:** 2026-10-13
- **Estado:** aceptada
- **Tareas:** VFX-015 a VFX-020

## Contexto

La portada se siente estática: el hero es un gradiente fijo con dos blobs inmóviles, el H1 aparece
de golpe y las secciones son bloques planos. Se quiere una portada con presencia de startup:
texto que entra palabra por palabra, fondos vivos y una identidad "agua viva".

Restricciones que no se negocian (`CLAUDE.md`, `.claude/rules/landing-publica.md`): cero
dependencias nuevas, solo `transform` y `opacity`, nada aleatorio en el render, contraste AA con el
scrim del hero, y apagado total con `prefers-reduced-motion`.

## Decisión

1. **Todo el motion de las fases 1 y 2 es CSS puro sobre Server Components.** No se agrega
   `'use client'` ni JS al bundle de `/` por animación. El *First Load JS* de `/` que reporta
   `npm run build` no puede subir respecto de la línea base que registra VFX-015.
2. **Texto palabra por palabra:** un Server Component `TextoRevelado` parte el texto con una función
   pura (`lib/landing/palabras.ts`) y pinta cada palabra en una "máscara" (`overflow: hidden`) con
   un `<span>` interno que sube desde `translateY(110%)`. El retraso de cada palabra sale de una
   variable CSS `--i`. Los lectores de pantalla reciben el texto completo una sola vez (texto
   `sr-only` + spans `aria-hidden`).
3. **El estado por defecto es siempre el visible.** Las animaciones de entrada se declaran **solo**
   dentro de `@media (prefers-reduced-motion: no-preference)`. Sin ese bloque, o si el CSS
   falla, todo el texto se ve. Nunca se deja un elemento con `opacity: 0` fuera de esa media query.
4. **Revelar al hacer scroll** usa scroll-driven animations (`animation-timeline: view()`) dentro de
   `@supports (animation-timeline: view())`. Navegadores sin soporte ven el contenido estático. No
   se usa `IntersectionObserver`, porque obligaría a una isla de cliente.
5. **Fondos vivos** = capas decorativas (`aria-hidden`) que mueven solo `transform`/`opacity`. Se
   permite `filter: blur()` **estático** sobre los blobs (se pinta una vez y el compositor solo los
   traslada); nunca animar `filter`, `background-position`, `box-shadow`, `width`/`height` ni `top`/`left`.
   Sombras animadas = pseudo-elemento con la sombra y transición de `opacity`.
6. **Determinismo:** toda posición o duración "aleatoria" sale de un LCG sembrado en `lib/landing/**`,
   calculado a nivel de módulo, igual que `generarGotas`.
7. **Movimiento que lleva información termina solo** (WCAG 2.2.2): la palabra rotativa del H1 hace
   ciclos finitos y se detiene en la palabra canónica. Solo las capas decorativas son infinitas.
8. **WebGL queda fuera de las fases 1 y 2.** Solo entra como mejora progresiva (VFX-020), con su
   propio presupuesto y una justificación por escrito, porque agrega JS.

## Presupuesto de rendimiento

| Métrica | Límite |
|---|---|
| First Load JS de `/` | ≤ línea base de VFX-015 (+0 KB) |
| Elementos animados a la vez en el hero | ≤ 30 |
| Coreografía de entrada del hero | termina en ≤ 1,4 s |
| Propiedades animadas | solo `transform`, `opacity` |
| LCP móvil (Lighthouse, throttling por defecto) | ≤ línea base + 200 ms |

## Consecuencias

- Firefox sin scroll-driven animations ve las secciones estáticas: es aceptable.
- Las tareas de motion se encadenan con `depende_de` porque todas tocan `app/globals.css`.
- Agregar una librería de animación exige una decisión nueva que reemplace a esta.
