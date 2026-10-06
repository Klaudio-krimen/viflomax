---
id: VFX-004
titulo: Crear un guard central de autorización para app/api (rol, chofer activo, cambio de clave forzado)
estado: lista
prioridad: p1
asignado: claude
revisor: codex
area: auth
depende_de: []
blueprint:
rama:
archivos: [lib/auth/api.ts, lib/auth/permisos.ts, lib/auth/permisos.test.ts, app/api/choferes/route.ts]
bloqueo:
creado: 2026-10-05
actualizado: 2026-10-05
---

## Contexto

El middleware (`lib/auth/middleware.ts`) no protege `/api/**`: la exclusión
`!pathname.startsWith('/api')` deja pasar a usuarios con `mustChangePassword`, y el corte de
choferes desactivados (`token.choferActivo === false`) solo se aplica a páginas `/chofer`. Un chofer
desvinculado con un JWT vigente (30 días, `lib/auth.ts:13`) sigue pudiendo llamar
`POST /api/entregas`, `/api/ventas-terreno`, `/api/ubicaciones` y `/api/turnos`.

Cada handler repite su propio `getToken` + `if (role !== …)` con criterios distintos (unos
devuelven 401 y otros 403 para el mismo caso).

## Criterios de aceptación

- [ ] CUANDO se evalúa `permitir(token, rolesPermitidos)` en `lib/auth/permisos.ts` (pura) EL
      SISTEMA DEBERÁ devolver 401 sin token, 403 con `mustChangePassword`, 403 con chofer
      `choferActivo === false`, 403 con rol fuera de la lista y OK en otro caso; con tests.
- [ ] CUANDO un handler llama `await requerirSesion(request, ['admin'])` desde `lib/auth/api.ts` EL
      SISTEMA DEBERÁ devolver `{ ok: true, token }` o `{ ok: false, respuesta }` con el formato
      `{ data: null, error }` que ya usan los handlers.
- [ ] CUANDO se migra el handler de ejemplo `app/api/choferes/route.ts` EL SISTEMA DEBERÁ
      comportarse igual para admin y rechazar a un chofer desactivado.
- [ ] `npm run lint && npx jest && npm run build` sale con código 0.

## Fuera de alcance

- Migrar el resto de handlers: VFX-005.
- `app/api/pedidos/publico/route.ts` (congelado y público).

## Notas de implementación

Dejar la decisión en `.agents/decisiones/0002-guard-api.md`.

## Bitácora

### 2026-10-05 · claude · → lista
- Hallazgo S3 de la auditoría. Transversal (auth): implementa claude, revisa codex.

## Revisión
