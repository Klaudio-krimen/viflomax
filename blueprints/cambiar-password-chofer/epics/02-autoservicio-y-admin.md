# Epic 02: Autoservicio y admin

> Después de esta épica: existe `/cambiar-password` de punta a punta (acción + UI), `crearChofer`,
> `resetPasswordChofer` y `crearUsuarioVisor` prenden `mustChangePassword` al generar una contraseña
> temporal, y hay un link a `/cambiar-password` tanto en el panel admin como en el header de `/chofer`.

| | |
|---|---|
| **Epic id** | `02-autoservicio-y-admin` |
| **Tasks** | `E2-T1` … `E2-T5` |
| **Depends on** | `01-cimientos-y-forzado` |
| **Unlocks** | nothing — última épica de este blueprint |
| **Parallel with** | `E2-T3`/`E2-T4`/`E2-T5` no comparten archivos entre sí y pueden correr en paralelo una vez que `E2-T2` está `done` |

You do not need any other file to complete this epic. Everything below is repeated here on purpose.

---

## Stack

Next.js 14.2.35 App Router · TypeScript 5.9.3 · Tailwind 3.4.19 · PostgreSQL · Prisma 5.22.0 ·
NextAuth v4.24.11 · Vercel. Gestor de paquetes: `npm`. Runtime pinned en `.nvmrc` (20). Las versiones
de dependencias están en `package-lock.json` — léelas de ahí, nunca las adivines. **Cero dependencias
nuevas en este cambio.**

| Task | Command |
|---|---|
| Dev | `npm run dev` |
| Build (incluye `prisma generate` y tipos) | `npm run build` |
| Lint | `npm run lint` |
| Test (un archivo) | `npx jest lib/landing/gotas.test.ts` |
| Test (todos) | `npx jest` |

**Gate:** `npm run lint && npx jest && npm run build` pasa antes de marcar cualquier tarea de esta
épica como hecha.

Ningún servicio local nuevo se necesita — esta épica no toca infraestructura, solo código de
aplicación.

## Directory subtree

Solo las partes que toca esta épica:

```
app/
  cambiar-password/
    actions.ts                     # NUEVO — 'use server', cambiarPassword(actual, nueva)
    page.tsx                       # NUEVO — Server Component, guarda de sesión
    CambiarPasswordForm.tsx        # NUEVO — client, 3 PasswordInput + useTransition
  admin/
    choferes/
      actions.ts                   # EDIT — crearChofer y resetPasswordChofer prenden el flag
    usuarios/
      actions.ts                   # EDIT — crearUsuarioVisor prende el flag
  chofer/
    layout.tsx                     # EDIT — nuevo link a /cambiar-password junto a CerrarSesionBtn
components/
  admin/
    Sidebar.tsx                    # EDIT — nuevo link "Cambiar contraseña" sobre "Cerrar Sesión"
  chofer/
    CerrarSesionBtn.tsx            # existe, solo lectura — NUNCA se edita este archivo
  ui/
    PasswordInput.tsx              # existe (de la épica 01), solo lectura para esta épica
```

Todo lo que quede fuera de este subárbol está fuera de alcance de esta épica. Si una tarea parece
necesitar editar un archivo que no está aquí, deténte y repórtalo.

## Data model touched here

| Entity | Fields this epic adds or reads | Notes |
|---|---|---|
| `User` | lee y escribe `mustChangePassword` (agregado en la épica `01-cimientos-y-forzado`) y `password` | ninguna migración nueva en esta épica — el campo ya existe |

## Contracts

**Consumed** — ya existe, producido por `01-cimientos-y-forzado`, no se reconstruye:

| From | Interface | Guarantee |
|---|---|---|
| `01-cimientos-y-forzado` | columna `User.mustChangePassword` (`Boolean @default(false)`) | leíble/escribible vía `db.user` |
| `01-cimientos-y-forzado` | `types/next-auth.d.ts` → `Session.user.mustChangePassword` | disponible en cualquier Server Component que llame `auth()` |
| `01-cimientos-y-forzado` | `components/ui/PasswordInput.tsx` → `PasswordInput` | mismo contrato de props que `Input.tsx` + toggle interno |
| `01-cimientos-y-forzado` | `lib/auth/middleware.ts` | ya redirige a `/cambiar-password` cuando el flag está en `true` — esta épica construye la ruta destino |

