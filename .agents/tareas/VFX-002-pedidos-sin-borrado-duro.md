---
id: VFX-002
titulo: Reemplazar el borrado duro de pedidos por cancelación para que la numeración no colisione
estado: lista
prioridad: p0
asignado:
revisor: claude
area: api
depende_de: []
blueprint:
rama:
archivos: [app/api/pedidos/[id]/route.ts, app/admin/pedidos/**, components/admin/**]
bloqueo:
creado: 2026-10-05
actualizado: 2026-10-05
---

## Contexto

Los tres caminos que crean pedidos numeran con `count() + 1`:
`app/api/pedidos/publico/route.ts` (congelado), `app/api/pedidos/route.ts:221` y
`app/api/ventas-terreno/route.ts:71`. `numero_pedido` es `@unique` (`prisma/schema.prisma:135`).

`DELETE /api/pedidos/[id]` (`app/api/pedidos/[id]/route.ts:9`) borra el pedido en duro. Con 10
pedidos (0001 a 0010), borrar el 0003 deja `count() = 9` → el siguiente número es 0010, que ya
existe → violación de unicidad → 500. Como `count()` no vuelve a subir, **todos** los pedidos
siguientes (web, admin y terreno) fallan para siempre. Es una caída total de ventas disparada por
un clic de admin.

El endpoint público no se puede editar, así que la corrección es que el conteo nunca baje.

## Criterios de aceptación

- [ ] CUANDO un admin llama `DELETE /api/pedidos/[id]` EL SISTEMA DEBERÁ dejar el pedido con
      `estado: 'cancelado'` en vez de borrarlo y responder 200 con el mismo formato que hoy.
- [ ] CUANDO el pedido tiene `stock_descontado: true` EL SISTEMA DEBERÁ tratar el stock igual que
      cuando se cancela vía `PATCH` (reutilizar esa lógica, no inventar otra).
- [ ] CUANDO se cuentan pedidos antes y después de un `DELETE` EL SISTEMA DEBERÁ devolver el mismo
      número.
- [ ] CUANDO un admin ve la UI de pedidos EL SISTEMA DEBERÁ mostrar la acción como «Cancelar
      pedido», no «Eliminar».
- [ ] `npm run lint && npx jest && npm run build` sale con código 0.

## Fuera de alcance

- Arreglar la numeración en sí (secuencia atómica): requiere descongelar el endpoint público → VFX-008.

## Notas de implementación

Buscar quién llama al `DELETE` desde la UI (`grep -rn "pedidos/" app/admin components/admin`).
**Antes de mergear, el humano verifica producción:** `SELECT count(*), max(numero_pedido) FROM
"Pedido";` — si `count` es menor que el número del máximo, la creación de pedidos **ya está rota**
y hay que reparar datos.

## Bitácora

### 2026-10-05 · claude · → lista
- Hallazgo S1 de `.agents/auditorias/2026-10-05-seguridad-y-landing.md`.

## Revisión
