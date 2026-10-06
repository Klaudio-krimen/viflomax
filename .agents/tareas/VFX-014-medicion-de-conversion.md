---
id: VFX-014
titulo: Medir el embudo de conversión de la landing (visita → formulario → pedido → WhatsApp)
estado: propuesta
prioridad: p2
asignado: humano
revisor: claude
area: landing
depende_de: []
blueprint:
rama:
archivos: []
bloqueo:
creado: 2026-10-05
actualizado: 2026-10-05
---

## Contexto

No hay ninguna analítica en el sitio. Sin datos no se puede saber si VFX-009, VFX-010 y VFX-011
mejoran algo, ni de qué canal llegan los clientes.

Opciones:
- **Vercel Web Analytics** (`@vercel/analytics`): sin cookies (sin banner), eventos
  personalizados en planes pagos. Agrega una dependencia → requiere razón en el commit (regla 4).
- **Google Analytics 4 + Search Console:** gratis, más potente para SEO local, pero con cookies.

## Criterios de aceptación

- [ ] El humano elige herramienta y plan.
- [ ] Claude redacta el ADR y la tarea `lista` con eventos: `clic_pedir_hero`, `producto_elegido`,
      `pedido_enviado`, `pedido_ok`, `whatsapp_abierto`.

## Bitácora

### 2026-10-05 · claude · → propuesta
- Hallazgo L6 de la auditoría. Recomendación: Vercel Web Analytics + Search Console (gratis).

## Revisión
