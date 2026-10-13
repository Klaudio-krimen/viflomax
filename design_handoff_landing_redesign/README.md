# Handoff: Landing Page Redesign — Agua Viflomax

## Overview
Redesign of the public home page (`app/(public)/page.tsx` + `Hero.tsx` + `ProductGrid.tsx`) for Agua Viflomax, a purified-water home delivery business in Maipú and Padre Hurtado, Chile. Adds an inline order form (WhatsApp checkout), a "why choose us" section, a coverage section, a floating WhatsApp button, and a falling-water-drops background animation. Replaces the current `/pedir` separate-page flow with an inline form on the same page.

## About the Design Files
The bundled file (`Landing Viflomax.dc.html`) is a **design reference built in HTML** — a working prototype showing the intended look, copy, and interaction, not production code to paste in. Recreate it as Next.js/React components using the existing stack: Tailwind CSS, the `viflomax-azul`/`viflomax-verde` custom colors already in `tailwind.config.ts`, `font-nunito`, and the existing component structure (`components/public/*.tsx`).

## Fidelity
**High-fidelity.** Colors, copy, layout proportions, and interactions are final and approved by the client. Recreate pixel-close using Tailwind utilities instead of the prototype's inline styles — do not introduce a new CSS system.

## Design Tokens

Colors (replace the current `viflomax-azul` / `viflomax-verde` shades in `tailwind.config.ts` with these, sourced from the real logo):
- Primary blue (`--color-accent`): `#2f9fd6` — with ramp steps 100 `#eaf6fc`, 300 `#a3d9f0`, 500 `#2f9fd6` (base), 600 `#2380ac`, 700 `#1a628a`, 800 `#164a63`, 900 `#0d2f40`
- Secondary green (`--color-accent-2`): `#6ab04c` — ramp 100 `#eef9e6`, 300 `#bce39c`, 500 `#6ab04c` (base), 600 `#549140`, 700 `#3f6f31`, 800 `#2c4f23`, 900 `#1c3216`
- Background: pure white `#ffffff` everywhere (no cream/tan — that was explicitly removed per client feedback)
- WhatsApp button green: `#25D366` (brand-fixed, not part of the palette)

Typography: keep the existing `font-nunito` for headings; body text can stay on the current body font. Heading sizes used in the prototype: hero H1 58px, section H2 36px, card H3 20px.

Radius/shadow: buttons and tags fully rounded (pill, `border-radius: 999px`); cards use a medium radius (~16px) with a small elevation shadow; the order-form card uses a medium shadow.

## Screens / Views

### 1. Header / Nav
- Sticky top nav, white background with slight blur, bottom border implied by shadow.
- Left: Viflomax logo image (`assets/logo.png`), ~42px tall, links to `#inicio`.
- Right: text links "Productos" (`#productos`) and "Cobertura" (`#cobertura`), then a solid pill CTA button "Pedir ahora" linking to `#pedido` (background = primary blue).

### 2. Hero
- Full-width section, diagonal gradient background: primary blue dark (800) → primary blue base (500) → green base (500), 135deg, white text throughout.
- Two soft circular decorative blobs (white at low opacity) positioned absolute, one top-left, one bottom-right, purely decorative.
- Two-column grid (roughly 1.2fr / 0.8fr) on desktop, stacks on mobile:
  - Left column: a small pill tag "Maipú y Padre Hurtado" (white text on white/20%-opacity background), H1 "Agua purificada a domicilio", paragraph "Recargas, bidones y dispensadores. Pide hoy y te lo dejamos en la puerta el mismo día.", then two buttons side by side: solid white button "Hacer mi pedido" (links `#pedido`) and an outlined white button "Ver productos" (links `#productos`).
  - Right column: the Viflomax logo, large (max 320px wide), with a drop-shadow and a slow continuous float animation (translateY ±14px, 5s ease-in-out loop).

