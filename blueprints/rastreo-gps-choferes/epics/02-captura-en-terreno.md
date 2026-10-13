# Epic 02: Captura en terreno

> Al terminar este épico el navegador del chofer puede pedir permiso de geolocalización, capturar
> posiciones cada 2 minutos, encolarlas sin conexión y enviarlas, con consentimiento explícito y un
> indicador permanente mientras comparte ubicación.

| | |
|---|---|
| **Epic id** | `02-captura-en-terreno` |
| **Tasks** | `E2-T1` … `E2-T5` |
| **Depends on** | `01-cimientos-e-ingesta` (sólo `E2-T1` y `E2-T4` dependen de él) |
| **Unlocks** | `03-flota-y-operacion` |
| **Parallel with** | `E2-T2` y `E2-T3` no comparten archivos con ninguna tarea del épico 01 |

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
| Test (un archivo) | `npm test -- lib/utils/indexeddb-upgrade.test.ts` |
| Estado de migraciones | `npx prisma migrate status` |

**Gate:** `npm run build && npm run lint && npm test` pasa antes de marcar cualquier tarea de aquí
como terminada. **No existe `npm run typecheck`** en este repositorio: `npm run build` es
`prisma generate && next build`, y `next build` corre `tsc`.

`E2-T1` verifica contra el servidor de desarrollo, que necesita `DATABASE_URL` en `.env`. Es un
prerrequisito brownfield ya existente, no algo que este bundle levante. `E2-T2`, `E2-T3`, `E2-T4` y
`E2-T5` no tocan la base de datos.

## Subárbol de directorios

Sólo lo que este épico toca:

```
next.config.mjs                       # existe, lo editas en E2-T2 — hoy NO tiene headers()
lib/
  utils/index.ts                      # existe, lo editas en E2-T3 — capa IndexedDB
  utils/indexeddb-upgrade.test.ts     # NUEVO en E2-T3 — prueba de migración v1→v2
  useUbicacionPing.ts                 # NUEVO en E2-T4 — hook de captura
  ubicaciones.ts                      # existe desde E1-T3, sólo lectura
components/
  chofer/UbicacionTracker.tsx         # NUEVO en E2-T5 — consentimiento + indicador
  chofer/TurnoBanner.tsx              # existe, CONGELADO — no se toca
app/
  api/ubicaciones/turno/[id]/route.ts # NUEVO en E2-T1 — trayecto ordenado
```

Todo lo que esté fuera de este subárbol queda fuera de alcance. Si una tarea parece exigir editar un
archivo que no está aquí, detente y reporta: significa que el límite del épico está mal.

## Modelo de datos tocado aquí

| Entidad | Campos que este épico agrega o lee | Notas |
|---|---|---|
| `Ubicacion` | lee `turno_id`, `latitud`, `longitud`, `registrado_en`; escribe vía la API | Creada en `E1-T2`. Coordenadas `Decimal(10, 7)` |
| `Turno` | lee `estado` | El rastreo lee estado de turno, **nunca** lo escribe |

Contrato de IndexedDB — base `viflomax-chofer`, hoy en **versión 1** con un solo store
`entregas_pendientes`. Este épico la lleva a **versión 2** agregando `ubicaciones_pendientes` con
`{ autoIncrement: true }`, sin perder nada de lo encolado.

## Contratos

**Consumidos** — ya existen, no los reconstruyas:

| De | Interfaz | Garantía |
|---|---|---|
| `E1-T3` | `lib/ubicaciones.ts` → `validarCoordenadas(lat, lng): boolean` | Puro, sin dependencias |
| `E1-T5` | `POST /api/ubicaciones` | Acepta un ping o un array; 401 sin sesión, 409 sin turno activo, 400 con coordenada inválida, 201 al insertar |
| repositorio | `lib/utils/index.ts` → `abrirDB`, `guardarEntregaOffline`, `obtenerEntregasPendientes`, `marcarEntregaSincronizada`, `sincronizarEntregas` | La capa IndexedDB existente; `sincronizarUbicaciones` la imita |
| repositorio | `app/chofer/layout.tsx` | Componente **de servidor asíncrono** — no puede contener hooks; monta el tracker como hijo cliente (eso ocurre en `E3-T1`) |

