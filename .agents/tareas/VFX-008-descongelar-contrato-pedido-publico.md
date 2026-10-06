---
id: VFX-008
titulo: Decidir si se descongela el endpoint público para numeración atómica, topes y deduplicación
estado: propuesta
prioridad: p1
asignado: humano
revisor: claude
area: api
depende_de: [VFX-002]
blueprint:
rama:
archivos: []
bloqueo:
creado: 2026-10-05
actualizado: 2026-10-05
---

## Contexto

`app/api/pedidos/publico/route.ts` está congelado (`CLAUDE.md` → Innegociable 1), pero tiene
defectos que solo se arreglan adentro:

1. **Numeración no atómica:** `count() + 1` en la transacción no bloquea; dos pedidos simultáneos
   generan el mismo número y uno falla con 500. VFX-002 evita la colisión permanente, no esta.
2. **Sin topes:** `cantidad` acepta `1e9` o `0.5`; `nombre`, `direccion` y `notas` no tienen largo
   máximo.
3. **Cliente duplicado:** cada pedido web crea un `Cliente` nuevo aunque el teléfono ya exista; la
   base de clientes se infla y el historial de compra queda partido.

Propuesta: descongelar **sin cambiar el contrato observable** (mismo body, mismo 201 con
`numero_pedido`), mover la numeración a una secuencia de Postgres en un módulo
`lib/pedidos/numero.ts` compartido por los tres creadores, validar con topes y hacer upsert del
cliente por teléfono normalizado.

## Criterios de aceptación

- [ ] El humano decide: (a) descongelar con esta propuesta, (b) otra alternativa, (c) dejarlo así.
- [ ] Si elige (a), claude escribe el ADR y parte la implementación en tareas `lista`.

## Bitácora

### 2026-10-05 · claude · → propuesta
- Hallazgo S7 de la auditoría. Requiere decisión humana porque toca una regla innegociable.

## Revisión