### 3. Nuestros productos (Product catalog)
- White background, section has a **falling-water-drops animation behind the content** (see Interactions & Behavior below) — subtle, low-opacity, endless loop.
- H2 "Nuestros productos", subtext "Precio final en Maipú y Padre Hurtado. Otras comunas se confirman al pedir."
- Filter pills row: "Todos", "Agua y recargas", "Dispensadores", "Extras" — active filter is solid blue, inactive are outlined/secondary style. Clicking filters the grid below by category.
- Responsive card grid (`auto-fill, minmax(280px, 1fr)`), one card per product:
  - Square image area at top (currently a placeholder — see Assets).
  - Optional badge tag (green) for featured items: "Recarga 20 Litros" → "El más pedido"; "Dispensador Bomba USB" → "Sin esfuerzo". Cards with a badge also get a 2px green border.
  - Product name (bold, dark blue), one-line description, price in large green text (CLP format, e.g. "$2.500"), and a full-width solid-blue "Pedir este" button.
  - Clicking "Pedir este" sets that product as selected in the order form and scrolls down to `#pedido`.

**Product data** (name / price CLP / category / description / badge):
| Producto | Precio | Categoría | Badge |
|---|---|---|---|
| Recarga 20 Litros | 2.500 | agua | El más pedido |
| Envase 20 Litros | 5.500 | agua | — |
| Envase 10 Litros | 3.500 | agua | — |
| Recarga 10 Litros | 1.800 | agua | — |
| Dispensador Bomba USB | 25.000 | dispensadores | Sin esfuerzo |
| Dispensador USB Sobremesa | 20.000 | dispensadores | — |
| Dispensador Básico Sobremesa | 15.000 | dispensadores | — |
| Hielo Purificado | 2.000 | extras | — |
| Manilla Transportadora | 1.500 | extras | — |

This matches `lib/productos.ts` exactly — descriptions were written new for this redesign (see full text in the prototype file); prices/names/categories are unchanged from the repo.

### 4. ¿Por qué elegirnos?
- Light blue-tinted background (`--color-accent-100`, `#eaf6fc`).
- H2 "¿Por qué elegirnos?"
- Three-column grid (stacks on mobile), each row = a 64px circular icon badge (alternating blue/green fill, white stroke icon) + heading + one-line description:
  1. Icon: water drop. "100% purificada" — "Proceso certificado que garantiza agua limpia y segura para toda la familia."
  2. Icon: delivery truck. "Entrega el mismo día" — "Pedidos antes del mediodía llegan el mismo día en Maipú y Padre Hurtado."
  3. Icon: price tag. "Precio justo" — "Tarifas transparentes, sin sorpresas. Descuentos para pedidos recurrentes."

### 5. Zona de cobertura
- White background, same falling-water-drops animation behind content (green-tinted drops this time).
- H2 "Zona de cobertura", subtext "Entregamos con ruta fija en estas comunas. ¿Estás en otra zona? Escríbenos y confirmamos."
- Two pill badges (map-pin icon + label), green: "Maipú" and blue: "Padre Hurtado".

### 6. Haz tu pedido (inline order form)
- Section id `pedido`, soft green→blue gradient background.
- H2 "Haz tu pedido", subtext "Completa el formulario y lo enviamos por WhatsApp para confirmar."
- A white card (rounded, shadowed) containing a vertical form with fields: Nombre (text, required), Teléfono (tel, required), Dirección (text, required), Producto (select, populated from the product list with price in the label, e.g. "Recarga 20 Litros — $2.500"), Cantidad (number, min 1, default 1), Notas (text, optional).
- Submit button: "Enviar pedido por WhatsApp" (gradient blue→green fill).

### 7. Footer
- Dark blue background (`--color-accent-900`, `#0d2f40`), white text.
- Left: Viflomax logo (56px), then address "Maipú y Padre Hurtado, Región Metropolitana", phone "+56 9 9099 4633", hours "Lunes a viernes, 09:00 a 19:00 hrs".
- Right (bottom-aligned): "© 2026 Agua Viflomax".

### 8. Floating WhatsApp button
- Fixed bottom-right, green circle (`#25D366`), official WhatsApp glyph, opens `wa.me` with a pre-filled general inquiry message. This mirrors the existing `WhatsAppFloat.tsx` component already in the repo — reuse it as-is (see Interactions below), just confirm it still renders since `TIENE_WHATSAPP` gates it.

## Interactions & Behavior

