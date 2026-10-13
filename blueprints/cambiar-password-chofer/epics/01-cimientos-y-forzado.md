# Epic 01: Cimientos y forzado

> Después de esta épica: `User` tiene la columna `mustChangePassword`, la sesión la revalida en cada
> request para cualquier rol, el middleware redirige a `/cambiar-password` cuando corresponde, y existe
> un componente `PasswordInput` con toggle mostrar/ocultar que `/login` ya adoptó.

| | |
|---|---|
| **Epic id** | `01-cimientos-y-forzado` |
| **Tasks** | `E1-T1` … `E1-T5` |
| **Depends on** | nothing — start here |
| **Unlocks** | `02-autoservicio-y-admin` |
| **Parallel with** | `E1-T4`/`E1-T5` no comparten archivos con `E1-T1`/`E1-T2`/`E1-T3` y pueden correr en paralelo con ellas |

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
| Migrar (dev) | `npx prisma migrate dev --name <nombre>` |
| Estado de migraciones | `npx prisma migrate status` |

**Gate:** `npm run lint && npx jest && npm run build` pasa antes de marcar cualquier tarea de esta
épica como hecha. No hay script `typecheck` separado — el chequeo de tipos vive dentro de `build` y
de `ts-jest`.

Ningún servicio local nuevo se necesita: `DATABASE_URL`/`SHADOW_DATABASE_URL` ya deben estar
configurados en `.env.local` desde antes de este cambio (las 5 migraciones previas de este repo ya los
requerían).

## Directory subtree

Solo las partes que toca esta épica:

```
prisma/
  schema.prisma                    # EDIT — User gana mustChangePassword Boolean @default(false)
  migrations/
    <timestamp>_add_must_change_password/
      migration.sql                # generado por `npx prisma migrate dev`, no se nombra a mano
types/
  next-auth.d.ts                   # EDIT — JWT y Session.user ganan mustChangePassword: boolean
lib/
  auth.ts                          # EDIT — jwt()/session() revalidan y exponen el flag
  auth/
    middleware.ts                  # EDIT — nueva guarda inline, antes de /admin y /chofer
components/
  ui/
    Input.tsx                      # existe, solo lectura para esta épica — PasswordInput copia su contrato visual
    PasswordInput.tsx              # NUEVO — Input + toggle mostrar/ocultar
app/
  login/
    page.tsx                       # EDIT — adopta <PasswordInput>
```

Todo lo que quede fuera de este subárbol está fuera de alcance de esta épica. Si una tarea parece
necesitar editar un archivo que no está aquí, deténte y repórtalo — significa que el límite de la épica
está mal puesto.

## Data model touched here

| Entity | Fields this epic adds or reads | Notes |
|---|---|---|
| `User` | agrega `mustChangePassword Boolean @default(false)` | leída por `lib/auth.ts` en cada request autenticada, para cualquier rol |

## Contracts

**Consumed** — ya existe, no se reconstruye:

| From | Interface | Guarantee |
|---|---|---|
| repo (ya existente) | `db` (`lib/db.ts`), cliente Prisma singleton | conexión ya configurada, sin cambio en esta épica |
| repo (ya existente) | `auth()` / `authOptions` (`lib/auth.ts`) | siguen exportando lo mismo que hoy, ampliados |

**Produced** — épicas/pasos posteriores dependen exactamente de estas firmas:

| Export | Signature | Used by |
|---|---|---|
| `prisma/schema.prisma` → columna `User.mustChangePassword` | `Boolean @default(false)` | `02-autoservicio-y-admin` (toda tarea que lea/escriba ese campo) |
| `types/next-auth.d.ts` → `JWT.mustChangePassword`, `Session.user.mustChangePassword` | `boolean` | `02-autoservicio-y-admin` (E2-T1, E2-T2) |
| `components/ui/PasswordInput.tsx` → `PasswordInput` | mismo contrato de props que `Input.tsx` + toggle interno | `02-autoservicio-y-admin` (E2-T2, `CambiarPasswordForm.tsx`) |

