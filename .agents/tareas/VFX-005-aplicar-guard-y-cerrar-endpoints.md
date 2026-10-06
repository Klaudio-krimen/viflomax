---
id: VFX-005
titulo: Migrar todos los handlers de app/api al guard central y cerrar los abiertos a cualquier sesión
estado: lista
prioridad: p1
asignado:
revisor: claude
area: api
depende_de: [VFX-004]
blueprint:
rama:
archivos: [app/api/**/route.ts]
bloqueo:
creado: 2026-10-05
actualizado: 2026-10-05
---

## Contexto

Endpoints que hoy solo exigen "tener sesión", con cualquier rol, incluidos `publico` y `visor`
(`prisma/schema.prisma:61`):

| Endpoint | Riesgo |
|---|---|
| `POST /api/clientes` | un `visor` o `publico` crea clientes |
| `POST /api/precios/calcular` | con `clienteId` revela tipo, sector y empresa de cualquier cliente |
| `GET /api/productos`, `GET /api/bodegas` | lectura por roles que no deberían |
| `POST /api/ubicaciones` | sin chequeo de rol (mitigado porque exige turno activo) |

## Criterios de aceptación

- [ ] CUANDO se busca `getToken(` en `app/api/**` EL SISTEMA DEBERÁ encontrarlo solo en
      `app/api/auth/**`; todo lo demás usa `requerirSesion`.
- [ ] CUANDO un usuario `visor` o `publico` llama `POST /api/clientes` o `POST /api/precios/calcular`
      EL SISTEMA DEBERÁ responder 403. Permitidos: `admin` y `chofer`.
- [ ] CUANDO un chofer desactivado llama cualquier endpoint EL SISTEMA DEBERÁ responder 403.
- [ ] CUANDO un admin usa el panel EL SISTEMA DEBERÁ seguir funcionando igual (prueba manual de
      pedidos, clientes, inventario y flota, anotada en la bitácora).
- [ ] `npm run lint && npx jest && npm run build` sale con código 0.

## Fuera de alcance

- `app/api/pedidos/publico/route.ts` (no se edita).
- `app/api/entregas/route.ts` mientras VFX-003 esté `en-curso`: coordinar en la bitácora.

## Notas de implementación

Diff mecánico pero grande: partirlo en un commit por carpeta. Documentar los roles permitidos en el
JSDoc de cada handler.

## Bitácora

### 2026-10-05 · claude · → lista
- Hallazgo S4 de la auditoría. Para codex cuando VFX-004 esté hecha.

## Revisión
