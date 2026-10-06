---
id: VFX-009
titulo: Garantizar el paso a WhatsApp tras el pedido aunque el navegador bloquee la ventana emergente
estado: lista
prioridad: p1
asignado:
revisor: claude
area: landing
depende_de: []
blueprint:
rama:
archivos: [components/public/PedidoForm.tsx, lib/landing/**]
bloqueo:
creado: 2026-10-05
actualizado: 2026-10-05
---

## Contexto

`components/public/PedidoForm.tsx:51` llama `window.open(linkWhatsApp(...))` **después** de
`await fetch(...)`. Safari en iOS y varios navegadores Android bloquean `window.open` fuera del
gesto directo del usuario: el pedido queda creado, pero el cliente nunca llega a WhatsApp y el
negocio pierde el canal de confirmación. Además, el bloqueo no se detecta ni se informa.

## Criterios de aceptación

- [ ] CUANDO el pedido responde 201 y `TIENE_WHATSAPP` es verdadero EL SISTEMA DEBERÁ mostrar en el
      mensaje de éxito un enlace nativo `<a href={linkWhatsApp(mensaje)} target="_blank"
      rel="noopener noreferrer">` con el texto «Confirmar por WhatsApp», con estilo de CTA
      (`bg-viflomax-verde-700`, `rounded-full`) y foco visible.
- [ ] CUANDO el intento automático de `window.open` devuelve `null` EL SISTEMA DEBERÁ mover el foco a
      ese enlace para que el usuario lo vea de inmediato.
- [ ] CUANDO el pedido termina con éxito EL SISTEMA DEBERÁ limpiar el formulario (manteniendo el
      mensaje con el número de pedido) para evitar un segundo envío accidental.
- [ ] `npm run lint && npx jest && npm run build` sale con código 0.

## Fuera de alcance

- Cambiar el texto del mensaje de WhatsApp (`lib/landing/mensaje-whatsapp.ts`).

## Notas de implementación

Leer `.claude/rules/landing-publica.md`. El número sale de `lib/contacto.ts`; nunca literal.

## Bitácora

### 2026-10-05 · claude · → lista
- Hallazgo L1 de la auditoría. Impacto directo en conversión móvil.

## Revisión