## Conventions that bite in this area

- `lib/auth/middleware.ts` es **todo inline** — no extraigas una función pura para la guarda nueva,
  aunque parezca lo correcto. Es el estilo ya establecido en ese archivo exacto.
- El campo `mustChangePassword` se revalida contra la BD **en cada request**, no solo al loguear —
  sigue exactamente el patrón que ya usa `choferActivo` un poco más abajo en el mismo callback `jwt`.
- La guarda de middleware tiene que excluir `/api/**`, o el propio `fetch('/api/auth/session')` de
  `app/login/page.tsx` queda atrapado en el redirect la primera vez que alguien loguea con el flag en
  `true`.
- `PasswordInput` no delega a `<Input>` como hijo — reimplementa el mismo JSX (mismas clases) porque el
  botón de toggle necesita un wrapper `relative` alrededor de solo el `<input>`, no de todo el bloque
  con label/error.

Full project rules: `CLAUDE.md`. Area rules: `.claude/rules/autenticacion.md`. Ambos ya están en la
raíz del proyecto — el builder los copió ahí desde `workspace/` antes de la tarea 1.

---

## Tasks

Listed in the same order as `tasks.json`. That order is the build order — work top to bottom and do
not re-rank by priority or by what looks quick.

### `E1-T1` — Schema delta: mustChangePassword en User + migracion

**Depends on:** nothing · **Priority:** p0 — metadata for scope cuts, not a running order

Agrega `mustChangePassword Boolean @default(false)` al modelo `User` en `prisma/schema.prisma`,
inmediatamente después de `password`, con un comentario de una línea al estilo de los demás campos de
ese modelo. Corre `npx prisma migrate dev --name add_must_change_password` contra la base local — esto
crea la carpeta de migración bajo `prisma/migrations/` (con un timestamp que decide la herramienta, no
lo inventes) y la aplica. Es una migración puramente aditiva: columna nueva, con default `false`, así
que ninguna fila existente se rompe y ningún código viejo necesita saber que existe.

**Files**
- `prisma/schema.prisma` — edit: agrega el campo al modelo `User`
- `prisma/migrations/**` — new: la carpeta que genera `npx prisma migrate dev`

**Acceptance**

1. **WHEN** `npx prisma validate` runs against `prisma/schema.prisma` **THE SYSTEM SHALL** exit 0.
2. **WHEN** `prisma/schema.prisma` is inspected **THE SYSTEM SHALL** show `mustChangePassword Boolean @default(false)` as a field of the `User` model.
3. **WHEN** `npx prisma migrate dev --name add_must_change_password` runs against the local database **THE SYSTEM SHALL** create a new migration directory under `prisma/migrations/` and apply it without error.
4. **WHEN** `npx prisma migrate status` runs afterward **THE SYSTEM SHALL** report the database schema up to date with no pending migrations.
5. **WHEN** the generated migration SQL is inspected **THE SYSTEM SHALL** show `mustChangePassword` added with a default of `false`, so every existing account keeps working without being forced through the change-password flow.
6. **WHEN** `npm run build` runs **THE SYSTEM SHALL** exit 0, confirming the regenerated Prisma Client compiles against the updated schema.

**Verify** — every command, in order, run from the project root.

```bash
npm run lint && npx jest && npm run build
npx prisma validate
grep -q "mustChangePassword" prisma/schema.prisma
npx prisma migrate dev --name add_must_change_password
npx prisma migrate status
grep -q "mustChangePassword" prisma/migrations/*add_must_change_password*/migration.sql
grep -qi "DEFAULT false" prisma/migrations/*add_must_change_password*/migration.sql
```

**Checkpoint**

```bash
git add -A && git commit -m "E1-T1: columna mustChangePassword en User + migracion"
git tag step-01-schema-forzar-cambio
```

Run both after the last `Verify` command exits 0, before starting the next task. Si la siguiente tarea
sale mal, `git reset --hard step-01-schema-forzar-cambio` en vez de depurar hacia adelante.

