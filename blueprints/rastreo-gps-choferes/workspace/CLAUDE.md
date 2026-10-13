# Viflomax

Sistema digital de Agua Viflomax — distribución de agua purificada a domicilio en Maipú, Chile.
Esta línea de trabajo agrega rastreo GPS de choferes en turno y vista de flota en vivo para
administración.

## Comandos

| Tarea | Comando |
|---|---|
| Instalar | `npm install` |
| Servidor de desarrollo | `npm run dev` — http://localhost:3000 |
| Build (incluye chequeo de tipos) | `npm run build` |
| Lint | `npm run lint` |
| Tests unitarios | `npm test` · un archivo: `npm test -- lib/ubicaciones.test.ts` |
| Cliente Prisma | `npx prisma generate` |
| Validar schema | `npx prisma validate` |
| Estado de migraciones | `npx prisma migrate status` |
| Crear migración | `npx prisma migrate dev --name <nombre>` |
| Purgar ubicaciones > 90 días | `npm run ubicaciones:purgar` |

**Gate:** `npm run build && npm run lint && npm test` debe pasar antes de marcar cualquier tarea
como terminada.

<!-- No existe `npm run typecheck` en este repositorio. `npm run build` = `prisma generate && next build`,
     y `next build` corre tsc. No inventes un script typecheck: el gate lo cubre el build. -->

Node fijado en `.nvmrc` (v20). Las versiones de dependencias viven en `package-lock.json` — léelo,
nunca las adivines.

## Stack

Next.js 14 App Router · TypeScript · Tailwind CSS · PostgreSQL · Prisma · NextAuth v4 (Credentials +
JWT) · PWA con `@ducanh2912/next-pwa` · Leaflet + react-leaflet para mapas · Vercel.

## Arquitectura

**Camino de una petición de rastreo.** Navegador del chofer → `components/chofer/UbicacionTracker.tsx`
(cliente, montado desde `app/chofer/layout.tsx`) → `lib/useUbicacionPing.ts` (`watchPosition`, throttle
2 min) → `POST /api/ubicaciones` (`app/api/ubicaciones/route.ts`) → resuelve `Chofer` por `user_id` →
turno activo → `prisma.ubicacion.create` → Postgres.

**Camino de la vista de flota.** `app/admin/flota/page.tsx` (server, chequea rol `admin`) →
`components/admin/FlotaClient.tsx` (cliente, polling 15 s) → `GET /api/ubicaciones/activas` →
`components/admin/MapaFlota.tsx` cargado con `dynamic(..., { ssr: false })`.

**Límites.** Cruzar uno al revés rompe el build:

| Capa | Puede importar de | Nunca debe |
|---|---|---|
| `app/**/page.tsx`, `layout.tsx` (server) | `components`, `lib`, `@/lib/prisma` | Usar hooks de React |
| `components/**` marcados `"use client"` | `lib` puro, otros componentes cliente | Importar `@/lib/prisma` |
| `app/api/**/route.ts` | `lib`, `@/lib/prisma`, `next-auth/jwt` | Importar componentes React |
| `lib/ubicaciones.ts` | nada | Importar Prisma, React o `next` |

**Dónde vive cada cosa.**

| Asunto | Única fuente de verdad |
|---|---|
| Esquema de base de datos | `prisma/schema.prisma` — se edita ahí y luego `npx prisma migrate dev` |
| Helpers puros de ubicación | `lib/ubicaciones.ts` |
| Capa IndexedDB offline | `lib/utils/index.ts` — `DB_VERSION` y `aplicarUpgradeIndexedDB` |
| Tipos de respuesta de API | `lib/types/index.ts` — `ApiResponse<T>` / `ApiListResponse<T>` |
| Autorización de rutas | inline en cada `route.ts`, con `getToken` de `next-auth/jwt` |
| Navegación admin | `components/admin/Sidebar.tsx` — `navItems` y `VISOR_HREFS` |

## Reglas de código

1. **Roles como strings planos en `User.role`:** `'admin' | 'chofer' | 'publico' | 'visor'`. Se
   comparan **inline** en cada handler (`token.role !== 'admin'`). No existe `requireRole()` y no se
   crea uno.