**Produced** — nada fuera de esta épica depende de sus exports (es la última épica del blueprint).

| Export | Signature | Used by |
|---|---|---|
| `app/cambiar-password/actions.ts` → `cambiarPassword` | `(actual: string, nueva: string) => Promise<{ error: string \| null }>` | `CambiarPasswordForm.tsx` (misma épica, `E2-T2`) |

## Conventions that bite in this area

- Validación de `cambiarPassword` va **inline**, no en `lib/` — es la misma convención ya establecida
  en `crearChofer`/`resetPasswordChofer`/`crearUsuarioVisor`. No la extraigas a un módulo compartido.
- Orden de validación en `cambiarPassword`, exacto: sesión → contraseña actual correcta → largo mínimo
  → distinta de la actual → hash+update. El chequeo "distinta de la actual" tiene que ir después del
  chequeo de largo, no antes.
- El mapa rol→ruta de `CambiarPasswordForm.tsx` tiene que ser **exactamente** el mismo que ya usa
  `app/login/page.tsx` (`admin`→`/admin/dashboard`, `visor`→`/admin/pedidos`, `chofer`→`/chofer`) — no
  inventes rutas distintas.
- `components/chofer/CerrarSesionBtn.tsx` **nunca se edita** — el link nuevo del header de `/chofer` es
  un hermano en el mismo contenedor flex, no un cambio a ese archivo.

Full project rules: `CLAUDE.md`. Area rules: `.claude/rules/autenticacion.md`. Ambos ya están en la
raíz del proyecto — el builder los copió ahí desde `workspace/` antes de la tarea 1.

---

## Tasks

Listed in the same order as `tasks.json`. That order is the build order — work top to bottom and do
not re-rank by priority or by what looks quick.

### `E2-T1` — Accion cambiarPassword (autoservicio)

**Depends on:** `E1-T1`, `E1-T3` (de la épica `01-cimientos-y-forzado`) · **Priority:** p0

Crea `app/cambiar-password/actions.ts`, `'use server'`, estilo inline igual que `resetPasswordChofer`:

```ts
'use server'

import bcrypt from 'bcryptjs'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

type ActionResult = { error: string | null }

export async function cambiarPassword(actual: string, nueva: string): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user) return { error: 'No autorizado' }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { password: true },
  })
  if (!user?.password) return { error: 'No se pudo verificar tu cuenta' }

  const actualOk = await bcrypt.compare(actual ?? '', user.password)
  if (!actualOk) return { error: 'La contraseña actual no es correcta' }

  const nuevaTrim = (nueva ?? '').trim()
  if (nuevaTrim.length < 6)
    return { error: 'La contraseña debe tener al menos 6 caracteres' }

  if (nuevaTrim === actual)
    return { error: 'La nueva contraseña debe ser distinta a la actual' }

  const hashedPassword = await bcrypt.hash(nuevaTrim, 12)
  await db.user.update({
    where: { id: session.user.id },
    data: { password: hashedPassword, mustChangePassword: false },
  })

  return { error: null }
}
```

**Files**
- `app/cambiar-password/actions.ts` — new

**Acceptance**

1. **WHEN** `app/cambiar-password/actions.ts` is inspected **THE SYSTEM SHALL** export a `use server` action `cambiarPassword(actual, nueva)` that loads the current user via `auth()` from `@/lib/auth` and returns `{ error: 'No autorizado' }` when there is no session.
2. **WHEN** the source is inspected **THE SYSTEM SHALL** gate on `bcrypt.compare(actual, user.password)` before accepting a new password, returning `{ error: 'La contraseña actual no es correcta' }` on mismatch.
3. **WHEN** the source is inspected **THE SYSTEM SHALL** reject a `nueva` shorter than 6 characters with a length-error message, matching the same rule already enforced in `crearChofer` and `resetPasswordChofer`.
4. **WHEN** the source is inspected **THE SYSTEM SHALL** reject `nueva === actual` with `{ error: 'La nueva contraseña debe ser distinta a la actual' }`, so the forced flow cannot be satisfied by resubmitting the same temporary password.
5. **WHEN** the source is inspected **THE SYSTEM SHALL**, on success, hash the new password with `bcrypt` at cost 12 and update `User.password` together with `mustChangePassword: false` in one `db.user.update` call.
6. **WHEN** `npm run build` runs **THE SYSTEM SHALL** exit 0, confirming the new Server Action type-checks even though no page calls it yet.

