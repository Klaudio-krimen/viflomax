# Epic 01: Cimientos e ingesta

> Al terminar este épico existe una base de datos con historial de migraciones limpio, el modelo
> `Ubicacion`, los helpers puros con sus pruebas, y las dos rutas de API que reciben y leen posiciones.

| | |
|---|---|
| **Epic id** | `01-cimientos-e-ingesta` |
| **Tasks** | `E1-T1` … `E1-T6` |
| **Depends on** | nada — empieza aquí |
| **Unlocks** | `02-captura-en-terreno`, `03-flota-y-operacion` |
| **Parallel with** | `E2-T2` y `E2-T3` del épico 02 no comparten archivos con nada de aquí |

No necesitas ningún otro archivo para completar este épico. Todo lo de abajo se repite aquí a propósito.

---

## Stack

Next.js 14 App Router · TypeScript · Tailwind CSS · PostgreSQL · Prisma 5 · NextAuth v4
(Credentials + JWT) · PWA con `@ducanh2912/next-pwa` · Vercel.
Gestor de paquetes: `npm`. Runtime fijado en `.nvmrc` (Node 20). Las versiones de dependencias
viven en `package-lock.json` — léelo, nunca adivines una.

| Tarea | Comando |
|---|---|
| Dev | `npm run dev` |
| Build (incluye chequeo de tipos) | `npm run build` |
| Lint | `npm run lint` |
| Test (un archivo) | `npm test -- lib/ubicaciones.test.ts` |
| Validar schema | `npx prisma validate` |
| Estado de migraciones | `npx prisma migrate status` |
| Crear migración | `npx prisma migrate dev --name <nombre>` |

**Gate:** `npm run build && npm run lint && npm test` pasa antes de marcar cualquier tarea de aquí
como terminada. **No existe `npm run typecheck`** en este repositorio: `npm run build` es
`prisma generate && next build`, y `next build` corre `tsc`.

Este épico verifica contra la base de datos PostgreSQL real del proyecto. Es un prerrequisito
brownfield ya existente, no algo que este bundle levante: `DATABASE_URL` debe estar en `.env`
(el CLI de Prisma lee `.env`, **nunca** `.env.local`) antes de la tarea `E1-T1`.
`SHADOW_DATABASE_URL` debe apuntar a una base vacía `viflomax_shadow` en la misma instancia y sólo
se necesita en `E1-T1`; no es variable de runtime y no se agrega a Vercel.

## Subárbol de directorios

Sólo lo que este épico toca:

```
prisma/
  schema.prisma                       # existe, lo editas en E1-T2
  migrations/                         # existe con una sola migración; E1-T1 y E1-T2 agregan más
lib/
  ubicaciones.ts                      # NUEVO en E1-T3 — helpers puros
  ubicaciones.test.ts                 # NUEVO en E1-T4 — pruebas Jest
  types/index.ts                      # existe, sólo lectura: ApiResponse / ApiListResponse
  prisma.ts                           # existe, sólo lectura: cliente Prisma
app/
  api/
    ubicaciones/
      route.ts                        # NUEVO en E1-T5 — POST
      activas/route.ts                # NUEVO en E1-T6 — GET
```

Todo lo que esté fuera de este subárbol queda fuera de alcance. Si una tarea parece exigir editar un
archivo que no está aquí, detente y reporta: significa que el límite del épico está mal.

## Modelo de datos tocado aquí

| Entidad | Campos que este épico agrega o lee | Notas |
|---|---|---|
| `Ubicacion` | `id`, `turno_id`, `latitud`, `longitud`, `precision_m`, `origen`, `registrado_en` | NUEVA. `latitud`/`longitud` son `Decimal @db.Decimal(10, 7)`. `@@index([turno_id, registrado_en])`. `onDelete: Cascade` sobre `Turno` |
| `Turno` | lee `id`, `estado`, `chofer_id`, `bodega_id`; agrega `ubicaciones Ubicacion[]` | `estado` es `'activo'` o `'cerrado'`. El flujo de turnos está congelado: sólo se agrega la relación inversa |
| `Chofer` | lee `id`, `user_id`, `nombre` | `user_id` es único y opcional |
| `Bodega` | lee `id`, `patente` | Se muestra como identificador del vehículo |

El esquema definitivo de `Ubicacion`, tal como debe quedar en `prisma/schema.prisma`:

```prisma
model Ubicacion {
  id            String   @id @default(uuid())
  turno_id      String
  latitud       Decimal  @db.Decimal(10, 7)
  longitud      Decimal  @db.Decimal(10, 7)
  precision_m   Float?
  origen        String   @default("app")
  registrado_en DateTime @default(now())
  turno         Turno    @relation(fields: [turno_id], references: [id], onDelete: Cascade)

  @@index([turno_id, registrado_en])
}
```

## Contratos

**Consumidos** — ya existen, no los reconstruyas:

| De | Interfaz | Garantía |
|---|---|---|
| repositorio | `lib/types/index.ts` → `ApiResponse<T>`, `ApiListResponse<T>` | Uniones discriminadas con `success: boolean`; es el envelope de toda respuesta |
| repositorio | `lib/prisma.ts` → cliente Prisma singleton | Ya configurado; no crees otro `PrismaClient` |
| repositorio | `next-auth/jwt` → `getToken` | Devuelve el token con `role` y `sub`; el rol se compara **inline** |
| repositorio | modelo `Entrega` | Usa `Decimal(10, 7)` para coordenadas — es la convención que `Ubicacion` copia |

**Producidos** — épicos posteriores dependen de estas firmas exactas. Cambiar una los rompe:

| Export | Firma | Usado por |
|---|---|---|
| `lib/ubicaciones.ts` → `validarCoordenadas` | `(lat: unknown, lng: unknown) => boolean` | `E1-T5`, `E2-T4` |
| `lib/ubicaciones.ts` → `minutosDesde` | `(fecha: Date \| string, ahora?: Date) => number` | `E3-T2`, `E3-T4` |
| `lib/ubicaciones.ts` → `frescuraSenal` | `(fecha: Date \| string, ahora?: Date) => 'fresca' \| 'vieja' \| 'sin_senal'` | `E3-T2`, `E3-T4` |
| `POST /api/ubicaciones` | acepta un ping o un array; 401 / 400 / 409 / 201 | `E2-T4` |
| `GET /api/ubicaciones/activas` | última posición por turno activo, coordenadas ya `Number()` | `E3-T3` |

## Convenciones que muerden en esta área

- **Prisma devuelve objetos `Decimal`, no números.** Todo handler convierte con `Number()` antes de
  serializar, exactamente como ya se hace con `Pedido.monto_total`. Olvidarlo produce un JSON con
  `{"s":1,"e":1,"d":[...]}` en vez de un número, y el mapa no dibuja nada.
- **No existe `requireRole()`.** El rol se compara inline en cada handler (`token.role !== 'admin'`).
  Crear un helper central es un no-objetivo declarado.
- **El CLI de Prisma lee `.env`, nunca `.env.local`.** Si `migrate status` falla diciendo que no
  encuentra `DATABASE_URL`, el problema es el archivo, no la conexión.
- **Nunca inventes el nombre de un archivo de migración.** Prisma lo genera con marca de tiempo y
  nombre; refiérete a él como "la migración que emite `npx prisma migrate dev`".
- **El flujo de turnos está congelado.** `components/chofer/TurnoBanner.tsx`,
  `app/api/turnos/route.ts` y `app/api/turnos/[id]/route.ts` no se tocan en ningún momento.

Reglas completas del proyecto: `CLAUDE.md`. Ambos archivos están en la raíz del proyecto — el
constructor los copió desde `workspace/` del bundle antes de la tarea uno.

---

## Tasks

Listadas en el mismo orden que `tasks.json`. Ese orden es el orden de construcción — trabaja de
arriba hacia abajo y no reordenes por prioridad ni por lo que parezca rápido.

### `E1-T1` — Regularizar la deriva de migraciones con un baseline

**Depends on:** nada · **Priority:** p0 — metadato para recortes de alcance, no orden de ejecución

`prisma/migrations/` contiene exactamente una migración (`20260528033152_init`, 14 tablas). Tres
modelos del schema vivo — `Bodega`, `Turno` y `TransferenciaStock` — no tienen migración: se
aplicaron a mano con `prisma/backfill-bodegas.sql` y `prisma/migrate-inventario-phase2.sql`, que
siguen en el repositorio. Este paso cierra ese hueco **antes** de agregar nada nuevo, porque una
migración creada sobre un historial derivado arrastra la deriva hacia adelante para siempre.

