---
id: VFX-011
titulo: Permitir pedir varios productos en un solo pedido desde la landing
estado: propuesta
prioridad: p1
asignado: claude
revisor: codex
area: landing
depende_de: [VFX-010]
blueprint:
rama:
archivos: []
bloqueo:
creado: 2026-10-05
actualizado: 2026-10-05
---

## Contexto

Hoy el formulario admite **un** producto y una cantidad. El caso típico de este negocio es mixto
(«2 recargas de 20 L + 1 dispensador»): el cliente tiene que hacer dos pedidos o escribirlo en
notas, y el ticket promedio baja.

El contrato del endpoint **ya acepta** `items: [{ productoId, cantidad }]`, así que es un cambio
solo de cliente, sin tocar el contrato congelado.

## Criterios de aceptación

- [ ] Claude define el diseño de interacción (selector con +/− por producto en `ProductGrid`,
      resumen en el formulario) en una nota en esta tarea y la pasa a `lista` con criterios.

## Bitácora

### 2026-10-05 · claude · → propuesta
- Hallazgo L3 de la auditoría. Mayor palanca de ticket promedio; necesita diseño antes de implementar.

## Revisión