**Verify**

```bash
npm run lint && npx jest && npm run build
grep -q "'use server'" app/cambiar-password/actions.ts
grep -q "bcrypt.compare(actual" app/cambiar-password/actions.ts
grep -q "La contraseña actual no es correcta" app/cambiar-password/actions.ts
grep -q "nuevaTrim.length < 6" app/cambiar-password/actions.ts
grep -q "nuevaTrim === actual" app/cambiar-password/actions.ts
grep -q "mustChangePassword: false" app/cambiar-password/actions.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E2-T1: accion cambiarPassword (autoservicio)"
git tag step-06-accion-cambiar-password
```

### `E2-T2` — UI de autoservicio /cambiar-password

**Depends on:** `E1-T4` (de la épica `01-cimientos-y-forzado`), `E2-T1` · **Priority:** p0

`app/cambiar-password/page.tsx` (Server Component): `auth()`, `redirect('/login')` si no hay sesión,
pasa `forzado={!!session.user.mustChangePassword}` y `rol={session.user.role}` a
`CambiarPasswordForm`. `app/cambiar-password/CambiarPasswordForm.tsx` (client): tres `PasswordInput`
(`actual`, `nueva`, `confirmar`), `useTransition` + error, mismo patrón que `ResetPasswordSection`.
Chequeo de cliente (`nueva.length < 6` o `nueva !== confirmar`) antes de llamar la acción — no la
reemplaza. Al éxito, `router.push()` según `admin`→`/admin/dashboard`, `visor`→`/admin/pedidos`,
`chofer`→`/chofer`.

**Files**
- `app/cambiar-password/page.tsx` — new
- `app/cambiar-password/CambiarPasswordForm.tsx` — new

**Acceptance**

1. **WHEN** an unauthenticated visitor requests `/cambiar-password` **THE SYSTEM SHALL** redirect to `/login`.
2. **WHEN** an authenticated user with `mustChangePassword=true` views `/cambiar-password` **THE SYSTEM SHALL** show copy explaining the password was admin-generated and must be replaced.
3. **WHEN** a visitor submits a `nueva` shorter than 6 characters, or a `confirmar` that does not match `nueva` **THE SYSTEM SHALL** show a client-side error and **SHALL NOT** call the `cambiarPassword` Server Action.
4. **WHEN** the `cambiarPassword` Server Action returns an error **THE SYSTEM SHALL** display it inline and keep the form on screen.
5. **WHEN** `cambiarPassword` succeeds **THE SYSTEM SHALL** redirect to the role-appropriate home (`admin` to `/admin/dashboard`, `visor` to `/admin/pedidos`, `chofer` to `/chofer`), the same mapping `app/login/page.tsx` already uses.
6. **WHEN** `npm run build` runs **THE SYSTEM SHALL** exit 0, and both new files **SHALL** stay at or under 300 lines each.

**Verify**

```bash
npm run lint && npx jest && npm run build
grep -q "redirect('/login')" app/cambiar-password/page.tsx
grep -q "PasswordInput" app/cambiar-password/CambiarPasswordForm.tsx
grep -q "cambiarPassword" app/cambiar-password/CambiarPasswordForm.tsx
grep -q "/admin/dashboard" app/cambiar-password/CambiarPasswordForm.tsx
grep -q "/admin/pedidos" app/cambiar-password/CambiarPasswordForm.tsx
grep -q "'/chofer'" app/cambiar-password/CambiarPasswordForm.tsx
test "$(wc -l < app/cambiar-password/CambiarPasswordForm.tsx)" -le 300
test "$(wc -l < app/cambiar-password/page.tsx)" -le 300
```

**Checkpoint**