### `E1-T2` — Nucleo de auth: mustChangePassword en JWT y session

**Depends on:** `E1-T1` · **Priority:** p0

En `types/next-auth.d.ts`, agrega `mustChangePassword: boolean` a `JWT` y a `Session.user`. En
`lib/auth.ts`, dentro del callback `jwt`, agrega un bloque que revalide `User.mustChangePassword`
contra la BD para **cualquier** `token.id` presente (no solo `role==='chofer'`), colocado **antes** del
bloque existente de `choferActivo`:

```ts
if (token.id) {
  const usuario = await db.user.findUnique({
    where: { id: token.id as string },
    select: { mustChangePassword: true },
  })
  token.mustChangePassword = usuario?.mustChangePassword ?? false
}
```

En el callback `session`, agrega `session.user.mustChangePassword = token.mustChangePassword as
boolean` junto a las líneas existentes de `id`/`role`.

**Files**
- `types/next-auth.d.ts` — edit: dos interfaces ganan un campo
- `lib/auth.ts` — edit: `jwt()` y `session()` ganan un bloque cada uno

**Acceptance**

1. **WHEN** `types/next-auth.d.ts` is inspected **THE SYSTEM SHALL** declare `mustChangePassword: boolean` on both the `JWT` interface and `Session.user`.
2. **WHEN** the `jwt` callback in `lib/auth.ts` runs for any authenticated token **THE SYSTEM SHALL** re-query `User.mustChangePassword` from the database for that token's `id`, regardless of `role`, and assign the result to `token.mustChangePassword`.
3. **WHEN** the `session` callback in `lib/auth.ts` runs **THE SYSTEM SHALL** mirror `token.mustChangePassword` onto `session.user.mustChangePassword`.
4. **WHEN** `npx jest` runs **THE SYSTEM SHALL** still report the existing suite passing, since this step changes no `lib/landing/**`, `lib/productos.ts`, `lib/contacto.ts`, `lib/precios/**`, `lib/ubicaciones.ts` or `lib/utils/**` module.
5. **WHEN** `npm run build` runs **THE SYSTEM SHALL** exit 0 with `mustChangePassword` type-checking cleanly wherever the augmented `next-auth` types are read.

**Verify**

```bash
npm run lint && npx jest && npm run build
test "$(grep -c 'mustChangePassword: boolean' types/next-auth.d.ts)" = 2
grep -q "select: { mustChangePassword: true }" lib/auth.ts
grep -q "session.user.mustChangePassword = token.mustChangePassword" lib/auth.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E1-T2: mustChangePassword en JWT y session, revalidado por request"
git tag step-02-jwt-mustchangepassword
```

### `E1-T3` — Guarda de middleware para el cambio forzado

**Depends on:** `E1-T2` · **Priority:** p0

En `lib/auth/middleware.ts`, dentro de `updateSession`, agrega la guarda nueva **antes** del bloque
`/admin` existente:

```ts
if (
  token?.mustChangePassword === true &&
  pathname !== '/cambiar-password' &&
  pathname !== '/login' &&
  !pathname.startsWith('/api')
) {
  const url = request.nextUrl.clone()
  url.pathname = '/cambiar-password'
  return NextResponse.redirect(url)
}
```

Sin extraer ninguna función nueva. El resto del archivo (guardas de `/admin` y `/chofer`) no cambia.

**Files**
- `lib/auth/middleware.ts` — edit: un bloque `if` nuevo dentro de `updateSession`

**Acceptance**