2. **Alias `@/` → raíz del proyecto.** Ya configurado en `tsconfig.json` y en `jest.config.js`
   (`moduleNameMapper`). Nada de `../../..`.
3. **Server-first.** Los componentes son de servidor salvo que necesiten estado, efectos o eventos.
   `"use client"` va en la hoja, nunca en la página si se puede evitar.
4. **Prisma devuelve `Decimal` para `@db.Decimal`.** Todo handler convierte con `Number()` antes de
   serializar a JSON, igual que ya se hace con `Pedido.monto_total`.
5. **Toda respuesta de API usa el envelope** `ApiResponse<T>` o `ApiListResponse<T>` de
   `lib/types/index.ts`. Sin excepciones nuevas.
6. **Validar en el borde.** Coordenadas, cuerpos de request y arrays de lote se validan en el
   handler antes de tocar Prisma. `lib/ubicaciones.ts` → `validarCoordenadas`.
7. **Los errores de geolocalización degradan en silencio.** Un permiso denegado nunca bloquea la
   entrega ni rompe la UI del chofer.
8. **Tests con Jest**, estilo `lib/precios/calcular.test.ts`. No se migra a Vitest.
9. **Scripts sueltos son `.mjs`** en `scripts/`, ejecutados con `node --env-file=.env`.

## Sistema de diseño

Regla de gobierno: **usar el `DESIGN.md` de Viflomax donde habla, y el registro Stitch de flota donde
calla.** El chrome de la página (tipografía, cards, fondos) sigue el `DESIGN.md` raíz; el tratamiento
del mapa (marcadores pulsantes, panel flotante) sigue `viflomax/fleet-dashboard/.stitch/DESIGN.md`.
`DESIGN.md` **prohíbe gradientes y sombras decorativas** — se respeta.

| Rol | Valor | Uso |
|---|---|---|
| Verde primario | `#6ab04c` | Botones primarios, estados activos |
| Azul secundario | `#4db8e8` | Enlaces, acentos |
| Fondo | `#f9fafb` | Fondo de página |
| Superficie | `#ffffff` | Cards, paneles |
| Señal fresca (<5 min) | `#10b981` | Marcador de chofer con señal reciente |
| Señal vieja (<20 min) | `#f59e0b` | Marcador degradado, banner "Reconectando…" |
| Sin señal (≥20 min) | `#ef4444` | Marcador sin señal, errores |

- **Tipografía:** títulos `font-outfit`; cuerpo `font-nunito`.
- **Cards:** `rounded-xl` + `shadow-sm`. Sin gradientes.
- **Espaciado:** escala Tailwind por defecto (4px base). Nada de valores arbitrarios.
- **Movimiento:** 150–250 ms. Sólo `transform` y `opacity`. Respetar `prefers-reduced-motion`.

## Entorno

| Variable | Requerida | Usada por | Origen |
|---|---|---|---|
| `DATABASE_URL` | sí | Prisma (app y CLI) | Consola del proveedor de Postgres |
| `SHADOW_DATABASE_URL` | sólo paso 1 | `prisma migrate dev` | Base `viflomax_shadow` vacía en la misma instancia |
| `NEXTAUTH_SECRET` | sí | NextAuth | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | sí | NextAuth | URL del despliegue |

El **CLI de Prisma lee `.env`, nunca `.env.local`**. Los scripts de `scripts/*.mjs` cargan el entorno
con `node --env-file=.env`. `SHADOW_DATABASE_URL` no se agrega a Vercel: no es variable de runtime.

## No negociable

1. `react-leaflet` se instala con pin exacto `4.2.1`. La `5.0.0` exige React 19 y rompe el proyecto.
2. El flujo de turnos está congelado: `components/chofer/TurnoBanner.tsx`, `app/api/turnos/route.ts`
   y `app/api/turnos/[id]/route.ts` no se tocan.
3. `visor` nunca accede a `/admin/flota`. "Flota" va en `navItems`, jamás en `VISOR_HREFS`.
4. Nunca aceptar una marca de tiempo enviada por el cliente para `Ubicacion.registrado_en`.
5. Nunca editar a mano una migración ya aplicada, ni aplicar SQL suelto fuera de `prisma migrate`.
6. Nunca commitear `.env`, secretos ni salida de build.
7. Nunca marcar una tarea como terminada con el gate en rojo.