El orden importa: primero prueba que la base viva ya coincide con `prisma/schema.prisma` (deriva
cero), después genera el SQL del baseline con `prisma migrate diff` hacia un directorio de migración
creado con `npx prisma migrate dev --create-only --name baseline_bodegas_turnos_transferencias`, y
finalmente márcala como aplicada con `npx prisma migrate resolve --applied <nombre_del_directorio>`.
No borres `prisma/backfill-bodegas.sql` ni `prisma/migrate-inventario-phase2.sql`: quedan como
registro histórico de cómo se llegó aquí.

**Files**
- `prisma/migrations/**` — nuevo: el directorio de migración baseline que emite Prisma

**Acceptance**

1. **CUANDO** `npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --exit-code` corre antes de crear la migración baseline **EL SISTEMA DEBERÁ** salir con código 0, probando que la base viva ya coincide con `prisma/schema.prisma`.
2. **CUANDO** `npx prisma migrate status` corre después del baseline **EL SISTEMA DEBERÁ** salir con código 0 y no reportar migraciones pendientes ni deriva.
3. **CUANDO** se inspecciona el SQL de la migración baseline **EL SISTEMA DEBERÁ** contener las sentencias `CREATE TABLE` de `Bodega`, `Turno` y `TransferenciaStock`, que hasta ahora no tenían migración.
4. **CUANDO** `npm run build` corre al final del paso **EL SISTEMA DEBERÁ** salir con código 0.

**Verify** — todos los comandos, en orden, desde la raíz del proyecto.

```bash
npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --exit-code
npx prisma migrate status
npm run build
```

**Checkpoint**

```bash
git add -A && git commit -m "E1-T1: regularizar la deriva de migraciones con un baseline"
git tag step-01-baseline-migraciones
```

### `E1-T2` — Agregar el modelo Ubicacion y su migración

**Depends on:** `E1-T1` · **Priority:** p0 — metadato para recortes de alcance, no orden de ejecución

Agrega el modelo `Ubicacion` exactamente como está escrito arriba en *Modelo de datos tocado aquí*, y
la relación inversa `ubicaciones Ubicacion[]` en `Turno`. `Decimal(10, 7)` es deliberado: es la
convención que ya usa `Entrega.latitud` / `Entrega.longitud` en este repositorio. `onDelete: Cascade`
también es deliberado: evita marcadores fantasma en el mapa cuando se borra un turno. Genera la
migración con `npx prisma migrate dev --name ubicaciones` y no la edites a mano.

**Files**
- `prisma/schema.prisma` — edición: nuevo modelo `Ubicacion` y relación inversa en `Turno`
- `prisma/migrations/**` — nuevo: la migración que emite `npx prisma migrate dev`

**Acceptance**

1. **CUANDO** `npx prisma validate` corre **EL SISTEMA DEBERÁ** salir con código 0 con el modelo `Ubicacion` declarado y la relación `ubicaciones Ubicacion[]` presente en `Turno`.
2. **CUANDO** se lee el modelo `Ubicacion` **EL SISTEMA DEBERÁ** declarar `latitud` y `longitud` como `Decimal @db.Decimal(10, 7)`, igual que `Entrega`, y `registrado_en` como `DateTime @default(now())`.
3. **CUANDO** se lee el modelo `Ubicacion` **EL SISTEMA DEBERÁ** declarar `@@index([turno_id, registrado_en])` y `onDelete: Cascade` en la relación con `Turno`.
4. **CUANDO** `npx prisma migrate status` corre después de aplicar la migración **EL SISTEMA DEBERÁ** salir con código 0 y no reportar migraciones pendientes.
5. **CUANDO** `npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --exit-code` corre después de la migración **EL SISTEMA DEBERÁ** salir con código 0, probando cero deriva.

**Verify** — todos los comandos, en orden, desde la raíz del proyecto.

```bash
npx prisma validate
npx prisma migrate status
npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --exit-code
npm run build
```

**Checkpoint**

```bash
git add -A && git commit -m "E1-T2: agregar el modelo Ubicacion y su migración"
git tag step-02-modelo-ubicacion
```

### `E1-T3` — Crear lib/ubicaciones.ts con tres helpers puros