**Producidos** — épicos posteriores dependen de estas firmas exactas. Cambiar una los rompe:

| Export | Firma | Usado por |
|---|---|---|
| `lib/utils/index.ts` → `aplicarUpgradeIndexedDB` | `(db: { objectStoreNames: { contains(n: string): boolean }, createObjectStore(n: string, o?: object): unknown }, oldVersion: number) => void` | `E2-T3` (su propia prueba) |
| `lib/utils/index.ts` → `guardarUbicacionOffline`, `obtenerUbicacionesPendientes`, `sincronizarUbicaciones` | mismas formas que los helpers de entregas | `E2-T4` |
| `lib/useUbicacionPing.ts` → `useUbicacionPing` | `(opciones: { activo: boolean }) => { compartiendo: boolean }` | `E2-T5` |
| `components/chofer/UbicacionTracker.tsx` → default | componente cliente sin props obligatorias | `E3-T1` |
| `GET /api/ubicaciones/turno/[id]` | trayecto ordenado ascendente, coordenadas ya `Number()` | vista de detalle de flota |

## Convenciones que muerden en esta área

- **`app/chofer/layout.tsx` es un componente de servidor asíncrono.** No puede usar hooks. El tracker
  se monta como hijo cliente; el layout no cambia de naturaleza.
- **El throttle vive en el sitio de envío, no en un temporizador.** Una marca de tiempo en `useRef`
  decide si este `watchPosition` se manda o se descarta. Un `setInterval` paralelo desincroniza el
  envío de la lectura y duplica pings.
- **`clearWatch` siempre.** Sin él, el watcher sobrevive al desmontaje y en React StrictMode se
  duplican los envíos en desarrollo.
- **Los errores de geolocalización degradan en silencio.** Un permiso denegado nunca bloquea la
  entrega ni rompe la UI. Se encola y se sigue.
- **Nada de CSP.** El proyecto no tiene `Content-Security-Policy` y agregarla mal rompería Cloudinary
  y el service worker. `E2-T2` agrega **sólo** `Permissions-Policy`.
- **La envoltura PWA se conserva.** `next.config.mjs` exporta la config envuelta por
  `@ducanh2912/next-pwa`; `headers()` se agrega **dentro** del objeto de configuración, antes de
  envolver, no después.
- **El flujo de turnos está congelado.** `components/chofer/TurnoBanner.tsx`,
  `app/api/turnos/route.ts` y `app/api/turnos/[id]/route.ts` no se tocan en ningún momento.

Reglas completas del proyecto: `CLAUDE.md`. Está en la raíz del proyecto — el constructor lo copió
desde `workspace/` del bundle antes de la tarea uno.

---

## Tasks

Listadas en el mismo orden que `tasks.json`. Ese orden es el orden de construcción — trabaja de
arriba hacia abajo y no reordenes por prioridad ni por lo que parezca rápido.

### `E2-T1` — Crear GET /api/ubicaciones/turno/[id] con el trayecto

**Depends on:** `E1-T5` · **Priority:** p1 — metadato para recortes de alcance, no orden de ejecución

Ruta dinámica de sólo lectura, rol `admin` comparado inline. Devuelve **todas** las ubicaciones de un
turno ordenadas por `registrado_en` ascendente, que es exactamente lo que consume una `Polyline` de
Leaflet. Si el turno no existe, 404 explícito — no dejes que Prisma lance y termine en 500.
Convierte las coordenadas con `Number()`. Envelope `ApiListResponse` de `lib/types/index.ts`.

**Files**
- `app/api/ubicaciones/turno/[id]/route.ts` — nuevo

**Acceptance**

