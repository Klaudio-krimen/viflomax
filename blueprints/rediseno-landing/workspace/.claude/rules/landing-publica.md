---
description: Convenciones de la landing pública — frontera Server/Client, contraste y determinismo
paths:
  - "components/public/**"
  - "lib/landing/**"
  - "app/(public)/**"
---

- **Server Component por defecto.** `'use client'` solo con `useState`, `useEffect` o handlers de
  evento, y siempre en la hoja. Hoy solo lo llevan `PedidoProvider`, `ProductGrid`, `PedidoForm` y
  `ProductoImagen`.
- Un Server Component pasado como *child* de un Client Component **sigue renderizando en el
  servidor**. Así es como `PorQueElegirnos` y `Cobertura` viven dentro de `PedidoProvider` con cero
  JS de cliente. No convertirlos a cliente "para que anden".
- **Nada de `Math.random()` ni `Date.now()` durante el render.** La home es estática y se hidrata; la
  lluvia usa `generarGotas(semilla, cantidad, color)` de `lib/landing/gotas.ts`, invocada **a nivel
  de módulo** con una semilla literal.
- **`lib/landing/**` es puro:** sin React, sin `fetch`, sin `window`, sin `process.env`. Es lo único
  que este repo puede testear, porque no hay Testing Library instalada. Toda lógica del formulario
  que valga la pena verificar se extrae acá primero.
- **Contraste, sin excepciones.** Texto blanco sobre verde va en `bg-viflomax-verde-700` (5.95:1);
  sobre azul, en `bg-viflomax-azul-700` (6.65:1) o `-800` (9.57:1). `bg-viflomax-verde` (2.65:1) y
  `bg-viflomax-azul` (2.98:1) **nunca** llevan texto blanco.
- El hero conserva su capa `bg-black/30` entre el gradiente y el contenido: sin ella **ningún** texto
  del hero pasa AA, ni siquiera el `<h1>` — el blanco queda en 2.65:1 sobre la parada verde.
- **Todo elemento interactivo es nativo** — `<button>`, `<a>`, `<input>`, `<select>` — con foco
  visible (`focus-visible:ring-2 focus-visible:ring-viflomax-azul-700`). Nunca `<div onClick>` ni
  `outline-none` sin reemplazo.
- Decoración (blobs, gotas, iconos) siempre con `aria-hidden="true"`.
- Anclas de destino con `scroll-mt-24`, para que el header sticky no las tape (WCAG 2.4.11).
- **Cero dependencias nuevas.** Iconos: `<svg>` inline. Animación: keyframes en `app/globals.css`.
- Toda animación nueva se apaga dentro del bloque `@media (prefers-reduced-motion: reduce)` de
  `app/globals.css`. Ese bloque lo crea el paso 3 del build; si todavía no está, se crea junto con la
  primera animación.