**Depends on:** `E1-T2` · **Priority:** p0 — metadato para recortes de alcance, no orden de ejecución

Tres funciones puras, sin dependencias. `validarCoordenadas` chequea `typeof … === 'number'`,
`Number.isFinite`, latitud en [-90, 90] y longitud en [-180, 180]. `minutosDesde(fecha, ahora?)`
devuelve la diferencia en minutos, aceptando `ahora` para que las pruebas no dependan del reloj.
`frescuraSenal(fecha, ahora?)` devuelve `'fresca'` bajo 5 minutos, `'vieja'` bajo 20 y `'sin_senal'`
en cualquier otro caso. **`frescuraSenal` es la función que decide el color del marcador en `E3-T2`
y `E3-T4`** — no es decorativa; si la escribes y nadie la llama, el paso está incompleto.

El archivo no importa Prisma, React ni nada de `next`: lo consumen tanto handlers de servidor como
componentes cliente.

**Files**
- `lib/ubicaciones.ts` — nuevo

**Acceptance**

1. **CUANDO** se importa `lib/ubicaciones.ts` **EL SISTEMA DEBERÁ** exportar `validarCoordenadas`, `minutosDesde` y `frescuraSenal`.
2. **CUANDO** `validarCoordenadas(lat, lng)` recibe un valor que no es `number`, o no es finito, o una latitud fuera de [-90, 90], o una longitud fuera de [-180, 180] **EL SISTEMA DEBERÁ** retornar `false`.
3. **CUANDO** `frescuraSenal(fecha, ahora)` recibe una fecha de hace menos de 5 minutos **EL SISTEMA DEBERÁ** retornar `'fresca'`; de menos de 20 minutos, `'vieja'`; en cualquier otro caso, `'sin_senal'`.
4. **CUANDO** se lee `lib/ubicaciones.ts` **EL SISTEMA DEBERÁ** no importar Prisma, React ni ningún módulo de `next`, para que el archivo sea usable desde servidor y cliente.
5. **CUANDO** `npm run build` y `npm run lint` corren **EL SISTEMA DEBERÁ** salir con código 0 en ambos.

**Verify** — todos los comandos, en orden, desde la raíz del proyecto.

```bash
npm run build
npm run lint
```

**Checkpoint**

```bash
git add -A && git commit -m "E1-T3: crear lib/ubicaciones.ts con tres helpers puros"
git tag step-03-helpers-ubicaciones
```

### `E1-T4` — Escribir las pruebas unitarias de los helpers

**Depends on:** `E1-T3` · **Priority:** p0 — metadato para recortes de alcance, no orden de ejecución

Imita `lib/precios/calcular.test.ts`: es el único test que existe hoy en el repositorio y define el
estilo. Jest 29 con `ts-jest`, entorno jsdom, alias `@/` ya resuelto en `jest.config.js`. No se
agrega ninguna dependencia ni se toca la configuración de Jest. Pasa siempre `ahora` explícito a
`minutosDesde` y `frescuraSenal` para que la prueba sea determinista.

**Files**
- `lib/ubicaciones.test.ts` — nuevo

**Acceptance**

1. **CUANDO** `npm test -- lib/ubicaciones.test.ts` corre **EL SISTEMA DEBERÁ** salir con código 0 con 0 pruebas fallidas y 0 omitidas.
2. **CUANDO** se leen las pruebas **EL SISTEMA DEBERÁ** cubrir para `validarCoordenadas` al menos los casos: coordenada válida de Maipú, `NaN`, `null`, latitud 91 y longitud -181.
3. **CUANDO** se leen las pruebas **EL SISTEMA DEBERÁ** cubrir para `frescuraSenal` los tres bordes: 4 minutos, 19 minutos y 21 minutos, pasando `ahora` explícito para que la prueba no dependa del reloj.
4. **CUANDO** `npm test` corre sobre todo el proyecto **EL SISTEMA DEBERÁ** salir con código 0 con 0 pruebas fallidas.

**Verify** — todos los comandos, en orden, desde la raíz del proyecto.

```bash
npm test -- lib/ubicaciones.test.ts
npm test
```

**Checkpoint**

```bash
git add -A && git commit -m "E1-T4: escribir las pruebas unitarias de los helpers"
git tag step-04-tests-helpers
```

### `E1-T5` — Crear POST /api/ubicaciones con lote y 409 sin turno