```bash
git add -A && git commit -m "E2-T2: UI de autoservicio /cambiar-password"
git tag step-07-ui-cambiar-password
```

### `E2-T3` — Admin: crearChofer y resetPasswordChofer prenden el flag

**Depends on:** `E2-T2` · **Priority:** p0

En `app/admin/choferes/actions.ts`: agrega `mustChangePassword: true` al `data` de `tx.user.create`
dentro de `crearChofer`, y al `data` de `db.user.update` dentro de `resetPasswordChofer` (junto a
`password: hashedPassword`). Ninguna otra función de este archivo cambia.

**Files**
- `app/admin/choferes/actions.ts` — edit

**Acceptance**

1. **WHEN** `crearChofer` creates a new chofer account **THE SYSTEM SHALL** set `mustChangePassword: true` on the created `User` row, inside the same `$transaction` as today.
2. **WHEN** `resetPasswordChofer` resets a chofer's password **THE SYSTEM SHALL** set `mustChangePassword: true` on the updated `User` row, alongside the new password hash.
3. **WHEN** `editarChofer`, `eliminarChofer`, or `toggleActivoChofer` run **THE SYSTEM SHALL** be unchanged from their current behavior.
4. **WHEN** `npm run build` runs **THE SYSTEM SHALL** exit 0.
5. **WHEN** `npx jest` runs **THE SYSTEM SHALL** still report the existing suite passing, since no `lib/**` module is touched by this step.

**Verify**

```bash
npm run lint && npx jest && npm run build
test "$(grep -c 'mustChangePassword: true' app/admin/choferes/actions.ts)" = 2
```

**Checkpoint**

```bash
git add -A && git commit -m "E2-T3: crearChofer y resetPasswordChofer prenden mustChangePassword"
git tag step-08-chofer-forzar-temporal
```

### `E2-T4` — Admin: crearUsuarioVisor prende el flag

**Depends on:** `E2-T2` · **Priority:** p0

En `app/admin/usuarios/actions.ts`: agrega `mustChangePassword: true` al `data` de `db.user.create`
dentro de `crearUsuarioVisor`. `eliminarUsuarioVisor` no cambia. No se agrega ninguna acción de reset
para visor.

**Files**
- `app/admin/usuarios/actions.ts` — edit

**Acceptance**

1. **WHEN** `crearUsuarioVisor` creates a new visor account **THE SYSTEM SHALL** set `mustChangePassword: true` on the created `User` row.
2. **WHEN** `app/admin/usuarios/actions.ts` is inspected **THE SYSTEM SHALL** show exactly one occurrence of `mustChangePassword: true`, inside `crearUsuarioVisor`'s `db.user.create` call — no reset-password action exists for visor accounts, and none is added by this blueprint.
3. **WHEN** `eliminarUsuarioVisor` runs **THE SYSTEM SHALL** be unchanged from its current behavior.
4. **WHEN** `npm run build` and `npx jest` run **THE SYSTEM SHALL** both exit 0.

**Verify**

```bash
npm run lint && npx jest && npm run build
test "$(grep -c 'mustChangePassword: true' app/admin/usuarios/actions.ts)" = 1
```

**Checkpoint**

```bash
git add -A && git commit -m "E2-T4: crearUsuarioVisor prende mustChangePassword"
git tag step-09-visor-forzar-temporal
```

### `E2-T5` — Nav: link a /cambiar-password en Sidebar y header de /chofer

**Depends on:** `E2-T2` · **Priority:** p1 — metadata for scope cuts, not a running order

En `components/admin/Sidebar.tsx`, dentro de la "User section", agrega un `<Link
href="/cambiar-password">` con ícono inline, texto "Cambiar contraseña", por encima del botón "Cerrar
Sesión" — misma familia de clases pero `hover:bg-gray-100`. En `app/chofer/layout.tsx`, agrega un
`<Link href="/cambiar-password">` como hermano de `<CerrarSesionBtn />` dentro del mismo contenedor
flex del header, mismo patrón `min-h-[44px]`/`hidden sm:inline` — **sin editar
`components/chofer/CerrarSesionBtn.tsx`**.

**Files**
- `components/admin/Sidebar.tsx` — edit
- `app/chofer/layout.tsx` — edit

