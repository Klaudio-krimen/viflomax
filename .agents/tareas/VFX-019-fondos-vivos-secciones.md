---
id: VFX-019
titulo: Reemplazar los fondos planos de "Por qué elegirnos" y "Haz tu pedido" por fondos vivos
estado: lista
prioridad: p2
asignado:
revisor: claude
area: landing
depende_de: [VFX-018]
blueprint:
rama:
archivos: [components/public/PorQueElegirnos.tsx, components/public/AuroraFondo.tsx, app/(public)/page.tsx, app/globals.css]
bloqueo:
creado: 2026-10-13
actualizado: 2026-10-13
---

## Contexto

Después de VFX-016 a VFX-018 quedan dos bloques blancos sin vida: "Por qué elegirnos" y el
contenedor de `#pedido`. El handoff aprobado ya pedía `azul-100` para el primero y un gradiente
verde→azul para el segundo. Esta tarea los entrega **en movimiento**, a una intensidad menor que la
del hero: se mueven, pero no compiten con el contenido.

## Criterios de aceptación

- [ ] `AuroraFondo` acepta la prop `variante: 'hero' | 'suave'`. `suave` usa blobs
      `viflomax-azul-200` y `viflomax-verde-200` a opacidad 0,5 sobre `bg-viflomax-azul-100`, con
      periodos de 25–35 s. La variante `hero` queda idéntica a la de VFX-016.
- [ ] "Por qué elegirnos" usa `AuroraFondo variante="suave"`; sus tarjetas pasan de `bg-gray-50` a
      `bg-white/80` con `backdrop-blur-sm` (estático) y `border-white`.
- [ ] La sección `#pedido` en `page.tsx` recibe una capa decorativa: un gradiente
      `from-viflomax-verde-100 via-white to-viflomax-azul-100` al 200 % del tamaño, que **se traslada**
      (`transform`, no `background-position`) en diagonal en 30 s `alternate`. La tarjeta del
      formulario no se toca: está bloqueada por VFX-009 y VFX-010.
- [ ] Contraste verificado y anotado en la bitácora: el texto más débil de cada sección (gray-600)
      sobre el punto más oscuro de su nuevo fondo pasa 4.5:1.
- [ ] Reduced-motion: fondos quietos, colores intactos.
- [ ] `npm run lint && npx jest && npm run build` sale con código 0; First Load JS de `/` sin cambios respecto de VFX-018.

## Fuera de alcance

- `PedidoForm.tsx`.
- La sección de productos: ya tiene la lluvia de gotas y no se le suma otra capa.

## Bitácora

### 2026-10-13 · claude · propuesta → lista
- Para codex, después de VFX-018.

## Revisión