**Depends on:** `E1-T2`, `E1-T3` · **Priority:** p0 — metadato para recortes de alcance, no orden de ejecución

Handler de servidor. Obtén la sesión con `getToken` de `next-auth/jwt`; sin sesión, 401. El rol
esperado es `chofer`, pero un `admin` con turno activo también puede pingear — resuelve el `Chofer`
por `user_id` y luego su `Turno` con `estado: 'activo'`. Sin turno activo, **409**, que es la señal
que el cliente usa para dejar de enviar. Valida cada coordenada con `validarCoordenadas` antes de
tocar Prisma; una sola inválida en un lote invalida el request completo con 400.

El cuerpo acepta un objeto único o un array (vaciado de la cola offline). Para el array usa
`createMany` en una sola llamada. `registrado_en` **nunca** se toma del cliente: es
`@default(now())` del servidor. Respuesta con el envelope `ApiResponse` de `lib/types/index.ts`.

**Files**
- `app/api/ubicaciones/route.ts` — nuevo

**Acceptance**

1. **CUANDO** llega un `POST /api/ubicaciones` sin sesión **EL SISTEMA DEBERÁ** responder 401 y no escribir ninguna fila.
2. **CUANDO** llega un `POST /api/ubicaciones` de un usuario cuyo `Chofer` no tiene ningún `Turno` con `estado = 'activo'` **EL SISTEMA DEBERÁ** responder 409 con `{ success: false, error: 'Sin turno activo' }` y no escribir ninguna fila.
3. **CUANDO** el cuerpo trae `latitud` o `longitud` que `validarCoordenadas` rechaza **EL SISTEMA DEBERÁ** responder 400 y no escribir ninguna fila.
4. **CUANDO** el cuerpo es un array de pings **EL SISTEMA DEBERÁ** insertarlos con `createMany` en una sola llamada y responder 201 con la cantidad insertada.
5. **CUANDO** se inserta un ping **EL SISTEMA DEBERÁ** tomar `registrado_en` del valor por defecto del servidor y nunca de una marca de tiempo enviada por el cliente.

**Verify** — todos los comandos, en orden, desde la raíz del proyecto. El tercero levanta el servidor
de desarrollo, espera hasta 120 s a que responda, mide el código HTTP de un POST anónimo y apaga el
servidor. Sale con código 0 sólo si ese código es exactamente `401`, lo que prueba a la vez que la
ruta está montada y que el guard de autenticación está activo.

```bash
npm run build
npm run lint
npm run dev > /tmp/viflomax-dev.log 2>&1 & DEV_PID=$!; for i in $(seq 1 60); do curl -s -o /dev/null http://localhost:3000/ && break; sleep 2; done; CODE=$(curl -s -o /dev/null -w '%{http_code}' -X POST http://localhost:3000/api/ubicaciones -H 'Content-Type: application/json' -d '{"latitud":-33.5,"longitud":-70.76}'); kill $DEV_PID 2>/dev/null || true; test "$CODE" = 401
```

**Checkpoint**

```bash
git add -A && git commit -m "E1-T5: crear POST /api/ubicaciones con lote y 409 sin turno"
git tag step-05-post-ubicaciones
```

### `E1-T6` — Crear GET /api/ubicaciones/activas con distinct

**Depends on:** `E1-T5` · **Priority:** p0 — metadato para recortes de alcance, no orden de ejecución

Sólo rol `admin`, comparado inline. La consulta es el truco central de todo el proyecto: una sola
llamada devuelve la última posición de cada turno activo.

```ts
prisma.ubicacion.findMany({
  where: { turno: { estado: 'activo' } },
  distinct: ['turno_id'],
  orderBy: [{ turno_id: 'asc' }, { registrado_en: 'desc' }],
  include: { turno: { select: { chofer: { select: { nombre: true } }, bodega: { select: { patente: true } } } } },
})
```

El `orderBy` debe ordenar primero por `turno_id` y después por `registrado_en` descendente: así
`distinct` conserva la fila más reciente de cada turno. Convierte `latitud` y `longitud` con
`Number()` antes de responder. Envelope `ApiListResponse`.

**Files**
- `app/api/ubicaciones/activas/route.ts` — nuevo

**Acceptance**

