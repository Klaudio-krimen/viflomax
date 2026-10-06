---
id: VFX-001
titulo: Reescribir ROLES.md para que describa NextAuth + Prisma en vez de Supabase
estado: lista
prioridad: p2
asignado:
revisor:
area: docs
depende_de: []
blueprint:
rama:
archivos: [ROLES.md]
bloqueo:
creado: 2026-10-05
actualizado: 2026-10-05
---

## Contexto

`ROLES.md` documenta autenticación con Supabase Auth (`app_metadata.role`, SQL sobre `auth.users`,
script Python con `SUPABASE_SERVICE_ROLE_KEY`). El código real ya no usa Supabase: `package.json`
trae `next-auth` 4 y `middleware.ts` delega en `lib/auth/middleware.ts`; ningún archivo de `app/`,
`lib/` ni `components/` importa Supabase. Un agente que lea `ROLES.md` va a implementar contra un
sistema que no existe.

## Criterios de aceptación

- [ ] CUANDO se busca `supabase` (sin distinguir mayúsculas) en `ROLES.md` EL SISTEMA DEBERÁ no
      encontrar coincidencias, salvo una nota histórica explícita.
- [ ] CUANDO se lee `ROLES.md` EL SISTEMA DEBERÁ listar los roles tal como están definidos en
      `prisma/schema.prisma` y la protección de rutas tal como la hace `lib/auth/middleware.ts`.
- [ ] CUANDO se lee la sección de alta de usuarios EL SISTEMA DEBERÁ describir el flujo real
      (`crearChofer`, `crearUsuarioVisor`, `mustChangePassword`, `/cambiar-password`).
- [ ] `npm run lint && npx jest && npm run build` sale con código 0.

## Fuera de alcance

- Cambiar código de autenticación. Si se detecta un hueco de seguridad, se abre otra tarea.

## Notas de implementación

Fuentes de verdad: `prisma/schema.prisma`, `lib/auth/**`, `app/api/auth/**`, `app/login/**`,
`app/cambiar-password/**`, `blueprints/cambiar-password-chofer/`. Buena tarea para codex.

## Bitácora

### 2026-10-05 · claude · → lista
- Creada al montar el protocolo de agentes. Detectada al cruzar `ROLES.md` con `package.json` y
  `middleware.ts`.

## Revisión