**Acceptance**

1. **WHEN** an admin or visor views the sidebar's user section **THE SYSTEM SHALL** show a `Cambiar contraseña` link to `/cambiar-password`, positioned above `Cerrar Sesión`.
2. **WHEN** a chofer views the `/chofer` header **THE SYSTEM SHALL** show a link to `/cambiar-password` next to the existing sign-out control, without modifying `components/chofer/CerrarSesionBtn.tsx`.
3. **WHEN** both new links render **THE SYSTEM SHALL** use a native `Link`/anchor element, never a `<div>` with a click handler.
4. **WHEN** `npm run build` runs **THE SYSTEM SHALL** exit 0.
5. **WHEN** `npm run lint` runs **THE SYSTEM SHALL** exit 0 with zero warnings, confirming the added JSX passes the project's existing `next/core-web-vitals` accessibility rules.

**Verify**

```bash
npm run lint && npx jest && npm run build
grep -q 'href="/cambiar-password"' components/admin/Sidebar.tsx
grep -q 'href="/cambiar-password"' app/chofer/layout.tsx
grep -q "CerrarSesionBtn" app/chofer/layout.tsx
git diff --quiet -- components/chofer/CerrarSesionBtn.tsx
```

**Checkpoint**

```bash
git add -A && git commit -m "E2-T5: link a /cambiar-password en Sidebar y header de /chofer"
git tag step-10-nav-cambiar-password
```

---

## Epic acceptance

The epic is done when every task is `done` **and**:

1. **WHEN** un chofer o visor nuevo es creado por el admin, o un chofer recibe un reset de contraseña **THE SYSTEM SHALL** quedar con `mustChangePassword=true`, y su próximo request autenticado lo redirige a `/cambiar-password` — punta a punta, ya no solo la guarda de middleware de la épica anterior.
2. **WHEN** esa persona completa el formulario con su contraseña actual, una nueva de al menos 6 caracteres y distinta de la actual **THE SYSTEM SHALL** guardarla, apagar el flag, y dejarla entrar normalmente desde entonces.

```bash
npm run lint && npx jest && npm run build
```

Run from the project root. No hay comando E2E en este repo — el criterio 1 requiere una cuenta de
prueba real (ver `blueprint.md` §20.1, el último ítem del checklist manual), porque sembrar una base con
un usuario `mustChangePassword=true` está fuera de lo que este blueprint provisiona (§13).

## Pitfalls

- **Desplegar `E2-T3`/`E2-T4` antes que `E2-T2`** — cualquier cuenta creada después de eso, antes de
  que `/cambiar-password` exista, quedaría en un loop de redirect hacia un 404. Por eso ambas tareas
  dependen explícitamente de `E2-T2` en `tasks.json`, no solo narrativamente.
- **Reordenar el chequeo de "distinta de la actual" antes del de largo mínimo** en `cambiarPassword` —
  rompe el mensaje de error que el usuario ve primero cuando ambos fallan a la vez.
- **Editar `components/chofer/CerrarSesionBtn.tsx`** para agregarle el link — el link va como hermano
  en `app/chofer/layout.tsx`, ese archivo se queda intacto.

## Before moving on

- [ ] Every task in this epic is `done` in `tasks.json` — no task left `in_progress`.
- [ ] Every `verify` command of every task in this epic passed, not just the first one.
- [ ] No `verify` command was edited, and none was skipped because a file it names did not exist.
- [ ] **Every task in this epic has its `checkpoint` tag in version control** — `step-06-accion-cambiar-password`, `step-07-ui-cambiar-password`, `step-08-chofer-forzar-temporal`, `step-09-visor-forzar-temporal`, `step-10-nav-cambiar-password`. `git tag -l 'step-0[6-9]-*' 'step-10-*'` lists them (compáralos por nombre completo contra los de blueprints anteriores, no por conteo).
- [ ] Gate command passes clean, run from the project root.
- [ ] No file outside the subtree was modified.
- [ ] `.env.example` updated if this epic added a variable — no aplica, esta épica no agrega ninguna.
- [ ] One commit per task, each prefixed with its task id, each followed by its checkpoint tag.