1. **WHEN** an authenticated request carries `token.mustChangePassword === true` and requests a path other than `/cambiar-password`, `/login`, or one starting with `/api` **THE SYSTEM SHALL** redirect to `/cambiar-password`.
2. **WHEN** that same token requests `/cambiar-password` itself **THE SYSTEM SHALL NOT** redirect.
3. **WHEN** that same token requests a path starting with `/api` **THE SYSTEM SHALL NOT** redirect, so `fetch('/api/auth/session')` keeps working during the forced flow.
4. **WHEN** `token.mustChangePassword` is `false` or absent **THE SYSTEM SHALL** apply the existing `/admin` and `/chofer` guards exactly as before, unchanged.
5. **WHEN** `lib/auth/middleware.ts` is inspected **THE SYSTEM SHALL** implement the new gate as a single inline conditional inside `updateSession`, with no new exported function — matching the file's existing all-inline style.

**Verify**

```bash
npm run lint && npx jest && npm run build
grep -q "mustChangePassword === true" lib/auth/middleware.ts
grep -q "pathname !== '/cambiar-password'" lib/auth/middleware.ts
grep -q "pathname.startsWith('/api')" lib/auth/middleware.ts
test "$(grep -c '^export ' lib/auth/middleware.ts)" = 1
```

**Checkpoint**

```bash
git add -A && git commit -m "E1-T3: guarda de middleware para mustChangePassword"
git tag step-03-middleware-forzado
```

### `E1-T4` — Componente PasswordInput con toggle mostrar/ocultar

**Depends on:** nothing · **Priority:** p0

Crea `components/ui/PasswordInput.tsx`, client component. Wrapper externo `flex flex-col gap-1` +
`label` opcional (igual que `Input.tsx`); un `div relative` interno que envuelve solo el `<input>`, con
el botón de toggle `absolute inset-y-0 right-0 flex items-center pr-3` dentro de ese wrapper — así queda
alineado con el input sin importar si hay label/error/helperText. El `<input>` alterna `type="password"`
/`type="text"` según `useState(false)`. El botón es `<button type="button">` nativo, nunca un
`<div onClick>`, con `aria-label` (`Mostrar contraseña`/`Ocultar contraseña`) y `aria-pressed`. Ícono
SVG de ojo/ojo-tachado dibujado a mano (`aria-hidden="true"`, `stroke="currentColor"`,
`strokeWidth={2}`), sin dependencia nueva. Archivo ≤ 300 líneas.

**Files**
- `components/ui/PasswordInput.tsx` — new

**Acceptance**

1. **WHEN** `components/ui/PasswordInput.tsx` renders **THE SYSTEM SHALL** show a native `<input>` whose `type` starts as `password`.
2. **WHEN** a user activates the toggle `<button>` **THE SYSTEM SHALL** switch the underlying input's `type` to `text`, and activating it again **SHALL** switch it back to `password`.
3. **WHEN** the field is hidden **THE SYSTEM SHALL** set the toggle's `aria-label` to `Mostrar contraseña` and `aria-pressed=false`; **WHEN** visible **THE SYSTEM SHALL** set `aria-label` to `Ocultar contraseña` and `aria-pressed=true`.
4. **WHEN** `components/ui/PasswordInput.tsx` is inspected **THE SYSTEM SHALL** declare the toggle as a native `<button type=button>`, never a `<div>` with a click handler.
5. **WHEN** `npm run build` runs **THE SYSTEM SHALL** exit 0, confirming the component type-checks standing alone, before any other file imports it.
6. **WHEN** `components/ui/PasswordInput.tsx` is measured **THE SYSTEM SHALL** be 300 lines or fewer.

**Verify**

```bash
npm run lint && npx jest && npm run build
grep -q "aria-pressed" components/ui/PasswordInput.tsx
grep -q "aria-label" components/ui/PasswordInput.tsx
grep -q 'type="button"' components/ui/PasswordInput.tsx
test "$(wc -l < components/ui/PasswordInput.tsx)" -le 300
```

**Checkpoint**

```bash
git add -A && git commit -m "E1-T4: componente PasswordInput (toggle mostrar/ocultar)"
git tag step-04-password-input
```

### `E1-T5` — Login adopta PasswordInput

**Depends on:** `E1-T4` · **Priority:** p1 — metadata for scope cuts, not a running order

