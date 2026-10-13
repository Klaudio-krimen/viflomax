---
id: VFX-018
titulo: Revelar las secciones al hacer scroll y dar microinteracciones líquidas a tarjetas y CTAs
estado: lista
prioridad: p1
asignado:
revisor: claude
area: landing
depende_de: [VFX-017]
blueprint:
rama:
archivos: [components/public/ProductGrid.tsx, components/public/PorQueElegirnos.tsx, components/public/Cobertura.tsx, app/globals.css]
bloqueo:
creado: 2026-10-13
actualizado: 2026-10-13
---

## Contexto

Pasado el hero, la página vuelve a ser estática. Esta tarea extiende el lenguaje "palabra que emerge"
a cada H2, hace entrar las tarjetas en cascada y les da a los botones de compra un hover que se siente
como líquido. Todo es CSS (ADR 0002 §4–5).

## Criterios de aceptación

**Títulos**
- [ ] Los H2 de Productos, Por qué elegirnos y Zona de cobertura usan `TextoRevelado` en modo
      `scroll`. Sus subtítulos usan una clase `.revelar-scroll` (opacidad + `translateY(16px)`
      ligada a `view()`).

**Tarjetas de producto (`ProductGrid`)**
- [ ] Cada `<article>` entra con `.revelar-scroll` y un escalonado por columna:
      `animation-range: entry calc(5% + var(--col) * 6%) cover 25%`, con `--col` = índice % 3.
- [ ] Hover y `:focus-within`: la tarjeta sube con `translateY(-6px)` en 300 ms (`ease-agua`) y su
      sombra crece **sin animar `box-shadow`**: un `::after` con `shadow-xl` pasa de `opacity:0` a 1.
      Se elimina el `transition-shadow` actual.
- [ ] La imagen del producto hace `scale(1.04)` en hover dentro de su contenedor `overflow-hidden`.
- [ ] Botón "Pedir este": **llenado líquido**. Un `::before` en `viflomax-verde-800` con borde
      superior ondulado (máscara SVG inline en el CSS como `data:` URI, o `border-radius` grande)
      sube de `translateY(100%)` a `translateY(0)` en hover/focus-visible en 450 ms. El texto queda por
      encima (`relative z-10`). Blanco sobre verde-700 y verde-800 pasa AA en todo momento.
- [ ] Badge "El más pedido" / "Sin esfuerzo": un único barrido de brillo cuando la tarjeta entra en
      vista (`view()`), no en loop.
- [ ] `ProductGrid` sigue siendo el único componente cliente de esta lista; no se agrega estado ni efectos.

**Por qué elegirnos**
- [ ] Cada tarjeta entra en cascada (`--col` 0..2). El círculo del icono emite **una** onda al
      entrar: un `::after` que hace `scale(1)→scale(1.8)` y `opacity .5→0`.
- [ ] En los tres párrafos, `text-gray-500` pasa a `text-gray-600` (gray-500 sobre gray-50 queda al
      límite de AA y las secciones van a recibir fondos tintados en VFX-019).

**Cobertura**
- [ ] Cada pill de comuna lleva un icono de pin SVG inline con un anillo `ping` (`scale` + `opacity`)
      en loop lento (2,4 s), desfasado entre las dos pills. Es decorativo: `aria-hidden`.

**Global**
- [ ] Todo el motion nuevo vive en `@media (prefers-reduced-motion: no-preference)`; lo atado al scroll
      además va en `@supports (animation-timeline: view())`. Sin soporte o con reduced-motion,
      todo se ve completo y quieto.
- [ ] Ningún `<div onClick>`; los botones siguen siendo `<button>` con `focus-visible:ring-2 focus-visible:ring-viflomax-azul-700`.
- [ ] Ningún componente pasa de 300 líneas.
- [ ] `npm run lint && npx jest && npm run build` sale con código 0; First Load JS de `/` ≤ línea base
      + 0,3 kB (margen solo para el import de `TextoRevelado` dentro de `ProductGrid`, que es cliente).

## Fuera de alcance

- `PedidoForm.tsx` (bloqueado por VFX-009 y VFX-010).
- Fondos tintados o en movimiento de las secciones (VFX-019).
- Contadores animados de precio: los precios deben leerse quietos y exactos.

## Notas de implementación

- `TextoRevelado` no tiene hooks: importarlo dentro de `ProductGrid` (cliente) funciona; solo agrega
  su código, que es mínimo, al bundle. Alternativa sin costo: pasar el encabezado como `children`
  desde `page.tsx`. Elegir una y justificarla en la bitácora.
- `animation-range` con `calc()` y variables está soportado donde está `view()`.

## Bitácora

### 2026-10-13 · claude · propuesta → lista
- Para codex, después de VFX-017.

## Revisión