1. **CUANDO** llega un `GET /api/ubicaciones/activas` sin sesión **EL SISTEMA DEBERÁ** responder 401.
2. **CUANDO** llega un `GET /api/ubicaciones/activas` de un usuario con rol distinto de `admin` **EL SISTEMA DEBERÁ** responder 403.
3. **CUANDO** un administrador consulta la ruta **EL SISTEMA DEBERÁ** retornar exactamente una fila por cada `Turno` con `estado = 'activo'` que tenga ubicaciones, usando `distinct: ['turno_id']` con `orderBy` `[{ turno_id: 'asc' }, { registrado_en: 'desc' }]`.
4. **CUANDO** se serializa la respuesta **EL SISTEMA DEBERÁ** convertir `latitud` y `longitud` con `Number()` de modo que ningún campo sea un objeto `Decimal`.
5. **CUANDO** se arma cada fila **EL SISTEMA DEBERÁ** incluir el nombre del chofer y la patente de la bodega asociadas al turno.

**Verify** — todos los comandos, en orden, desde la raíz del proyecto.

```bash
npm run build
npm run lint
npm run dev > /tmp/viflomax-dev.log 2>&1 & DEV_PID=$!; for i in $(seq 1 60); do curl -s -o /dev/null http://localhost:3000/ && break; sleep 2; done; CODE=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/ubicaciones/activas); kill $DEV_PID 2>/dev/null || true; test "$CODE" = 401
```

**Checkpoint**

```bash
git add -A && git commit -m "E1-T6: crear GET /api/ubicaciones/activas con distinct"
git tag step-06-get-activas
```

---

## Epic acceptance

El épico está terminado cuando cada tarea está `done` **y**:

1. **CUANDO** `npx prisma migrate status` corre en una copia limpia **EL SISTEMA DEBERÁ** salir con código 0 sin migraciones pendientes ni deriva.
2. **CUANDO** un `POST /api/ubicaciones` y un `GET /api/ubicaciones/activas` anónimos llegan al servidor de desarrollo **EL SISTEMA DEBERÁ** responder 401 en ambos casos, sin exponer datos de ubicación.

```bash
npm run build && npm run lint && npm test
npx prisma migrate status
```

Se ejecutan desde la raíz del proyecto.

## Pitfalls

- **`Decimal` serializado directamente.** Prisma devuelve un objeto, no un número. Sin `Number()` el
  JSON sale con `{"s":1,"e":1,"d":[...]}` y el mapa del épico 03 no dibuja nada, sin ningún error.
- **`distinct` sin el `orderBy` correcto.** Si `turno_id` no es la primera clave de orden, Prisma
  conserva una fila arbitraria del grupo y el mapa muestra posiciones viejas como si fueran actuales.
- **Correr `prisma migrate dev` antes de probar deriva cero.** Si la base viva no coincide con el
  schema, Prisma ofrece resetear la base de producción. Nunca aceptes ese reset: el chequeo de deriva
  de `E1-T1` existe justamente para que esa pregunta no aparezca.
- **`SHADOW_DATABASE_URL` ausente.** Si el usuario de Postgres no puede `CREATEDB`, `prisma migrate
  dev` falla al crear la base sombra. Créala a mano una sola vez como `viflomax_shadow` vacía en la
  misma instancia; es el punto donde este épico se atasca con más frecuencia.
- **Editar el flujo de turnos.** Está congelado. Si una tarea parece necesitarlo, el límite está mal.

## Before moving on

- [ ] Cada tarea de este épico está `done` en `tasks.json` — ninguna quedó `in_progress`.
- [ ] Cada comando `verify` de cada tarea pasó, no sólo el primero.
- [ ] Ningún comando `verify` fue editado, y ninguno se omitió porque un archivo no existía.
- [ ] Cada tarea tiene su etiqueta `checkpoint` en git — `git tag -l 'step-*'` las lista.
- [ ] El comando de gate pasa limpio, corrido desde la raíz del proyecto.
- [ ] Cada contrato "Producido" existe con la firma declarada.
- [ ] Ningún archivo fuera del subárbol fue modificado.
- [ ] Este épico no agrega ninguna variable de entorno nueva: `DATABASE_URL` y `SHADOW_DATABASE_URL`
      ya estaban documentadas antes del paso 1.
- [ ] Un commit por tarea, cada uno prefijado con su id, cada uno seguido de su etiqueta.
