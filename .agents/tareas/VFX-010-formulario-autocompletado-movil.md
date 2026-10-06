---
id: VFX-010
titulo: Reducir la fricción del formulario de pedido en móvil (autocompletado, teclado, total, comuna)
estado: lista
prioridad: p1
asignado:
revisor: claude
area: landing
depende_de: [VFX-009]
blueprint:
rama:
archivos: [components/public/PedidoForm.tsx, lib/landing/**]
bloqueo:
creado: 2026-10-05
actualizado: 2026-10-05
---

## Contexto

El formulario (`components/public/PedidoForm.tsx`) tiene 8 campos sin ayuda del navegador:

- Ningún input tiene `autoComplete`: el usuario de móvil escribe nombre, teléfono y dirección a mano.
- Teléfono sin `inputMode`/formato chileno; cantidad acepta `0.5` desde el teclado.
- No se muestra el total antes de enviar: el cliente no sabe cuánto pagará.
- «Otra comuna» se acepta en silencio: se crea un pedido fuera de zona que luego hay que rechazar.
- Botones `rounded-lg` y `rounded-xl` contradicen el sistema de diseño (`rounded-full`, `CLAUDE.md`).

## Criterios de aceptación

- [ ] CUANDO se inspeccionan los inputs EL SISTEMA DEBERÁ tener `autoComplete` = `name`, `tel`,
      `email`, `street-address`; teléfono con `inputMode="tel"` y `placeholder="9 1234 5678"`.
- [ ] CUANDO se elige producto y cantidad EL SISTEMA DEBERÁ mostrar «Total estimado: $X» calculado
      con una función pura `calcularTotalEstimado` en `lib/landing/` con test (precios de
      `lib/productos.ts`, sin cambiarlos).
- [ ] CUANDO la comuna es «Otra comuna» EL SISTEMA DEBERÁ mostrar un aviso visible (no bloqueante)
      de que se confirmará la cobertura por WhatsApp antes de despachar.
- [ ] CUANDO el teléfono no tiene 9 dígitos chilenos (con o sin `+56`) EL SISTEMA DEBERÁ mostrar un
      error accesible (`aria-describedby`) antes de enviar; la validación vive en
      `lib/landing/telefono.ts` con test.
- [ ] CUANDO se renderizan el botón de envío y los CTA del hero EL SISTEMA DEBERÁ usar `rounded-full`.
- [ ] `npm run lint && npx jest && npm run build` sale con código 0.

## Fuera de alcance

- Pedido de varios productos a la vez: VFX-011.

## Bitácora

### 2026-10-05 · claude · → lista
- Hallazgo L2 de la auditoría. Depende de VFX-009 porque ambas tocan `PedidoForm.tsx`.

## Revisión
