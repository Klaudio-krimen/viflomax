---
description: Contratos que no se editan — endpoint público de pedidos, catálogo y datos de contacto
paths:
  - "app/api/pedidos/publico/**"
  - "lib/productos.ts"
  - "lib/contacto.ts"
---

- **`app/api/pedidos/publico/route.ts` no se edita.** Es el contrato del que dependen la landing y el
  panel. Si el cliente no lo satisface, el que cambia es el cliente.
- El cuerpo del `POST` es exactamente
  `{ nombre, telefono, email?, direccion, comuna, items: [{ productoId, cantidad }], notas? }`.
  `nombre`, `telefono`, `direccion` y `comuna` son obligatorios y no vacíos tras `trim()`; con
  cualquiera vacío el endpoint responde **400**.
- **`productoId` es el nombre del producto**, no un id ni un slug: el servidor lo resuelve buscando
  coincidencia exacta contra `Producto.nombre` en la base. Nada de `encodeURIComponent` ni de
  normalizar mayúsculas en el valor enviado.
- `email` y `notas` vacíos se **omiten** del cuerpo; no se mandan como string vacío.
- **Solo `201` es éxito.** Trae `{ data: { pedido_id, numero_pedido }, error: null }`. Cualquier otro
  status muestra el `error` del cuerpo y **no** abre WhatsApp.
- **Los nombres, precios y categorías de `PRODUCTOS` no se cambian.** Renombrar un producto rompe la
  resolución del endpoint contra la base y con eso todos los pedidos web.
- Lo único que se agregó a `lib/productos.ts` es `filtrarPorCategoria`, que es pura y no muta la
  entrada. `formatCLP` ya existía: se reutiliza, no se reimplementa.
- **`lib/contacto.ts` es la única fuente del teléfono, del horario y de la zona.** Ningún componente
  escribe un número literal. `TIENE_WHATSAPP` es la condición que decide si se muestra cualquier
  cosa relacionada con WhatsApp; con `false`, el pedido igual se guarda y solo se muestra el mensaje
  de éxito.
- `HORARIO` es `'Lun a Sáb · 9:00 – 19:00 hrs'` y refleja el horario real del negocio: no se cambia
  para que coincida con un texto de diseño.