1. **CUANDO** llega un `GET /api/ubicaciones/turno/[id]` sin sesión **EL SISTEMA DEBERÁ** responder 401.
2. **CUANDO** llega un `GET /api/ubicaciones/turno/[id]` de un usuario con rol distinto de `admin` **EL SISTEMA DEBERÁ** responder 403.
3. **CUANDO** un administrador consulta un turno existente **EL SISTEMA DEBERÁ** retornar todas sus ubicaciones ordenadas por `registrado_en` ascendente, listas para alimentar una `Polyline`.
4. **CUANDO** un administrador consulta un `id` de turno que no existe **EL SISTEMA DEBERÁ** responder 404 y no lanzar una excepción no controlada.
5. **CUANDO** se serializa la respuesta **EL SISTEMA DEBERÁ** convertir `latitud` y `longitud` con `Number()`.

**Verify** — todos los comandos, en orden, desde la raíz del proyecto.

```bash
npm run build
npm run lint
npm run dev > /tmp/viflomax-dev.log 2>&1 & DEV_PID=$!; for i in $(seq 1 60); do curl -s -o /dev/null http://localhost:3000/ && break; sleep 2; done; CODE=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/ubicaciones/turno/00000000-0000-0000-0000-000000000000); kill $DEV_PID 2>/dev/null || true; test "$CODE" = 401
```

**Checkpoint**

```bash
git add -A && git commit -m "E2-T1: crear GET /api/ubicaciones/turno/[id] con el trayecto"
git tag step-07-get-trayecto
```

### `E2-T2` — Agregar headers() con Permissions-Policy geolocation

**Depends on:** nada · **Priority:** p0 — metadato para recortes de alcance, no orden de ejecución

`next.config.mjs` hoy **no tiene** `headers()` en absoluto. Agrega una función `headers()` asíncrona
que aplique `Permissions-Policy: geolocation=(self)` a `/:path*`. Este paso va **antes** de cualquier
código que pida geolocalización: una cabecera que gobierna el comportamiento de una API del navegador
debe estar en su lugar antes del primer código cuyo comportamiento gobierna.

No agregues `Content-Security-Policy`. Conserva la envoltura de `@ducanh2912/next-pwa` sobre el
objeto exportado.

**Files**
- `next.config.mjs` — edición: nueva función `headers()`

**Acceptance**

1. **CUANDO** se lee `next.config.mjs` **EL SISTEMA DEBERÁ** exponer una función `headers()` asíncrona que aplica a la ruta `/:path*`.
2. **CUANDO** el servidor responde a cualquier ruta **EL SISTEMA DEBERÁ** incluir la cabecera `Permissions-Policy: geolocation=(self)`.
3. **CUANDO** se lee `next.config.mjs` **EL SISTEMA DEBERÁ** no declarar ninguna cabecera `Content-Security-Policy`, porque el proyecto no tiene CSP y agregarla mal rompería Cloudinary y el service worker.
4. **CUANDO** `npm run build` corre **EL SISTEMA DEBERÁ** salir con código 0 y la envoltura de `@ducanh2912/next-pwa` DEBERÁ seguir aplicada sobre la configuración exportada.

**Verify** — todos los comandos, en orden, desde la raíz del proyecto.

```bash
npm run build
grep -qF 'geolocation=(self)' next.config.mjs
npm run dev > /tmp/viflomax-dev.log 2>&1 & DEV_PID=$!; for i in $(seq 1 60); do curl -s -o /dev/null http://localhost:3000/ && break; sleep 2; done; curl -sI http://localhost:3000/ > /tmp/viflomax-headers.txt; kill $DEV_PID 2>/dev/null || true; grep -qi 'permissions-policy: geolocation=(self)' /tmp/viflomax-headers.txt
```

**Checkpoint**

```bash
git add -A && git commit -m "E2-T2: agregar headers() con Permissions-Policy geolocation"
git tag step-08-permissions-policy
```

### `E2-T3` — Migrar IndexedDB a v2 con store de ubicaciones

**Depends on:** nada · **Priority:** p0 — metadato para recortes de alcance, no orden de ejecución

