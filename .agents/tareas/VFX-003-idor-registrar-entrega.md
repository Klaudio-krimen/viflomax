---
id: VFX-003
titulo: Impedir que un chofer registre la entrega de un pedido que no le fue asignado
estado: lista
prioridad: p0
asignado:
revisor: claude
area: api
depende_de: []
blueprint:
rama:
archivos: [app/api/entregas/route.ts, lib/entregas.ts, lib/entregas.test.ts]
bloqueo:
creado: 2026-10-05
actualizado: 2026-10-05
---

## Contexto

`POST /api/entregas` (`app/api/entregas/route.ts:82`) carga el pedido por `pedido_id` y, si el rol
es `chofer`, usa el chofer del token, pero **nunca compara `pedido.chofer_id` con ese chofer**.
Cualquier chofer con sesión puede marcar como entregado cualquier pedido del sistema, descontar
stock y registrar cobros a su nombre (IDOR, OWASP A01).

Además, el chequeo de `estado` ocurre fuera de la transacción (lectura y escritura no atómicas).

## Criterios de aceptación

- [ ] CUANDO un chofer registra la entrega de un pedido con `chofer_id` distinto al suyo EL SISTEMA
      DEBERÁ responder 403 sin crear la entrega ni tocar stock.
- [ ] CUANDO un chofer registra la entrega de un pedido sin `chofer_id` EL SISTEMA DEBERÁ responder
      403 (solo admin entrega pedidos sin asignar).
- [ ] CUANDO un admin registra la entrega EL SISTEMA DEBERÁ comportarse igual que hoy.
- [ ] CUANDO se evalúa la regla EL SISTEMA DEBERÁ usar una función pura
      `puedeRegistrarEntrega({ rol, choferIdSesion, pedido })` en `lib/entregas.ts`, cubierta por
      `lib/entregas.test.ts` con cuatro casos: admin, chofer dueño, chofer ajeno, pedido sin asignar.
- [ ] CUANDO dos requests entregan el mismo pedido a la vez EL SISTEMA DEBERÁ aceptar solo una
      (verificación de estado dentro de `db.$transaction`, p. ej. `updateMany` condicionado a
      `estado notIn ['entregado','cancelado']` y chequeo de `count`).
- [ ] `npm run lint && npx jest && npm run build` sale con código 0.

## Fuera de alcance

- Migrar el handler al guard central: lo hace VFX-005.

## Notas de implementación

Agregar `chofer_id` al `select` del pedido (~línea 126). La función pura no importa `db`.

## Bitácora

### 2026-10-05 · claude · → lista
- Hallazgo S2 de la auditoría. Buena tarea para codex; revisa claude.

## Revisión
