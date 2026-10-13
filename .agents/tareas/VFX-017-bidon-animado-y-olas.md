---
id: VFX-017
titulo: Llevar el hero a dos columnas con un bidón SVG animado y unir las secciones con olas
estado: lista
prioridad: p1
asignado:
revisor: claude
area: landing
depende_de: [VFX-016]
blueprint:
rama:
archivos: [components/public/Hero.tsx, components/public/BidonAnimado.tsx, components/public/OlaDivisora.tsx, app/(public)/page.tsx, app/globals.css]
bloqueo:
creado: 2026-10-13
actualizado: 2026-10-13
---

## Contexto

El producto real (el bidón de 20 L) no aparece en la portada. Esta tarea pone un **bidón vivo** como
héroe visual y reemplaza los cortes rectos entre secciones por olas en movimiento, para que la página
"fluya" de una sección a otra. El layout de dos columnas ya estaba aprobado en
`design_handoff_landing_redesign/README.md` §2.

## Criterios de aceptación

- [ ] **Layout:** el hero pasa a una grilla `lg:grid-cols-[1.2fr_0.8fr]`, con el texto alineado a la
      izquierda en desktop y centrado en mobile. La columna derecha lleva `BidonAnimado`. En mobile,
      el bidón va **debajo** del texto y mide ≤ 220 px de alto. El logo con `logo-float` se mantiene
      (sobre el texto o como etiqueta del bidón; dejar anotado en la bitácora cuál se eligió y por qué).
- [ ] **`BidonAnimado.tsx`** es un Server Component con un `<svg>` inline (`aria-hidden="true"`) que dibuja:
      1. La silueta del bidón de 20 L (cuerpo, hombro, cuello y tapa) con trazo blanco y relleno `white/10`.
      2. El agua adentro, recortada por un `<clipPath>` con la forma del cuerpo: dos `<path>` de ola de
         doble ancho (`viflomax-azul-400` y `viflomax-azul` a distinta opacidad) que se trasladan en X en
         loop, a 7 s y 11 s y en sentidos opuestos (parallax).
      3. Un llenado inicial: el grupo de agua sube desde `translateY(100%)` hasta el ~80 % en
         1,2 s `cubic-bezier(0.22,1,0.36,1)` con 400 ms de retraso. Ocurre una sola vez.
      4. 4 burbujas internas como máximo, con posiciones de `generarBurbujas` y semilla propia, que suben dentro del clip.
      5. Un reflejo vertical estático (rect blanco/15 con esquinas redondeadas) que vende el volumen.
      Los colores salen de clases Tailwind o de `currentColor`, nunca de hex sueltos.
- [ ] **`OlaDivisora.tsx`** es un Server Component con props `{ colorClase: string; invertida?: boolean }`,
      que pinta 3 capas de ola SVG (`preserveAspectRatio="none"`, 200 % de ancho) a opacidad 0,3 / 0,5 / 1,
      trasladándose en X a 18 s, 13 s y 9 s. La capa opaca usa exactamente el color de fondo de la
      sección siguiente, así no se ve la costura.
- [ ] Se usa `OlaDivisora` en: base del hero → `ProductGrid` (`text-gray-50`) y antes de la sección
      `#pedido` en `page.tsx`. Las olas no tapan contenido interactivo y no agregan alto en mobile
      más allá de 48 px.
- [ ] Keyframes nuevas (`ola-x`, `llenar-bidon`, `burbuja-interna`) solo `transform`/`opacity`,
      dentro del bloque no-preference. Con reduced-motion: bidón lleno al 80 %, olas quietas.
- [ ] Sin scroll horizontal a 320, 375, 390, 768 y 1440 px.
- [ ] **Móvil primero (hallazgo de la maqueta de Codex):** a 390 × 844, los dos CTAs del hero quedan completos dentro de la primera pantalla (hoy están en y=728–868). Se logra compactando el padding y el logo del hero, sin `min-h-[90vh]` en móvil, con el orden mensaje → CTAs → bidón.
- [ ] El botón flotante de WhatsApp no tapa los CTAs del hero a 390 px.
- [ ] La maqueta `design_handoff_landing_redesign/agua-viva/concepto.html` es la referencia de composición (marco curvo, reflejo, etiqueta "20 litros"); se integra con Nunito y Outfit y con los tokens de `tailwind.config.ts`.
- [ ] `npm run lint && npx jest && npm run build` sale con código 0; First Load JS de `/` = línea base.

## Fuera de alcance

- Ilustraciones raster o fotos nuevas.
- Interacción con el mouse (parallax por cursor): requiere JS y queda fuera de la ADR 0002.

## Notas de implementación

- La ola SVG se hace con un `path` de curvas `C` que se repite dos veces dentro del ancho del 200 %,
  así `translateX(-50%)` cierra el loop sin salto.
- `transform-box: fill-box` en los `<g>` animados del SVG para que `translateY(%)` sea relativo al grupo.
- `page.tsx` hoy envuelve todo en `PedidoProvider`: no mover componentes fuera de él. La ola es un hermano más.

## Bitácora

### 2026-10-13 · claude · propuesta → lista
- Para codex, después de VFX-016 (comparten `Hero.tsx` y `globals.css`).

### 2026-10-13 · claude · lista → lista (ajuste de criterios)
- Se agregan el criterio de CTAs en la primera pantalla en móvil, el límite de 4 burbujas internas y la maqueta de Codex como referencia visual.

## Revisión