`lib/utils/index.ts` tiene hoy el `onupgradeneeded` **inline** dentro de `abrirDB()`, lo que lo hace
imposible de probar. Extrae esa lógica a una función exportada
`aplicarUpgradeIndexedDB(db, oldVersion)` que sólo dependa de `objectStoreNames.contains` y
`createObjectStore` — así un objeto falso escrito a mano en Jest la prueba sin ninguna dependencia
nueva. `abrirDB()` la llama desde su `onupgradeneeded`.

Sube `DB_VERSION` a `2` y agrega `createObjectStore('ubicaciones_pendientes', { autoIncrement: true })`.
La función debe crear **ambos** stores cuando `oldVersion` es 0 y sólo el nuevo cuando es 1: ese es
el caso que protege las entregas ya encoladas de los choferes que hoy tienen la app instalada.
`sincronizarUbicaciones` imita a `sincronizarEntregas`, pero envía el lote completo en un solo
`POST /api/ubicaciones`.

**Files**
- `lib/utils/index.ts` — edición: `aplicarUpgradeIndexedDB`, `DB_VERSION = 2`, helpers de ubicaciones
- `lib/utils/indexeddb-upgrade.test.ts` — nuevo: prueba de la migración v1→v2

**Acceptance**

1. **CUANDO** se lee `lib/utils/index.ts` **EL SISTEMA DEBERÁ** exportar `aplicarUpgradeIndexedDB(db, oldVersion)` extraída del `onupgradeneeded` que hoy está inline en `abrirDB()`, y `DB_VERSION` DEBERÁ valer 2.
2. **CUANDO** `aplicarUpgradeIndexedDB` recibe un objeto que ya contiene `entregas_pendientes` y `oldVersion` igual a 1 **EL SISTEMA DEBERÁ** crear `ubicaciones_pendientes` y no volver a crear `entregas_pendientes`.
3. **CUANDO** `aplicarUpgradeIndexedDB` recibe un objeto sin ningún store y `oldVersion` igual a 0 **EL SISTEMA DEBERÁ** crear tanto `entregas_pendientes` como `ubicaciones_pendientes`.
4. **CUANDO** se lee `lib/utils/index.ts` **EL SISTEMA DEBERÁ** exportar `guardarUbicacionOffline`, `obtenerUbicacionesPendientes` y `sincronizarUbicaciones`, con la misma forma que los helpers existentes de entregas.
5. **CUANDO** `npm test -- lib/utils/indexeddb-upgrade.test.ts` corre **EL SISTEMA DEBERÁ** salir con código 0 con 0 pruebas fallidas y 0 omitidas.

**Verify** — todos los comandos, en orden, desde la raíz del proyecto.

```bash
npm test -- lib/utils/indexeddb-upgrade.test.ts
npm test
npm run build
```

**Checkpoint**

```bash
git add -A && git commit -m "E2-T3: migrar IndexedDB a v2 con store de ubicaciones"
git tag step-09-indexeddb-v2
```

### `E2-T4` — Crear el hook useUbicacionPing con watchPosition

**Depends on:** `E1-T3`, `E2-T3` · **Priority:** p0 — metadato para recortes de alcance, no orden de ejecución

Un solo `navigator.geolocation.watchPosition` con
`{ enableHighAccuracy: true, maximumAge: 60000, timeout: 30000 }`. El throttle vive **en el sitio de
envío**: una marca de tiempo en `useRef` decide si esta lectura se manda o se descarta, con un
intervalo de 2 minutos. Un ping extra se dispara de inmediato al activarse el rastreo, para que el
administrador vea al chofer aparecer sin esperar dos minutos.

`clearWatch` en la limpieza del efecto, siempre. Si el `POST` falla o el permiso está denegado, el
ping se encola con `guardarUbicacionOffline` y no se muestra ningún error bloqueante. Al recuperar
conexión, `sincronizarUbicaciones` vacía la cola en un solo request por lote.