En `app/login/page.tsx`, reemplaza el bloque `<div><label htmlFor="password">…<input
type="password">…</div>` por `<PasswordInput id="password" label="Contraseña" required
autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)}
placeholder="••••••••" />`, importando `{ PasswordInput } from '@/components/ui/PasswordInput'`.
Ninguna otra línea de este archivo cambia.

**Files**
- `app/login/page.tsx` — edit: reemplaza el bloque del campo de contraseña

**Acceptance**

1. **WHEN** `/login` renders **THE SYSTEM SHALL** show the password field via `PasswordInput` instead of a raw `input type=password`.
2. **WHEN** a visitor activates the reveal toggle on `/login` **THE SYSTEM SHALL** show the typed password in cleartext, and activating it again **SHALL** hide it.
3. **WHEN** a visitor submits valid credentials on `/login` **THE SYSTEM SHALL** still authenticate and redirect by role exactly as before.
4. **WHEN** `app/login/page.tsx` is inspected **THE SYSTEM SHALL** contain zero raw `input type=password` elements.
5. **WHEN** `npm run build` runs **THE SYSTEM SHALL** exit 0.

**Verify**

```bash
npm run lint && npx jest && npm run build
grep -q "PasswordInput" app/login/page.tsx
grep -q 'type="password"' app/login/page.tsx; test $? -eq 1
```

**Checkpoint**

```bash
git add -A && git commit -m "E1-T5: login adopta PasswordInput"
git tag step-05-login-toggle
```

---

## Epic acceptance

The epic is done when every task is `done` **and**:

1. **WHEN** cualquier request autenticada llega con un token que trae `mustChangePassword=true` **THE SYSTEM SHALL** redirigir a `/cambiar-password`, salvo que la ruta pedida ya sea `/cambiar-password`, `/login`, o empiece con `/api`.
2. **WHEN** `/login` y cualquier futuro consumidor de `PasswordInput` piden mostrar/ocultar la contraseña **THE SYSTEM SHALL** hacerlo con un `<button type="button">` accesible, sin depender de ningún paquete nuevo.

```bash
npm run lint && npx jest && npm run build
```

Run from the project root. No hay comando E2E en este repo (ver `blueprint.md` §13) — ambos criterios
se deciden por la compuerta de arriba más los `grep` de cada tarea.

## Pitfalls

- **Olvidar excluir `/api/**` en la guarda del middleware** — sin esa exclusión, el propio
  `fetch('/api/auth/session')` de `app/login/page.tsx` queda atrapado en el redirect y el login se
  rompe para cualquier cuenta con el flag en `true`.
- **Gatear la revalidación de `mustChangePassword` detrás de `token.role === 'chofer'`** — sería copiar
  mal el patrón de `choferActivo`. Este flag aplica a *cualquier* rol, a propósito.
- **Envolver todo `<Input>` en `relative`** en vez de solo el `<input>` — el botón queda mal alineado
  verticalmente en cuanto el campo tiene `label` o `error`.

## Before moving on

- [ ] Every task in this epic is `done` in `tasks.json` — no task left `in_progress`.
- [ ] Every `verify` command of every task in this epic passed, not just the first one.
- [ ] No `verify` command was edited, and none was skipped because a file it names did not exist.
- [ ] **Every task in this epic has its `checkpoint` tag in version control** — `step-01-schema-forzar-cambio`, `step-02-jwt-mustchangepassword`, `step-03-middleware-forzado`, `step-04-password-input`, `step-05-login-toggle`. `git tag -l 'step-0[1-5]-*'` lists them (junto con los tags de blueprints anteriores que compartan ese rango de números — compáralos por nombre completo, no por conteo).
- [ ] Gate command passes clean, run from the project root.
- [ ] Every "Produced" contract above exists with the stated signature.
- [ ] No file outside the subtree was modified.
- [ ] `.env.example` updated if this epic added a variable — no aplica, esta épica no agrega ninguna.
- [ ] One commit per task, each prefixed with its task id, each followed by its checkpoint tag.