- **Category filter**: clicking a filter pill sets state and re-renders the product grid to only that category; "Todos" shows all.
- **"Pedir este" on a product card**: sets that product as the selected value in the order form's `<select>` and smooth-scrolls to `#pedido`.
- **Order form submit**: prevents default, builds a plain-text WhatsApp message from the form fields:
  ```
  Hola! Quiero hacer un pedido de Agua Viflomax:
  Producto: {producto} x{cantidad}
  Nombre: {nombre}
  Teléfono: {telefono}
  Dirección: {direccion}
  Notas: {notas}   (only if notas is non-empty)
  ```
  then opens `https://wa.me/56990994633?text=<url-encoded message>` in a new tab. **No backend call** — this is entirely client-side, matching the "WhatsApp checkout, no backend" decision made for this redesign. If the team wants to also persist orders to the existing order backend (`lib/db.ts` / admin), that's a product decision to raise separately — the prototype does not do this.
- **Hero logo float**: continuous CSS animation, translateY 0 → -14px → 0, 5s ease-in-out, infinite. Purely decorative.
- **Water-drop background animation**: endless falling drops behind the "Nuestros productos" and "Zona de cobertura" sections, positioned absolutely behind the content (z-index below content, `pointer-events: none`). Each drop is a small rotated-square "teardrop" shape, falling top→bottom across the viewport height, fading in and out at the top/bottom of its travel. In the prototype this is procedurally generated (deterministic pseudo-random seed) — ~16-18 drops per section, staggered durations (4-9s) and negative delays so they don't all move in sync, low opacity (0.15-0.4). Implement with a small set of absolutely-positioned divs animated via CSS `@keyframes` (translateY + opacity), or a lightweight canvas/SVG version if preferred — visual result should read as continuous, subtle, never distracting from the content in front of it.
- **Responsive behavior**: hero collapses to single column on mobile (logo below text); "why choose us" and product grid collapse to fewer columns; nav links can collapse to a hamburger if the existing nav already does this (check current `layout.tsx` nav — it doesn't currently have a mobile menu, so this may be new work).

## State Management
- Selected category filter (string: `'todos' | 'agua' | 'dispensadores' | 'extras'`).
- Order form fields: nombre, telefono, direccion, producto (defaults to first product), cantidad (defaults to 1), notas.
- No server state / data fetching — product catalog is static (already exists as `lib/productos.ts`).

## Assets
- **Logo**: `assets/logo.png` in this bundle — the real Viflomax logo (blue/green mark), used in header, hero, and footer. Copy into the repo's `public/` folder.
- **Product photos**: NOT included. Each product card has an image placeholder (see `image-slot.js` in this bundle — a drag-and-drop placeholder component used only for prototyping). In the real app, wire each card's image to `producto.imagen` from `lib/productos.ts` (already points at `/productos/<slug>.jpg`) via the existing `ProductoImagen.tsx` component, which already falls back to a brand placeholder if the file is missing. The client has not yet supplied real product photos.
- **Icons**: inline SVGs (water drop, truck, price tag, map pin, WhatsApp glyph) — hand-drawn stroke icons at `stroke-width: 2.75`. Recreate with your icon library of choice (e.g. lucide-react, which the repo may already use) rather than copying the raw SVG paths.

## Files in this bundle
- `Landing Viflomax.dc.html` — the full interactive prototype (open directly in a browser).
- `assets/logo.png` — the Viflomax logo.
- `image-slot.js` — prototyping-only helper for the image placeholders; not needed in the real app.

## Existing repo context (for the implementing developer)
- Current home page: `app/(public)/page.tsx`, composed of `components/public/Hero.tsx` + `components/public/ProductGrid.tsx` + inline "why choose us" + CTA sections. This redesign replaces all of it with the sections described above, and folds the separate `/pedir` page's job into an inline form on the home page.
- `lib/productos.ts` — product catalog, categories, `formatCLP` helper. Reuse as-is; only the descriptions text is new (copy from the prototype file).
- `lib/contacto.ts` — exports `linkWhatsApp()`, `TIENE_WHATSAPP`, `TELEFONO_LEGIBLE`, `TELEFONO_HREF`, `HORARIO`. Reuse for the footer and floating button instead of hardcoding the phone number.
- `components/public/WhatsAppFloat.tsx` — already implements the floating button correctly; no changes needed, just make sure it's still mounted in the new layout.
- `tailwind.config.ts` — currently defines `viflomax-azul` / `viflomax-verde` custom colors; update their hex values to match the tokens above (they were already close to on-brand, but the client wants the exact logo blue `#2f9fd6` used consistently through backgrounds, icons, and prices, not just buttons).