Nota de cadencia, deliberadamente asimétrica: se **escribe** cada 2 minutos y se **lee** cada 15
segundos desde el panel de administración (`E3-T3`). El costo lo paga el lector, no la batería del
chofer.

**Files**
- `lib/useUbicacionPing.ts` — nuevo

**Acceptance**

1. **CUANDO** el hook se activa **EL SISTEMA DEBERÁ** llamar a `navigator.geolocation.watchPosition` con `{ enableHighAccuracy: true, maximumAge: 60000, timeout: 30000 }` y enviar un ping inmediato.
2. **CUANDO** llegan posiciones consecutivas **EL SISTEMA DEBERÁ** limitar los envíos a uno cada 2 minutos comparando contra una marca de tiempo guardada en un `useRef`, sin usar un temporizador propio.
3. **CUANDO** el componente que usa el hook se desmonta o el hook se desactiva **EL SISTEMA DEBERÁ** llamar a `clearWatch` con el identificador devuelto por `watchPosition`.
4. **CUANDO** el envío al servidor falla o el permiso está denegado **EL SISTEMA DEBERÁ** degradar en silencio: encolar el ping con `guardarUbicacionOffline` y no lanzar ni mostrar un error bloqueante.
5. **CUANDO** el hook vuelve a tener conexión **EL SISTEMA DEBERÁ** vaciar la cola llamando a `sincronizarUbicaciones`, que envía el lote en un solo `POST /api/ubicaciones`.
6. **CUANDO** `npm run build` y `npm run lint` corren **EL SISTEMA DEBERÁ** salir con código 0 en ambos.

**Verify** — todos los comandos, en orden, desde la raíz del proyecto.

```bash
npm run build
npm run lint
grep -qF 'clearWatch' lib/useUbicacionPing.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E2-T4: crear el hook useUbicacionPing con watchPosition"
git tag step-10-hook-ping
```

### `E2-T5` — Crear UbicacionTracker con consentimiento e indicador

**Depends on:** `E2-T4` · **Priority:** p0 — metadato para recortes de alcance, no orden de ejecución

Componente cliente. Antes de que el prompt nativo del navegador se dispare siquiera una vez, muestra
una tarjeta explicativa; el hook queda desactivado hasta que el chofer acepta. La decisión se
persiste en `localStorage`. Esto no es cortesía: un prompt nativo denegado por sorpresa es
irrecuperable sin que el usuario vaya a la configuración del navegador.

El texto debe ser honesto en dos puntos, ambos verificables leyéndolo: el rastreo ocurre **sólo
durante un turno activo**, y **se detiene cuando la aplicación se cierra** — es una PWA, no una app
nativa, y `watchPosition` muere con la pestaña. Mientras el rastreo está activo, un indicador
permanente y visible lo dice. Sin turno activo no hay indicador ni hook.

Usa los colores semánticos del proyecto: `#10b981` señal fresca, `#f59e0b` señal vieja, `#ef4444`
sin señal. Cards `rounded-xl` + `shadow-sm`, tipografía `font-nunito` / `font-outfit`. Sin gradientes
ni sombras decorativas — el `DESIGN.md` del proyecto las prohíbe.

**Files**
- `components/chofer/UbicacionTracker.tsx` — nuevo

**Acceptance**

1. **CUANDO** el chofer abre la aplicación y aún no ha aceptado **EL SISTEMA DEBERÁ** mostrar una tarjeta explicativa antes de disparar el prompt nativo del navegador, y el hook DEBERÁ permanecer desactivado hasta la aceptación.
2. **CUANDO** el chofer acepta **EL SISTEMA DEBERÁ** persistir la decisión en `localStorage` y no volver a mostrar la tarjeta en visitas posteriores.
3. **CUANDO** el rastreo está activo **EL SISTEMA DEBERÁ** mostrar un indicador permanente y visible mientras se comparte la ubicación.
4. **CUANDO** se lee el texto de la tarjeta **EL SISTEMA DEBERÁ** declarar explícitamente que el rastreo sólo ocurre durante un turno activo y que se detiene cuando la aplicación se cierra.
5. **CUANDO** el chofer no tiene turno activo **EL SISTEMA DEBERÁ** no renderizar el indicador ni activar el hook.
6. **CUANDO** `npm run build` y `npm run lint` corren **EL SISTEMA DEBERÁ** salir con código 0 en ambos.

