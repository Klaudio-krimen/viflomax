# Viflomax — instrucciones para agentes

Sistema digital de Agua Viflomax (distribución de agua purificada a domicilio, Maipú, Chile).
Esta rama de trabajo agrega **rastreo GPS de choferes en turno** y una **vista de flota en vivo**
para administración.

## Comandos

| Tarea | Comando |
|---|---|
| Instalar | `npm install` |
| Servidor de desarrollo | `npm run dev` — http://localhost:3000 |
| Build | `npm run build` (ejecuta `prisma generate && next build`) |
| Lint | `npm run lint` |
| Tests unitarios | `npm test` · un archivo: `npm test -- lib/ubicaciones.test.ts` |
| Cliente Prisma | `npx prisma generate` |
| Estado de migraciones | `npx prisma migrate status` |
| Purga de ubicaciones | `npm run ubicaciones:purgar` |

**Gate:** `npm run build && npm run lint && npm test` debe pasar antes de marcar cualquier tarea
como terminada. No existe `npm run typecheck` en este repositorio: el chequeo de tipos ocurre
dentro de `next build`.

Versión de Node fijada en `.nvmrc` (v20). Las versiones de dependencias viven en
`package-lock.json` — léelo, nunca las adivines.

## No negociable

1. **`react-leaflet` se instala con pin exacto `4.2.1`.** `npm i react-leaflet` sin pin trae
   `5.0.0`, cuyos peers exigen React 19 y rompen este proyecto (React 18).
2. **El flujo de turnos está congelado.** `components/chofer/TurnoBanner.tsx`,
   `app/api/turnos/route.ts` y `app/api/turnos/[id]/route.ts` no se modifican. El rastreo **lee**
   el estado del turno; nunca lo escribe.
3. **Nunca hardcodear una marca de tiempo del cliente.** `Ubicacion.registrado_en` es
   `@default(now())` del servidor.
4. **`visor` nunca entra a `/admin/flota`.** El item "Flota" va en `navItems` de
   `components/admin/Sidebar.tsx` y **jamás** en `VISOR_HREFS`.
5. **Nunca editar a mano un archivo de migración ya aplicado.** Se genera uno nuevo.
6. **Nunca commitear `.env` ni secretos.** `SHADOW_DATABASE_URL` es sólo local y no se sube a Vercel.

Arquitectura completa, límites de importación y tokens de diseño: ver `CLAUDE.md` en este directorio.