**Verify** — todos los comandos, en orden, desde la raíz del proyecto.

```bash
npm run build
npm run lint
grep -qF 'localStorage' components/chofer/UbicacionTracker.tsx
grep -qF 'use client' components/chofer/UbicacionTracker.tsx
```

**Checkpoint**

```bash
git add -A && git commit -m "E2-T5: crear UbicacionTracker con consentimiento e indicador"
git tag step-11-tracker-consentimiento
```

---

## Epic acceptance

El épico está terminado cuando cada tarea está `done` **y**:

1. **CUANDO** el servidor de desarrollo responde a cualquier ruta **EL SISTEMA DEBERÁ** incluir `Permissions-Policy: geolocation=(self)`, de modo que el código de captura escrito en este épico tenga permiso para pedir ubicación.
2. **CUANDO** una base IndexedDB en versión 1 con entregas encoladas se abre con el código nuevo **EL SISTEMA DEBERÁ** conservar `entregas_pendientes` y agregar `ubicaciones_pendientes`, sin perder ninguna entrega pendiente.

```bash
npm run build && npm run lint && npm test
npm test -- lib/utils/indexeddb-upgrade.test.ts
```

Se ejecutan desde la raíz del proyecto.

## Pitfalls

- **Poner hooks en `app/chofer/layout.tsx`.** Es un componente de servidor asíncrono; agregarle un
  hook rompe el build con un error que apunta al layout y no a la causa. El tracker se monta como
  hijo cliente, y eso ocurre en `E3-T1`, no aquí.
- **Un `setInterval` para el throttle.** Desacopla el envío de la lectura, duplica pings en
  StrictMode y sigue corriendo cuando el watcher ya murió. La marca de tiempo en `useRef` es la única
  forma correcta.
- **Olvidar `clearWatch`.** En desarrollo con StrictMode se montan dos watchers y el chofer envía el
  doble de pings sin que nadie lo note hasta ver la tabla `Ubicacion` crecer al doble.
- **Perder entregas en la migración a v2.** Si `aplicarUpgradeIndexedDB` sólo crea el store nuevo
  cuando `oldVersion === 0`, una base v1 real nunca lo obtiene; si borra y recrea, se pierden las
  entregas encoladas. La prueba de `E2-T3` existe exactamente para esos dos casos.
- **Agregar CSP "de paso".** El proyecto no tiene una. Agregarla mal rompe Cloudinary y el service
  worker de la PWA, y el síntoma aparece en producción, no en el build.
- **Prometer rastreo con la app cerrada.** No existe en una PWA. Si el texto de consentimiento lo
  insinúa, el criterio 4 falla al leerlo.

## Before moving on

- [ ] Cada tarea de este épico está `done` en `tasks.json` — ninguna quedó `in_progress`.
- [ ] Cada comando `verify` de cada tarea pasó, no sólo el primero.
- [ ] Ningún comando `verify` fue editado, y ninguno se omitió porque un archivo no existía.
- [ ] Cada tarea tiene su etiqueta `checkpoint` en git — `git tag -l 'step-*'` las lista.
- [ ] El comando de gate pasa limpio, corrido desde la raíz del proyecto.
- [ ] Cada contrato "Producido" existe con la firma declarada.
- [ ] Ningún archivo fuera del subárbol fue modificado; en particular `components/chofer/TurnoBanner.tsx`
      y las rutas de turnos siguen intactas.
- [ ] Este épico no agrega ninguna variable de entorno nueva.
- [ ] Un commit por tarea, cada uno prefijado con su id, cada uno seguido de su etiqueta.
