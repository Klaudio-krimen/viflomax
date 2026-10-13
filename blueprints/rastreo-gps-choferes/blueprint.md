# Rastreo GPS de choferes (Viflomax) — Blueprint

> Generado por The Architect el 2026-08-11
> Forma: brownfield feature vertical sobre una app Next.js existente
> Runtime track: ts-node (Next.js 14 App Router + npm), heredado del repositorio
> Modo de emisión: bundle
> Versión del blueprint: 1
> Versiones verificadas por última vez: 2026-08-11 — ver §11 para la procedencia por paquete

---

## 1. Project Overview & Non-Goals

### Visión

Viflomax distribuye agua purificada a domicilio en Maipú, Chile. Hoy la administración sabe qué
entregas se completaron, pero no dónde está cada camión mientras el turno transcurre: cuando un
cliente llama preguntando "¿a qué hora llega?", la respuesta se construye llamando al chofer por
teléfono. Este trabajo agrega **rastreo GPS de choferes desde su propio celular, únicamente mientras
tienen un turno de trabajo activo**, y una **vista de flota en vivo** para administración.

El chofer ve un indicador permanente mientras comparte ubicación y da consentimiento explícito en una
tarjeta de la aplicación **antes** de que el navegador dispare su prompt nativo. Administración ve un
mapa con la última posición de cada chofer en turno y puede revisar el recorrido completo de la
jornada. El rastreo se apaga solo: sin turno activo no hay pings, y el servidor rechaza con 409
cualquier intento de registrar una posición fuera de turno. No es vigilancia de personas, es
visibilidad de una jornada laboral acotada, y esa frontera está codificada en el modelo de datos.

### Users

| Persona | A qué viene | Frecuencia |
|---|---|---|
| Chofer | Abrir la app al iniciar turno, aceptar una vez el rastreo, y que la ubicación se envíe sola mientras reparte | Diaria, toda la jornada |
| Administración | Ver en un mapa dónde está cada camión ahora, y revisar el recorrido de una jornada pasada | Varias veces al día |
| Visor (rol de sólo lectura de pedidos) | Nada aquí — este rol **no** accede a la flota | Nunca |

### Goals — alcance v1

1. El sistema registra la posición de un chofer cada 2 minutos mientras tiene un turno activo, y sólo
   entonces.
2. El sistema muestra a administración un mapa en vivo con la última posición de cada chofer en
   turno, refrescado cada 15 segundos.
3. El sistema expone el recorrido completo y ordenado de un turno para dibujarlo como trayecto.
4. El sistema pide consentimiento explícito e informado antes de solicitar la geolocalización, y lo
   recuerda.
5. El sistema conserva las posiciones 90 días y luego las purga.

### Non-Goals — explícitamente fuera de alcance para v1

| No se construye | Por qué no ahora | Revisar cuando |
|---|---|---|
| Rastreo con la aplicación cerrada | Imposible en una PWA: `watchPosition` muere con la pestaña. Requeriría una app nativa con permiso de background location | La operación justifique construir y mantener una app nativa en dos tiendas |
| Geocercas, ETA, optimización de rutas, replay animado, clustering de marcadores | Cada una es un producto propio. Ninguna tiene demanda validada y todas dependen de tener primero un historial de posiciones real | Existan 90 días de datos reales y alguien pida una de ellas por nombre |
| Cualquier cambio al flujo de turnos | `components/chofer/TurnoBanner.tsx`, `app/api/turnos/route.ts` y `app/api/turnos/[id]/route.ts` están **congelados**. El rastreo **lee** el estado del turno, nunca lo escribe | El flujo de turnos se rediseñe por sus propias razones, no por el rastreo |
| Agregar una `Content-Security-Policy` | El proyecto no tiene una. Agregarla mal rompería Cloudinary y el service worker de la PWA, y el síntoma aparecería en producción | Exista una auditoría de seguridad con tiempo dedicado a probar la CSP contra ambos |
| Migrar de Jest a Vitest | Jest 29 + ts-jest funciona y hay exactamente un test hoy. Migrar es trabajo puro de infraestructura con cero valor para este cambio | El proyecto tenga suficientes tests como para que la velocidad de Jest sea un problema medible |
| Arreglar el `.env.example` obsoleto | Menciona Supabase y Google Maps, y omite `DATABASE_URL`. Arreglarlo es correcto pero es un cambio de alcance distinto que tocaría documentación de todo el proyecto | Se haga una pasada de onboarding de desarrolladores nuevos |
| Introducir un helper central `requireRole()` | Los roles se comparan inline en cada handler. Centralizarlo tocaría todas las rutas existentes y convertiría un cambio aditivo en una refactorización transversal | Una revisión de autorización cubra todas las rutas a la vez |

**El constructor no debe implementar nada de esta tabla**, aunque parezca una adición pequeña
mientras trabaja en un paso adyacente. Si un paso parece requerir un no-objetivo, eso es un defecto
del blueprint — detente y repórtalo en vez de expandir el alcance.

### Interfaces congeladas

Estas superficies existen y su comportamiento no cambia. El flujo de turnos tiene además su fila
espejo explícita en la tabla de no-objetivos; las otras cuatro se protegen aquí y en las tablas de
interfaces congeladas de §5 y §8, que repiten esta misma lista.

| Interfaz | Garantía que se mantiene |
|---|---|
| `GET /api/turnos` | Misma forma de respuesta, mismos códigos, misma autorización. El rastreo la lee, no la modifica |
| `POST /api/entregas` | Sin cambios. `Entrega.latitud` / `Entrega.longitud` siguen siendo `Decimal(10,7)` opcionales y las escribe el flujo de entregas, no el de rastreo |
| Contrato IndexedDB `entregas_pendientes` | El store, su nombre y su forma se conservan intactos al migrar la base de v1 a v2 |
| Todo comportamiento de autorización de `/admin/*` | Mismos redirects, mismos roles. `/admin/flota` es una ruta nueva que hereda las reglas existentes |
| Conjunto de valores de `User.role` | Sigue siendo exactamente `'admin' \| 'chofer' \| 'publico' \| 'visor'`. No se agrega ningún rol |

### Métricas de éxito

| Métrica | Objetivo | Cómo se mide |
|---|---|---|
| Cobertura de turnos con posición | ≥ 80% de los turnos activos tienen al menos una fila en `Ubicacion` a los 30 días | `SELECT count(DISTINCT turno_id) FROM "Ubicacion"` contra `SELECT count(*) FROM "Turno" WHERE estado='cerrado'` en la ventana |
| Frescura de señal en el panel | ≥ 70% de los marcadores en verde (`< 5 min`) durante horario de reparto | Conteo de `frescuraSenal` sobre la respuesta de `GET /api/ubicaciones/activas` |
| Tamaño de la tabla bajo control | `Ubicacion` nunca supera ~90 días de filas | `npm run ubicaciones:purgar` reporta 0 eliminadas al correrse dos veces seguidas |

---

## 2. Tech Stack

**Runtime track: ts-node (Next.js 14 App Router + npm), heredado del repositorio.** Esta tabla nombra
*decisiones*, no versiones. Cada pin vive en la §11 y en ningún otro lugar.

| Capa | Elección | Por qué esto, y no lo otro |
|---|---|---|
| Lenguaje / runtime | TypeScript sobre Node 20 (fijado en `.nvmrc`) | Es lo que el repositorio ya usa. Node 20.6+ además trae `--env-file` nativo, que evita agregar `dotenv` para el script de purga |
| Framework | Next.js 14 App Router | Ya instalado. Cambiarlo por un servicio aparte para el rastreo duplicaría autenticación, despliegue y modelo de datos |
| Estilos | Tailwind CSS con las fuentes Nunito y Outfit | Convención existente. Introducir CSS modules o styled-components para tres componentes nuevos fragmentaría el proyecto |
| Capa de componentes | Componentes propios; Leaflet + react-leaflet sólo para el mapa | react-leaflet es la integración React madura de Leaflet. Se rechazó Google Maps: requiere API key, tarjeta de crédito y facturación por carga de mapa |
| Base de datos | PostgreSQL | Ya en uso. Sin cambios |
| ORM / acceso a datos | Prisma 5 | Ya en uso. Su `distinct` con `orderBy` compuesto resuelve "última posición por turno" en una consulta, sin SQL crudo |
| Auth | NextAuth v4 (Credentials + JWT) con `@next-auth/prisma-adapter` | Ya en uso. Los roles se leen del token y se comparan inline, como en el resto del proyecto |
| Trabajo en segundo plano | Ninguno en runtime; la purga es un script manual `npm run ubicaciones:purgar` | Un cron gestionado o una cola serían infraestructura nueva para una tarea que corre una vez al mes |
| Pagos | NOT APPLICABLE — este cambio no toca pagos | — |
| Almacenamiento de archivos | NOT APPLICABLE — este cambio no sube archivos | — |
| Email / notificaciones | NOT APPLICABLE — este cambio no notifica | — |
| Tiles de mapa | OpenStreetMap (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`) con atribución estándar | Sin API key, sin facturación, costo cero. Se rechazó Mapbox por requerir cuenta y token en el bundle del cliente |
| Hosting | Vercel, auto-deploy desde GitHub `Klaudio-krimen/viflomax` al hacer push a `main` | Ya configurado. No se introduce CI: `.github/` no existe y agregarlo es alcance separado |
| Gestor de paquetes | npm | Es lo que el repositorio usa (`package-lock.json`) |

### Advertencia de compatibilidad — react-leaflet 5 no sirve aquí

`react-leaflet@5.0.0` es el dist-tag `latest`, pero sus peers son
`{"react":"^19.0.0","react-dom":"^19.0.0"}` — **incompatibles con React 18**, que es lo que este
proyecto usa. **El comando de instalación debe pinear `react-leaflet@4.2.1` de forma exacta; un
`npm i react-leaflet` a secas instala la versión rota.** Los peers verificados de `4.2.1` son
`{"leaflet":"^1.9.0","react":"^18.0.0","react-dom":"^18.0.0"}`. `@react-leaflet/core@2.1.0` se
resuelve de forma transitiva y **nunca** se pinea directamente. Esta advertencia se repite en §11 y
en §20.2 porque es el único punto del build donde un comando plausible instala algo que no compila.

### Compatibility check

Verificado contra `knowledge/stack-compatibility.md` y contra los peers publicados de cada paquete:
la única combinación conocida como mala es `react-leaflet@5` con React 18, y este blueprint la evita
pineando `4.2.1` de forma exacta. El resto de la pila es la del repositorio, ya en producción.

---

## 3. Directory Structure

Sólo se listan los archivos que este cambio crea o edita, más los que lee y no debe tocar. El
repositorio completo es mucho mayor y no se reproduce aquí: dibujar árboles de archivos existentes
invita a "corregirlos".

```
viflomax/
  prisma/
    schema.prisma                      # EDITA: modelo Ubicacion + relación inversa en Turno
    migrations/                        # EDITA: baseline (paso 1) + migración de Ubicacion (paso 2)
    backfill-bodegas.sql               # LEE: SQL histórico aplicado a mano, se conserva como registro
    migrate-inventario-phase2.sql      # LEE: idem
  lib/
    ubicaciones.ts                     # NUEVO: helpers puros — validarCoordenadas, minutosDesde, frescuraSenal
    ubicaciones.test.ts                # NUEVO: pruebas Jest de los helpers
    useUbicacionPing.ts                # NUEVO: hook de captura con watchPosition
    utils/index.ts                     # EDITA: IndexedDB v2, aplicarUpgradeIndexedDB, helpers de ubicaciones
    utils/indexeddb-upgrade.test.ts    # NUEVO: prueba de la migración v1→v2
    types/index.ts                     # LEE: ApiResponse<T> / ApiListResponse<T>
    prisma.ts                          # LEE: cliente Prisma singleton
    auth/middleware.ts                 # LEE, NO TOCAR: ya bloquea a visor fuera de /admin/pedidos
    precios/calcular.test.ts           # LEE: el único test existente — es el estilo a imitar
  app/
    api/ubicaciones/route.ts           # NUEVO: POST, uno o lote, 409 sin turno activo
    api/ubicaciones/activas/route.ts   # NUEVO: GET, última posición por turno activo
    api/ubicaciones/turno/[id]/route.ts# NUEVO: GET, trayecto ordenado del turno
    api/turnos/route.ts                # LEE, CONGELADO
    api/turnos/[id]/route.ts           # LEE, CONGELADO
    chofer/layout.tsx                  # EDITA: monta UbicacionTracker como hijo cliente
    admin/flota/page.tsx               # NUEVO: página de servidor, rol admin, mapa + tabla accesible
  components/
    chofer/UbicacionTracker.tsx        # NUEVO: consentimiento + indicador permanente
    chofer/TurnoBanner.tsx             # LEE, CONGELADO
    admin/MapaFlota.tsx                # NUEVO: componente Leaflet puro cliente
    admin/FlotaClient.tsx              # NUEVO: polling 15 s, tres estados, dynamic import
    admin/Sidebar.tsx                  # EDITA: entrada "Flota" en navItems (nunca en VISOR_HREFS)
  scripts/
    purgar-ubicaciones.mjs             # NUEVO: retención 90 días
    seed-admin.mjs                     # LEE: define la convención .mjs de este directorio
  next.config.mjs                      # EDITA: headers() con Permissions-Policy
  package.json                         # EDITA: deps de leaflet (paso 13) + script de purga (paso 16)
  package-lock.json                    # EDITA: lo actualiza npm
  jest.config.js                       # LEE, NO TOCAR: jsdom + moduleNameMapper '^@/(.*)$'
  CLAUDE.md                            # llega desde workspace/ del bundle (§19.1)
  AGENTS.md                            # llega desde workspace/ del bundle (§19.2)
  .claude/settings.json                # llega desde workspace/ del bundle (§19.3)
  blueprints/rastreo-gps-choferes/     # este bundle, dentro del proyecto
```

**Reglas de frontera**

- `lib/ubicaciones.ts` no importa Prisma, React ni nada de `next`. Lo consumen handlers de servidor
  **y** componentes cliente; una sola importación de servidor ahí rompe el bundle del cliente.
- `app/api/**/route.ts` importa `@/lib/prisma` y `next-auth/jwt`; nunca importa componentes React.
- Los componentes marcados `"use client"` nunca importan `@/lib/prisma`.
- `app/chofer/layout.tsx` es un componente de servidor **asíncrono** y no puede contener hooks: el
  tracker se monta como hijo cliente.
- El alias `@/` apunta a la raíz del proyecto. Está declarado en `tsconfig.json` y replicado en
  `jest.config.js` (`moduleNameMapper: {'^@/(.*)$': '<rootDir>/$1'}`). Es una **convención de
  resolución** y su reconciliación por contexto está en §19.6, en la *Matriz de convención de
  resolución* — no se decide aquí.

**Origen de cada archivo del árbol.** Todo archivo marcado NUEVO o EDITA lo escribe un paso de §9 y
figura por nombre en su lista **Do** y en el `files[]` de su tarea en `tasks.json`. Los tres archivos
que llegan desde `workspace/` (`CLAUDE.md`, `AGENTS.md`, `.claude/settings.json`) los pone la copia
guardada de §10, antes del paso 1. No hay ningún archivo en este árbol sin uno de esos dos orígenes.

---

## 4. Data Model

### Entidades

**`Ubicacion`** — una posición GPS registrada por el navegador de un chofer durante un turno. Nace
cuando el hook envía un ping y muere a los 90 días con la purga, o antes si su turno se borra.

| Campo | Tipo | Restricciones | Notas |
|---|---|---|---|
| `id` | `String` | PK, `@default(uuid())` | Igual que el resto de los modelos del proyecto |
| `turno_id` | `String` | FK → `Turno.id`, not null | La posición sólo existe dentro de un turno; no hay ubicaciones huérfanas por diseño |
| `latitud` | `Decimal` | `@db.Decimal(10, 7)`, not null | 7 decimales ≈ 1 cm de resolución. Misma convención que `Entrega.latitud` |
| `longitud` | `Decimal` | `@db.Decimal(10, 7)`, not null | Idem |
| `precision_m` | `Float?` | opcional | El `accuracy` que reporta el navegador, en metros. Opcional porque no todo dispositivo lo entrega |
| `origen` | `String` | `@default("app")` | Deja espacio a un origen futuro sin migración; hoy siempre `"app"` |
| `registrado_en` | `DateTime` | `@default(now())` | **Marca de tiempo del servidor, nunca del cliente.** Un cliente con el reloj mal configurado no puede desordenar el trayecto |

**`Turno`** — existente, congelado en su lógica. Sólo se le agrega la relación inversa
`ubicaciones Ubicacion[]`.

### Relaciones

`Turno —(1:N)→ Ubicacion`, con `onDelete: Cascade`. El cascade es deliberado: si un turno se borra,
sus posiciones se van con él. Sin cascade, quedarían filas apuntando a un turno inexistente y el
mapa dibujaría "marcadores fantasma" que ninguna consulta puede explicar.

`Chofer —(1:N)→ Turno` y `Bodega —(1:N)→ Turno` ya existen y no cambian. La cadena completa que
recorre la vista de flota es `Ubicacion → Turno → { Chofer.nombre, Bodega.patente }`.

### Índices

| Tabla | Índice | Por qué |
|---|---|---|
| `Ubicacion` | `(turno_id, registrado_en)` | Sirve las dos únicas consultas del sistema: el trayecto ordenado de un turno, y el `distinct: ['turno_id']` con `orderBy` compuesto que devuelve la última posición de cada turno activo |

### Schema

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

Y en el modelo `Turno` existente se agrega una sola línea:

```prisma
  ubicaciones  Ubicacion[]
```

### Migraciones

Herramienta: Prisma Migrate. **Nunca se escribe a mano el nombre de un archivo de migración** —
Prisma lo genera con marca de tiempo y nombre, y el blueprint se refiere a él como "la migración que
emite `npx prisma migrate dev`".

El repositorio arrastra un defecto que el paso 1 corrige antes de agregar nada: `prisma/migrations/`
contiene exactamente una migración (`20260528033152_init`, 14 tablas), y tres modelos del schema vivo
— **`Bodega`, `Turno` y `TransferenciaStock`** — no tienen ninguna, porque se aplicaron a mano con
`prisma/backfill-bodegas.sql` y `prisma/migrate-inventario-phase2.sql`. El paso 1 prueba primero que
la base viva ya coincide con el schema (deriva cero), luego genera una migración baseline y la marca
como aplicada con `npx prisma migrate resolve --applied`. Eso requiere `SHADOW_DATABASE_URL`, **sólo
en el paso 1**: no es variable de runtime y no se agrega a Vercel.

Regla de producción: expandir y después contraer. Este cambio es puramente aditivo — una tabla nueva
y una relación inversa — así que no hay paso destructivo que ordenar respecto del deploy de código.

### Seed data

No se agrega seed nuevo. `scripts/seed-admin.mjs` sigue siendo el único, y no crea ubicaciones: una
base local usable se obtiene abriendo `/chofer` con un turno activo y aceptando el rastreo, que es
además la forma de probar el flujo completo end to end.

---

## 5. API Design

### Convenciones

- Base path: `/api` — es la convención existente del proyecto; no hay versionado en la URL.
- Envelope de respuesta: `ApiResponse<T>` y `ApiListResponse<T>`, las uniones discriminadas de
  `lib/types/index.ts`. Éxito y error usan la misma forma; no se inventa una nueva.
- Códigos de error usados por estas rutas: `401` sin sesión · `403` rol insuficiente · `400`
  coordenadas o cuerpo inválidos · `404` turno inexistente · `409` sin turno activo · `201` inserción
  exitosa · `200` lectura exitosa.
- Validación: manual, en el handler, usando `validarCoordenadas` de `lib/ubicaciones.ts`. El proyecto
  no usa Zod y este cambio no lo introduce.
- Paginación: NOT APPLICABLE — las tres rutas devuelven conjuntos acotados por naturaleza (una fila
  por turno activo, o el trayecto de un turno).
- Idempotencia: no se usan claves de idempotencia. Un ping duplicado es una fila más, y el modelo lo
  tolera sin ambigüedad porque la marca de tiempo la pone el servidor.
- Rate limits: ninguno nuevo. El throttle de 2 minutos vive en el cliente; el servidor no lo impone,
  y esa asimetría está registrada en §20.2 como riesgo aceptado.

### Rutas

| Método | Path | Qué hace | Auth | Rate limit |
|---|---|---|---|---|
| `POST` | `/api/ubicaciones` | Registra una posición o un lote de posiciones del turno activo del usuario | sesión; rol `chofer` (un `admin` con turno activo también puede) | ninguno |
| `GET` | `/api/ubicaciones/activas` | Última posición de cada turno activo, con nombre de chofer y patente | rol `admin` | ninguno |
| `GET` | `/api/ubicaciones/turno/[id]` | Trayecto completo y ordenado de un turno | rol `admin` | ninguno |

### Endpoints críticos — detalle completo

**`POST /api/ubicaciones`**

Request — un objeto o un array de objetos con esta forma:

```json
{ "latitud": -33.5107, "longitud": -70.7576, "precision_m": 12.4 }
```

Reglas, en orden de evaluación:

1. Sin token de sesión → `401`, cero filas escritas.
2. Se resuelve `Chofer` por `user_id` del token. Sin `Chofer` asociado → `403`.
3. Se busca `Turno` con ese `chofer_id` y `estado: 'activo'`. Sin turno → **`409`** con
   `{ success: false, error: 'Sin turno activo' }`, cero filas escritas. Éste es el código que el
   cliente usa para dejar de enviar.
4. Cada par de coordenadas pasa por `validarCoordenadas`. Una sola inválida → `400`, cero filas
   escritas (el lote es atómico en la validación).
5. Un objeto → `create`. Un array → `createMany` en una sola llamada.
6. Respuesta `201` con `{ success: true, data: { insertadas: N } }`.

`registrado_en` **nunca** se toma del cuerpo. Es `@default(now())` del servidor.

**`GET /api/ubicaciones/activas`**

Sin sesión → `401`. Rol distinto de `admin` → `403`. La consulta es exactamente ésta:

```ts
prisma.ubicacion.findMany({
  where: { turno: { estado: 'activo' } },
  distinct: ['turno_id'],
  orderBy: [{ turno_id: 'asc' }, { registrado_en: 'desc' }],
  include: { turno: { select: { chofer: { select: { nombre: true } }, bodega: { select: { patente: true } } } } },
})
```

El `orderBy` debe llevar `turno_id` primero y `registrado_en` descendente después: así `distinct`
conserva la fila más reciente de cada grupo. Invertir el orden devuelve una fila arbitraria del grupo
y el mapa muestra posiciones viejas como si fueran actuales, sin error visible.

Antes de serializar, `latitud` y `longitud` se convierten con `Number()`. Prisma devuelve objetos
`Decimal` para columnas `@db.Decimal`, y un `Decimal` serializado directamente produce
`{"s":1,"e":1,"d":[...]}` en el JSON — el mapa no dibuja nada y no hay ningún error. El proyecto ya
hace esta conversión para `Pedido.monto_total`.

**`GET /api/ubicaciones/turno/[id]`**

Sin sesión → `401`. Rol distinto de `admin` → `403`. Turno inexistente → `404` explícito, no una
excepción no controlada. Devuelve todas las ubicaciones del turno ordenadas por `registrado_en`
**ascendente**, que es el orden que consume una `Polyline` de Leaflet. Coordenadas convertidas con
`Number()`.

### Interfaces congeladas

Estas superficies existen hoy y este cambio no las modifica. Cada una tiene su fila espejo en la
tabla de no-objetivos de §1.

| Interfaz | Lo que se mantiene exactamente igual |
|---|---|
| `GET /api/turnos` | Forma de respuesta, códigos y autorización. El rastreo la lee y nunca la escribe |
| `POST /api/entregas` | Sin cambios de ningún tipo |
| `Entrega.latitud` / `Entrega.longitud` | Siguen siendo `Decimal(10,7)` opcionales, escritas por el flujo de entregas |
| Store IndexedDB `entregas_pendientes` | Mismo nombre y misma forma al pasar la base de v1 a v2 |
| Autorización de todo `/admin/*` | Mismos redirects y mismos roles; `/admin/flota` hereda las reglas existentes |
| Valores de `User.role` | `'admin' \| 'chofer' \| 'publico' \| 'visor'`, sin agregados |

---

## 6. Frontend Architecture

### Rutas

| Ruta | Página | Fuente de datos | Auth |
|---|---|---|---|
| `/chofer/*` | Layout existente, ahora con `UbicacionTracker` montado | El tracker consulta el turno activo y envía a `POST /api/ubicaciones` | sesión de chofer |
| `/admin/flota` | Nueva página de flota: mapa + tabla accesible | `GET /api/ubicaciones/activas`, polling cada 15 s | rol `admin` |

### Estrategia de renderizado

`app/admin/flota/page.tsx` es un **componente de servidor**: verifica `token.role === 'admin'` inline
y renderiza `FlotaClient`. `FlotaClient` es `"use client"` y carga el mapa con
`dynamic(() => import('./MapaFlota'), { ssr: false, loading: () => <esqueleto> })`. Leaflet toca
`window` al importarse, así que sin `ssr: false` el build de servidor muere con
`window is not defined` en un archivo que se ve inocente.

`app/chofer/layout.tsx` sigue siendo un componente de servidor **asíncrono**. El tracker es su hijo
cliente. El layout no cambia de naturaleza y no gana ningún hook.

### Jerarquía de componentes

```
app/admin/flota/page.tsx                 [servidor] verifica rol admin inline
  └── components/admin/FlotaClient.tsx   [cliente]  setInterval 15 s, 3 estados
        ├── <TablaFlota>                 [cliente]  tabla accesible, una fila por chofer
        └── dynamic(MapaFlota, ssr:false)
              └── components/admin/MapaFlota.tsx  [cliente] MapContainer, TileLayer OSM,
                                                            Marker con L.divIcon inline

app/chofer/layout.tsx                    [servidor async] auth + header + <main>
  └── components/chofer/UbicacionTracker.tsx  [cliente] tarjeta de consentimiento + indicador
        └── lib/useUbicacionPing.ts            [hook]   watchPosition + throttle 2 min
```

### Manejo de estado

Estado de servidor: ninguno persistido en el cliente. `FlotaClient` guarda en `useState` la última
respuesta buena y la conserva ante un fallo de fetch. `UbicacionTracker` guarda el consentimiento en
`localStorage` y nada más. No se introduce ninguna librería de fetching ni de estado global: el
proyecto no tiene una y tres componentes no justifican agregarla. La marca de tiempo del throttle
vive en un `useRef`, deliberadamente fuera del estado de React, porque cambiarla no debe re-renderizar.

### Estados de carga, vacío y error

`FlotaClient` tiene los tres, explícitos y distintos:

1. **Cargando** — esqueleto, mientras el import dinámico y el primer fetch resuelven.
2. **Vacío** — tarjeta con texto cuando no hay ningún chofer en turno. Nunca un mapa en blanco: un
   mapa vacío es indistinguible de un mapa roto.
3. **Error de fetch** — se **mantienen** renderizadas las últimas posiciones buenas, detrás de un
   banner ámbar delgado con el texto de reconexión. Vaciar el mapa ante un fallo transitorio de red
   hace que el operador crea que todos los choferes desaparecieron.

`UbicacionTracker` tiene dos: sin consentimiento (tarjeta explicativa) y rastreando (indicador
permanente). Sin turno activo no renderiza nada.

---

## 7. Design System

**La regla de gobierno, escrita textual porque se va a citar:** *usar el `DESIGN.md` de Viflomax
donde habla, y el registro Stitch de flota donde calla.*

La página vive dentro del shell `/admin` existente, así que su **chrome** — tipografía, cards,
fondos, botones — sigue el `DESIGN.md` raíz de Viflomax. El **tratamiento del mapa** — marcadores
pulsantes, panel flotante sobre el mapa — sigue el registro Stitch "Fleet Ops" de
`viflomax/fleet-dashboard/.stitch/DESIGN.md`, porque el `DESIGN.md` raíz no dice nada sobre
componentes de mapa en vivo. **El `DESIGN.md` raíz prohíbe gradientes y sombras decorativas, y esa
prohibición se respeta también en el mapa.**

### Colores

| Token | Valor | Uso |
|---|---|---|
| `--primary` | `#6ab04c` | Botones primarios, estado activo, borde de foco |
| `--secondary` | `#4db8e8` | Enlaces, acentos |
| `--background` | `#f9fafb` | Fondo de página |
| `--surface` | `#ffffff` | Cards, paneles, el panel flotante del mapa |
| `--border` | `#e5e7eb` | Divisores, contornos de inputs y de la tabla |
| `--fg` | `#111827` | Texto de cuerpo |
| `--fg-muted` | `#6b7280` | Texto secundario, marcas de tiempo |
| `--senal-fresca` | `#10b981` | Marcador con señal de menos de 5 minutos |
| `--senal-vieja` | `#f59e0b` | Marcador con señal de menos de 20 minutos; banner "Reconectando…" |
| `--senal-sin` | `#ef4444` | Marcador sin señal (20 minutos o más); errores |

**Contraste:** los tres pares más riesgosos, medidos: `#111827` sobre `#f9fafb` = 16.1:1 (texto de
cuerpo, exige 4.5:1) · `#6b7280` sobre `#ffffff` = 4.83:1 (texto secundario, exige 4.5:1) ·
`#f59e0b` sobre `#111827` = 8.0:1 (texto del banner ámbar sobre fondo oscuro, exige 4.5:1). Los tres
pasan WCAG 2.2 AA. Los colores de señal **nunca** se usan como único portador de información: cada
marcador y cada fila de la tabla llevan además el texto de la frescura.

### Tipografía

| Rol | Familia | Tamaño / interlineado | Peso | Tracking |
|---|---|---|---|---|
| Título de página | Outfit (`font-outfit`) | 1.875rem / 2.25rem | 600 | -0.02em |
| Encabezado de sección | Outfit (`font-outfit`) | 1.25rem / 1.75rem | 600 | -0.01em |
| Cuerpo | Nunito (`font-nunito`) | 1rem / 1.5rem | 400 | 0 |
| Etiqueta de marcador y tabla | Nunito (`font-nunito`) | 0.875rem / 1.25rem | 600 | 0 |

**Carga de fuentes:** ambas ya están cargadas por el proyecto mediante `next/font` con
`display: swap`. Este cambio no agrega ninguna fuente ni toca la configuración existente.

### Espaciado, radio, elevación

- Escala de espaciado: base 4px, rampa Tailwind por defecto — 4, 8, 12, 16, 24, 32, 48, 64. Sin
  valores arbitrarios.
- Radio: `rounded-xl` (12px) en cards y en el panel flotante del mapa; `rounded-lg` (8px) en botones;
  `rounded-full` en el punto del marcador.
- Sombras: `shadow-sm` en cards. Nada más. `DESIGN.md` prohíbe sombras decorativas y gradientes.
- Ancho máximo de contenido: 1280px. Breakpoints: los de Tailwind (`sm` 640, `md` 768, `lg` 1024,
  `xl` 1280).
- Altura del mapa: `24rem` en móvil, `36rem` desde `md` hacia arriba.

### Motion

Transiciones de 150ms `ease-out` para hover y foco. El pulso del marcador de señal fresca es una
animación de 2s en bucle sobre `transform: scale` y `opacity` únicamente. Todo respeta
`prefers-reduced-motion: reduce`: bajo esa media query el pulso se desactiva y el marcador queda
estático, conservando su color. **Los keyframes del pulso van en un bloque `<style>` inline dentro de
`MapaFlota.tsx`**, porque Leaflet inserta el HTML del `divIcon` fuera del árbol de React y una clase
aplicada por React no lo alcanza.

### Estilo de componente

Superficies planas y claras sobre `#f9fafb`, bordes de 1px en vez de sombras, esquinas de 12px,
tipografía Outfit para títulos y Nunito para todo lo demás. Un componente nuevo pertenece a este
sistema si se puede describir sin usar las palabras "gradiente", "glow" o "glassmorphism". El único
elemento con movimiento es el marcador de señal fresca, y su movimiento comunica un estado, no
decora. Referencia analizada: el registro Stitch "Fleet Ops" en
`viflomax/fleet-dashboard/.stitch/DESIGN.md`, del que se toma únicamente el tratamiento del mapa.

---

## 8. Authentication & Authorization

### Proveedor y justificación

NextAuth v4 con provider Credentials y estrategia JWT, más `@next-auth/prisma-adapter`. Ya está en
producción en este proyecto y este cambio no lo toca. Introducir un proveedor distinto para tres
rutas nuevas sería una migración de autenticación disfrazada de feature.

### Flujos

Sin cambios. Login, cierre de sesión, expiración de sesión y recuperación son los existentes. Los
tres flujos nuevos son de **autorización**, no de autenticación:

- **Chofer envía posición.** Token con `sub` → `Chofer` por `user_id` → `Turno` con `estado: 'activo'`
  → inserta. Sin token, 401. Sin `Chofer`, 403. Sin turno activo, **409** — y el cliente deja de
  enviar hasta que haya turno.
- **Admin ve la flota.** Token con `role === 'admin'` → consulta. Cualquier otro rol, 403 en la API;
  el middleware existente además redirige antes de llegar a la página.
- **Visor intenta ver la flota.** El middleware existente en `lib/auth/middleware.ts` permite a
  `visor` únicamente `/admin/pedidos` y `/admin/pedidos/[id]`, y redirige todo lo demás a
  `/admin/pedidos`. `/admin/flota` cae en "todo lo demás" sin escribir una línea nueva. El paso 15
  verifica que sigue siendo así después de crear la ruta.

### Protección de rutas

| Superficie | Regla | Dónde se aplica |
|---|---|---|
| `/chofer/*` | autenticado, rol `chofer` | `app/chofer/layout.tsx` (existente) |
| `/admin/flota` | rol `admin`; `visor` redirigido a `/admin/pedidos` | `lib/auth/middleware.ts` (existente, sólo lectura) + chequeo inline en `app/admin/flota/page.tsx` |
| `POST /api/ubicaciones` | sesión + `Chofer` asociado + turno activo | `app/api/ubicaciones/route.ts` |
| `GET /api/ubicaciones/activas` | rol `admin` | `app/api/ubicaciones/activas/route.ts` |
| `GET /api/ubicaciones/turno/[id]` | rol `admin` | `app/api/ubicaciones/turno/[id]/route.ts` |

**Regla de aplicación:** la autorización se verifica en el servidor en cada request. El chequeo del
middleware es un redirect de conveniencia; el chequeo que decide es el del handler. Un item de
navegación oculto no es un permiso — por eso la entrada "Flota" fuera de `VISOR_HREFS` es una mejora
de UX y **no** el control de acceso.

### Roles y permisos

| Rol | Puede | No puede |
|---|---|---|
| `admin` | Ver `/admin/flota`, consultar `/api/ubicaciones/activas` y `/api/ubicaciones/turno/[id]`; enviar posición si tiene turno activo | — |
| `chofer` | Enviar posición durante su turno activo | Ver la flota, consultar posiciones de otros |
| `visor` | Sólo `/admin/pedidos` y `/admin/pedidos/[id]`, como hoy | Ver `/admin/flota` ni ninguna ruta de ubicaciones |
| `publico` | Nada de este cambio | Todo lo anterior |

Los roles son strings planos en `User.role` y se comparan **inline** en cada handler
(`token.role !== 'admin'`). No existe `requireRole()` y crearlo es un no-objetivo declarado.

### Sesiones

JWT de NextAuth en cookie `HttpOnly`, `Secure` en producción, `SameSite=Lax`, con la vida útil y el
refresco que el proyecto ya configura. CSRF lo maneja NextAuth para sus propias rutas; las rutas
nuevas son de API con sesión por token y no procesan formularios HTML tradicionales.

### Multi-tenancy / aislamiento por fila

NOT APPLICABLE — Viflomax es una sola organización. El aislamiento relevante es por chofer, y lo
provee la cadena `token.sub → Chofer.user_id → Turno.chofer_id`: un chofer sólo puede escribir sobre
su propio turno activo porque el `turno_id` no viene del cliente, se resuelve en el servidor.

---

## 9. BUILD ORDER

### Step map

| # | Paso | Depende de | Toca | Gate |
|---|---|---|---|---|
| 1 | Baseline de migraciones — regularizar la deriva | — | `prisma/migrations/**` | deriva cero, luego `migrate status` exit 0 |
| 2 | Modelo `Ubicacion` + relación en `Turno` + migración | 1 | `prisma/schema.prisma`, `prisma/migrations/**` | `prisma validate`, `migrate status`, `migrate diff --exit-code` |
| 3 | `lib/ubicaciones.ts` — tres helpers puros | 2 | `lib/ubicaciones.ts` | `npm run build` + `npm run lint` |
| 4 | `lib/ubicaciones.test.ts` | 3 | `lib/ubicaciones.test.ts` | `npm test` exit 0, 0 fallidas |
| 5 | `POST /api/ubicaciones` — uno o lote, 409 sin turno | 2, 3 | `app/api/ubicaciones/route.ts` | build + servidor dev: POST anónimo = 401 |
| 6 | `GET /api/ubicaciones/activas` — patrón `distinct` | 5 | `app/api/ubicaciones/activas/route.ts` | build + GET anónimo = 401 |
| 7 | `GET /api/ubicaciones/turno/[id]` — trayecto ordenado | 5 | `app/api/ubicaciones/turno/[id]/route.ts` | build + GET anónimo = 401 |
| 8 | `next.config.mjs` → `headers()` con `Permissions-Policy` | — | `next.config.mjs` | build + `grep -qF` + cabecera en vivo |
| 9 | IndexedDB v2 — `aplicarUpgradeIndexedDB` + nuevo store | — | `lib/utils/index.ts`, `lib/utils/indexeddb-upgrade.test.ts` | `npm test` con prueba real de migración v1→v2 |
| 10 | `lib/useUbicacionPing.ts` — watchPosition + throttle 2 min | 3, 9 | `lib/useUbicacionPing.ts` | build + lint + `grep -qF clearWatch` |
| 11 | `components/chofer/UbicacionTracker.tsx` — consentimiento | 10 | ese archivo | build + lint + `grep -qF` |
| 12 | Montaje en `app/chofer/layout.tsx` | 11 | ese archivo | build + `grep -qF UbicacionTracker` |
| 13 | Instalar leaflet con pines + `components/admin/MapaFlota.tsx` | 3 | `package.json`, `package-lock.json`, ese archivo | build + pin exacto `react-leaflet` = `4.2.1` |
| 14 | `components/admin/FlotaClient.tsx` — polling 15 s, 3 estados | 6, 13 | ese archivo | build + lint + `grep -qF` |
| 15 | `app/admin/flota/page.tsx` + `Sidebar` + verificación `visor` | 14 | 2 archivos | build + `VISOR_HREFS` intacto + 307 en vivo |
| 16 | Retención 90 d + `npm run ubicaciones:purgar` | 4, 7, 8, 12, 15 | `scripts/purgar-ubicaciones.mjs`, `package.json` | script exit 0 dos veces + gate completo |

**16 pasos, 3 épicos** — `01-cimientos-e-ingesta` (1–6), `02-captura-en-terreno` (7–11),
`03-flota-y-operacion` (12–16). Legal según la regla de conteo: al menos `ceil(16÷9) = 2`, como
máximo `floor(16÷5) = 3`.

**Ordenamiento.** Los pasos 1 y 2 arreglan y extienden la capa de datos. Los pasos 3 a 7 construyen
la rebanada vertical del servidor y la prueban con un endpoint **ejecutado en vivo** en el paso 5 —
el primer paso que produce una superficie servida es también el primero que la invoca, no sólo la
compila. El paso 8 coloca `Permissions-Policy` **antes** de cualquier código que pida geolocalización:
un archivo cuyo propósito es cambiar lo que un comando posterior ve va antes de ese comando. Los
pasos 9 a 12 son la captura en el terreno; 13 a 15, la vista de flota; 16 cierra con retención.

---

#### Step 1 — Regularizar la deriva de migraciones con un baseline

**Do**
`prisma/migrations/` contiene exactamente una migración (`20260528033152_init`, 14 tablas). Tres
modelos del schema vivo — `Bodega`, `Turno` y `TransferenciaStock` — no tienen migración: se
aplicaron a mano con `prisma/backfill-bodegas.sql` y `prisma/migrate-inventario-phase2.sql`, que
siguen en el repositorio y se conservan como registro histórico.

Primero prueba deriva cero. Después crea el directorio de migración con
`npx prisma migrate dev --create-only --name baseline_bodegas_turnos_transferencias`, escribe en su
`migration.sql` el SQL que emite `npx prisma migrate diff` para esos tres modelos, y márcalo como
aplicado con `npx prisma migrate resolve --applied <nombre_del_directorio>`. **Nunca escribas el
nombre del directorio de memoria**: es el que Prisma acaba de generar con marca de tiempo.

Requiere `SHADOW_DATABASE_URL` apuntando a una base vacía `viflomax_shadow` en la misma instancia —
sólo en este paso.

- `prisma/migrations/**` — el directorio de migración baseline que emite Prisma

**Done when**
- [ ] CUANDO `npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --exit-code` corre antes de crear la migración baseline EL SISTEMA DEBERÁ salir con código 0, probando que la base viva ya coincide con `prisma/schema.prisma`.
- [ ] CUANDO `npx prisma migrate status` corre después del baseline EL SISTEMA DEBERÁ salir con código 0 y no reportar migraciones pendientes ni deriva.
- [ ] CUANDO se inspecciona el SQL de la migración baseline EL SISTEMA DEBERÁ contener las sentencias `CREATE TABLE` de `Bodega`, `Turno` y `TransferenciaStock`, que hasta ahora no tenían migración.
- [ ] CUANDO `npm run build` corre al final del paso EL SISTEMA DEBERÁ salir con código 0.

**Verify**
```bash
npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --exit-code
# expect: exit 0 — 0 = sin diferencias · 2 = hay deriva · 1 = error de la herramienta
npx prisma migrate status   # expect: exit 0, sin migraciones pendientes
npm run build               # expect: exit 0
```

**Checkpoint**
```bash
git add -A && git commit -m "step 1: baseline-migraciones"
git tag step-01-baseline-migraciones
git ls-files --error-unmatch prisma/migrations   # expect: exit 0 — ya comiteado en la línea anterior
```

---

#### Step 2 — Agregar el modelo Ubicacion y su migración

**Do**
Agrega a `prisma/schema.prisma` el modelo `Ubicacion` exactamente como está escrito en §4, y la línea
`ubicaciones Ubicacion[]` en el modelo `Turno`. Genera la migración con
`npx prisma migrate dev --name ubicaciones` y no la edites a mano.

`Decimal(10, 7)` es la convención que ya usa `Entrega.latitud` / `Entrega.longitud` en este
repositorio. `onDelete: Cascade` evita marcadores fantasma en el mapa. `@@index([turno_id,
registrado_en])` sirve las dos únicas consultas del sistema (§4, *Índices*).

- `prisma/schema.prisma` — modelo nuevo + relación inversa
- `prisma/migrations/**` — la migración que emite `npx prisma migrate dev`

**Done when**
- [ ] CUANDO `npx prisma validate` corre EL SISTEMA DEBERÁ salir con código 0 con el modelo `Ubicacion` declarado y la relación `ubicaciones Ubicacion[]` presente en `Turno`.
- [ ] CUANDO se lee el modelo `Ubicacion` EL SISTEMA DEBERÁ declarar `latitud` y `longitud` como `Decimal @db.Decimal(10, 7)`, igual que `Entrega`, y `registrado_en` como `DateTime @default(now())`.
- [ ] CUANDO se lee el modelo `Ubicacion` EL SISTEMA DEBERÁ declarar `@@index([turno_id, registrado_en])` y `onDelete: Cascade` en la relación con `Turno`.
- [ ] CUANDO `npx prisma migrate status` corre después de aplicar la migración EL SISTEMA DEBERÁ salir con código 0 y no reportar migraciones pendientes.
- [ ] CUANDO `npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --exit-code` corre después de la migración EL SISTEMA DEBERÁ salir con código 0, probando cero deriva.

**Verify**
```bash
npx prisma validate         # expect: exit 0
npx prisma migrate status   # expect: exit 0, sin pendientes
npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --exit-code
# expect: exit 0 — deriva cero tras aplicar la migración
npm run build               # expect: exit 0
```

**Checkpoint**
```bash
git add -A && git commit -m "step 2: modelo-ubicacion"
git tag step-02-modelo-ubicacion
git ls-files --error-unmatch prisma/schema.prisma   # expect: exit 0
```

---

#### Step 3 — Crear lib/ubicaciones.ts con tres helpers puros

**Do**
Tres funciones puras, sin ninguna dependencia:

- `validarCoordenadas(lat: unknown, lng: unknown): boolean` — `typeof === 'number'`,
  `Number.isFinite`, latitud en `[-90, 90]`, longitud en `[-180, 180]`.
- `minutosDesde(fecha: Date | string, ahora?: Date): number` — diferencia en minutos. `ahora` es
  parámetro para que las pruebas no dependan del reloj.
- `frescuraSenal(fecha: Date | string, ahora?: Date): 'fresca' | 'vieja' | 'sin_senal'` — menos de 5
  minutos, menos de 20, o el resto.

**`frescuraSenal` debe realmente decidir el color del marcador** en los pasos 13 y 15. Un helper
exportado que nadie llama es un paso incompleto.

El archivo no importa Prisma, React ni nada de `next`: lo consumen handlers de servidor y componentes
cliente por igual.

- `lib/ubicaciones.ts`

**Done when**
- [ ] CUANDO se importa `lib/ubicaciones.ts` EL SISTEMA DEBERÁ exportar `validarCoordenadas`, `minutosDesde` y `frescuraSenal`.
- [ ] CUANDO `validarCoordenadas(lat, lng)` recibe un valor que no es `number`, o no es finito, o una latitud fuera de [-90, 90], o una longitud fuera de [-180, 180] EL SISTEMA DEBERÁ retornar `false`.
- [ ] CUANDO `frescuraSenal(fecha, ahora)` recibe una fecha de hace menos de 5 minutos EL SISTEMA DEBERÁ retornar `'fresca'`; de menos de 20 minutos, `'vieja'`; en cualquier otro caso, `'sin_senal'`.
- [ ] CUANDO se lee `lib/ubicaciones.ts` EL SISTEMA DEBERÁ no importar Prisma, React ni ningún módulo de `next`, para que el archivo sea usable desde servidor y cliente.
- [ ] CUANDO `npm run build` y `npm run lint` corren EL SISTEMA DEBERÁ salir con código 0 en ambos.

**Verify**
```bash
npm run build   # expect: exit 0 — next build corre tsc, así que esto es el chequeo de tipos
npm run lint    # expect: exit 0
```

**Checkpoint**
```bash
git add -A && git commit -m "step 3: helpers-ubicaciones"
git tag step-03-helpers-ubicaciones
git ls-files --error-unmatch lib/ubicaciones.ts   # expect: exit 0
```

---

#### Step 4 — Escribir las pruebas unitarias de los helpers

**Do**
Imita `lib/precios/calcular.test.ts` — es el único test que existe hoy y define el estilo del
proyecto. Jest 29 con `ts-jest`, entorno jsdom, alias `@/` ya resuelto en `jest.config.js`. **No se
agrega ninguna dependencia y no se toca la configuración de Jest.** Pasa siempre `ahora` explícito a
`minutosDesde` y `frescuraSenal`.

- `lib/ubicaciones.test.ts`

**Done when**
- [ ] CUANDO `npm test -- lib/ubicaciones.test.ts` corre EL SISTEMA DEBERÁ salir con código 0 con 0 pruebas fallidas y 0 omitidas.
- [ ] CUANDO se leen las pruebas EL SISTEMA DEBERÁ cubrir para `validarCoordenadas` al menos los casos: coordenada válida de Maipú, `NaN`, `null`, latitud 91 y longitud -181.
- [ ] CUANDO se leen las pruebas EL SISTEMA DEBERÁ cubrir para `frescuraSenal` los tres bordes: 4 minutos, 19 minutos y 21 minutos, pasando `ahora` explícito para que la prueba no dependa del reloj.
- [ ] CUANDO `npm test` corre sobre todo el proyecto EL SISTEMA DEBERÁ salir con código 0 con 0 pruebas fallidas.

**Verify**
```bash
npm test -- lib/ubicaciones.test.ts   # expect: exit 0, 0 fallidas, 0 omitidas
npm test                              # expect: exit 0, 0 fallidas
```

**Checkpoint**
```bash
git add -A && git commit -m "step 4: tests-helpers"
git tag step-04-tests-helpers
git ls-files --error-unmatch lib/ubicaciones.test.ts   # expect: exit 0
```

---

#### Step 5 — Crear POST /api/ubicaciones con lote y 409 sin turno

**Do**
Handler de servidor según el detalle completo de §5. Sesión con `getToken` de `next-auth/jwt`;
`Chofer` por `user_id`; `Turno` con `estado: 'activo'`; **409** sin turno activo. Valida cada par de
coordenadas con `validarCoordenadas` del paso 3 antes de tocar Prisma. Acepta un objeto o un array
(vaciado de la cola offline) y usa `createMany` para el array. Envelope `ApiResponse` de
`lib/types/index.ts`. `registrado_en` nunca viene del cliente.

- `app/api/ubicaciones/route.ts`

**Done when**
- [ ] CUANDO llega un `POST /api/ubicaciones` sin sesión EL SISTEMA DEBERÁ responder 401 y no escribir ninguna fila.
- [ ] CUANDO llega un `POST /api/ubicaciones` de un usuario cuyo `Chofer` no tiene ningún `Turno` con `estado = 'activo'` EL SISTEMA DEBERÁ responder 409 con `{ success: false, error: 'Sin turno activo' }` y no escribir ninguna fila.
- [ ] CUANDO el cuerpo trae `latitud` o `longitud` que `validarCoordenadas` rechaza EL SISTEMA DEBERÁ responder 400 y no escribir ninguna fila.
- [ ] CUANDO el cuerpo es un array de pings EL SISTEMA DEBERÁ insertarlos con `createMany` en una sola llamada y responder 201 con la cantidad insertada.
- [ ] CUANDO se inserta un ping EL SISTEMA DEBERÁ tomar `registrado_en` del valor por defecto del servidor y nunca de una marca de tiempo enviada por el cliente.

**Verify**
```bash
npm run build   # expect: exit 0
npm run lint    # expect: exit 0
# Levanta el servidor dev, espera hasta 120 s, mide el código de un POST anónimo y lo apaga.
# Sale 0 sólo si el código es exactamente 401 → la ruta está montada Y el guard está activo.
mkdir -p ./.tmp; npm run dev > ./.tmp/viflomax-dev.log 2>&1 & DEV_PID=$!; for i in $(seq 1 60); do curl -s -o /dev/null http://localhost:3000/ && break; sleep 2; done; CODE=$(curl -s -o /dev/null -w '%{http_code}' -X POST http://localhost:3000/api/ubicaciones -H 'Content-Type: application/json' -d '{"latitud":-33.5,"longitud":-70.76}'); kill $DEV_PID 2>/dev/null || true; test "$CODE" = 401
# Chequeos estructurales: las ramas 409 y de lote no son alcanzables sin sesión,
# así que se asertan sobre el código. Sin esto, un handler que ignore el turno
# activo o inserte en bucle pasaría el gate anterior sin que nadie lo note.
grep -qF "createMany" app/api/ubicaciones/route.ts        # expect: exit 0 — el lote no se inserta en bucle
grep -qF "Sin turno activo" app/api/ubicaciones/route.ts  # expect: exit 0 — la rama 409 existe
grep -qF "validarCoordenadas" app/api/ubicaciones/route.ts # expect: exit 0 — se valida en el borde
grep -qF "409" app/api/ubicaciones/route.ts               # expect: exit 0 — el código 409 se emite
```

**Checkpoint**
```bash
git add -A && git commit -m "step 5: post-ubicaciones"
git tag step-05-post-ubicaciones
git ls-files --error-unmatch app/api/ubicaciones/route.ts   # expect: exit 0
```

---

#### Step 6 — Crear GET /api/ubicaciones/activas con distinct

**Do**
Rol `admin` inline. La consulta es exactamente la de §5, *Endpoints críticos*: `distinct: ['turno_id']`
con `orderBy: [{ turno_id: 'asc' }, { registrado_en: 'desc' }]` e `include` de `chofer.nombre` y
`bodega.patente`. Convierte `latitud` y `longitud` con `Number()` antes de responder. Envelope
`ApiListResponse`.

- `app/api/ubicaciones/activas/route.ts`

**Done when**
- [ ] CUANDO llega un `GET /api/ubicaciones/activas` sin sesión EL SISTEMA DEBERÁ responder 401.
- [ ] CUANDO llega un `GET /api/ubicaciones/activas` de un usuario con rol distinto de `admin` EL SISTEMA DEBERÁ responder 403.
- [ ] CUANDO un administrador consulta la ruta EL SISTEMA DEBERÁ retornar exactamente una fila por cada `Turno` con `estado = 'activo'` que tenga ubicaciones, usando `distinct: ['turno_id']` con `orderBy` `[{ turno_id: 'asc' }, { registrado_en: 'desc' }]`.
- [ ] CUANDO se serializa la respuesta EL SISTEMA DEBERÁ convertir `latitud` y `longitud` con `Number()` de modo que ningún campo sea un objeto `Decimal`.
- [ ] CUANDO se arma cada fila EL SISTEMA DEBERÁ incluir el nombre del chofer y la patente de la bodega asociadas al turno.

**Verify**
```bash
npm run build   # expect: exit 0
npm run lint    # expect: exit 0
mkdir -p ./.tmp; npm run dev > ./.tmp/viflomax-dev.log 2>&1 & DEV_PID=$!; for i in $(seq 1 60); do curl -s -o /dev/null http://localhost:3000/ && break; sleep 2; done; CODE=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/ubicaciones/activas); kill $DEV_PID 2>/dev/null || true; test "$CODE" = 401
# Chequeos estructurales: la respuesta con datos exige sesión admin, imposible de
# fabricar en un gate. Estas dos fallas son silenciosas si nadie las asserta —
# un orderBy invertido muestra posiciones viejas y un Decimal sin Number() no dibuja nada.
grep -qF "distinct" app/api/ubicaciones/activas/route.ts        # expect: exit 0
grep -qF "registrado_en: 'desc'" app/api/ubicaciones/activas/route.ts  # expect: exit 0 — la más reciente primero
grep -qF "Number(" app/api/ubicaciones/activas/route.ts         # expect: exit 0 — Decimal serializado como número
grep -qF "patente" app/api/ubicaciones/activas/route.ts         # expect: exit 0 — la patente viaja al mapa
```

**Checkpoint**
```bash
git add -A && git commit -m "step 6: get-activas"
git tag step-06-get-activas
git ls-files --error-unmatch app/api/ubicaciones/activas/route.ts   # expect: exit 0
```

---

#### Step 7 — Crear GET /api/ubicaciones/turno/[id] con el trayecto

**Do**
Ruta dinámica de sólo lectura, rol `admin` inline. Devuelve todas las ubicaciones del turno ordenadas
por `registrado_en` **ascendente**, listas para una `Polyline`. Turno inexistente → 404 explícito.
Coordenadas con `Number()`. Envelope `ApiListResponse`.

- `app/api/ubicaciones/turno/[id]/route.ts`

**Done when**
- [ ] CUANDO llega un `GET /api/ubicaciones/turno/[id]` sin sesión EL SISTEMA DEBERÁ responder 401.
- [ ] CUANDO llega un `GET /api/ubicaciones/turno/[id]` de un usuario con rol distinto de `admin` EL SISTEMA DEBERÁ responder 403.
- [ ] CUANDO un administrador consulta un turno existente EL SISTEMA DEBERÁ retornar todas sus ubicaciones ordenadas por `registrado_en` ascendente, listas para alimentar una `Polyline`.
- [ ] CUANDO un administrador consulta un `id` de turno que no existe EL SISTEMA DEBERÁ responder 404 y no lanzar una excepción no controlada.
- [ ] CUANDO se serializa la respuesta EL SISTEMA DEBERÁ convertir `latitud` y `longitud` con `Number()`.

**Verify**
```bash
npm run build   # expect: exit 0
npm run lint    # expect: exit 0
mkdir -p ./.tmp; npm run dev > ./.tmp/viflomax-dev.log 2>&1 & DEV_PID=$!; for i in $(seq 1 60); do curl -s -o /dev/null http://localhost:3000/ && break; sleep 2; done; CODE=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/ubicaciones/turno/00000000-0000-0000-0000-000000000000); kill $DEV_PID 2>/dev/null || true; test "$CODE" = 401
# Chequeos estructurales: el trayecto con datos exige sesión admin. Un orden
# descendente dibuja la Polyline al revés y un Decimal sin Number() la deja vacía,
# ambos sin error visible.
grep -qF "registrado_en: 'asc'" -- 'app/api/ubicaciones/turno/[id]/route.ts'   # expect: exit 0 — cronológico para la Polyline
grep -qF "Number(" -- 'app/api/ubicaciones/turno/[id]/route.ts'                # expect: exit 0
grep -qF "404" -- 'app/api/ubicaciones/turno/[id]/route.ts'                    # expect: exit 0 — turno inexistente no revienta
```

**Checkpoint**
```bash
git add -A && git commit -m "step 7: get-trayecto"
git tag step-07-get-trayecto
git ls-files --error-unmatch -- ':(literal)app/api/ubicaciones/turno/[id]/route.ts'
# expect: exit 0 — ':(literal)' evita que los corchetes se interpreten como glob
```

---

#### Step 8 — Agregar headers() con Permissions-Policy geolocation

**Do**
`next.config.mjs` **no tiene `headers()` en absoluto** hoy. Agrega una función `headers()` asíncrona
que aplique `Permissions-Policy: geolocation=(self)` a `/:path*`, dentro del objeto de configuración,
**antes** de envolverlo con `@ducanh2912/next-pwa`.

Este paso va antes de cualquier código que pida geolocalización, por la misma razón por la que un
archivo de ignore va antes del primer commit: un archivo cuyo propósito es cambiar el comportamiento
de un comando posterior debe estar en su lugar antes de ese comando.

**No agregues `Content-Security-Policy`** — es un no-objetivo declarado en §1.

- `next.config.mjs`

**Done when**
- [ ] CUANDO se lee `next.config.mjs` EL SISTEMA DEBERÁ exponer una función `headers()` asíncrona que aplica a la ruta `/:path*`.
- [ ] CUANDO el servidor responde a cualquier ruta EL SISTEMA DEBERÁ incluir la cabecera `Permissions-Policy: geolocation=(self)`.
- [ ] CUANDO se lee `next.config.mjs` EL SISTEMA DEBERÁ no declarar ninguna cabecera `Content-Security-Policy`, porque el proyecto no tiene CSP y agregarla mal rompería Cloudinary y el service worker.
- [ ] CUANDO `npm run build` corre EL SISTEMA DEBERÁ salir con código 0 y la envoltura de `@ducanh2912/next-pwa` DEBERÁ seguir aplicada sobre la configuración exportada.

**Verify**
```bash
npm run build                                      # expect: exit 0
grep -qF 'geolocation=(self)' next.config.mjs      # expect: exit 0 — la cabecera está declarada
mkdir -p ./.tmp; npm run dev > ./.tmp/viflomax-dev.log 2>&1 & DEV_PID=$!; for i in $(seq 1 60); do curl -s -o /dev/null http://localhost:3000/ && break; sleep 2; done; curl -sI http://localhost:3000/ > ./.tmp/viflomax-headers.txt; kill $DEV_PID 2>/dev/null || true; grep -qi 'permissions-policy: geolocation=(self)' ./.tmp/viflomax-headers.txt
# expect: exit 0 — la cabecera llega de verdad en la respuesta, no sólo está escrita en el archivo
```

**Checkpoint**
```bash
git add -A && git commit -m "step 8: permissions-policy"
git tag step-08-permissions-policy
git ls-files --error-unmatch next.config.mjs   # expect: exit 0
```

---

#### Step 9 — Migrar IndexedDB a v2 con store de ubicaciones

**Do**
`lib/utils/index.ts` tiene el `onupgradeneeded` **inline** dentro de `abrirDB()`, lo que lo hace
imposible de probar. Extrae esa lógica a `aplicarUpgradeIndexedDB(db, oldVersion)` exportada, que
sólo dependa de `objectStoreNames.contains` y `createObjectStore` — así un objeto falso escrito a
mano en Jest la prueba **sin agregar ninguna dependencia**. `abrirDB()` la llama desde su
`onupgradeneeded`.

Sube `DB_VERSION` a `2` y agrega `createObjectStore('ubicaciones_pendientes', { autoIncrement: true })`.
Agrega `guardarUbicacionOffline`, `obtenerUbicacionesPendientes` y `sincronizarUbicaciones`,
espejando `guardarEntregaOffline`, `obtenerEntregasPendientes` y `sincronizarEntregas`.
`sincronizarUbicaciones` envía el lote completo en un solo `POST /api/ubicaciones`.

- `lib/utils/index.ts`
- `lib/utils/indexeddb-upgrade.test.ts`

**Done when**
- [ ] CUANDO se lee `lib/utils/index.ts` EL SISTEMA DEBERÁ exportar `aplicarUpgradeIndexedDB(db, oldVersion)` extraída del `onupgradeneeded` que hoy está inline en `abrirDB()`, y `DB_VERSION` DEBERÁ valer 2.
- [ ] CUANDO `aplicarUpgradeIndexedDB` recibe un objeto que ya contiene `entregas_pendientes` y `oldVersion` igual a 1 EL SISTEMA DEBERÁ crear `ubicaciones_pendientes` y no volver a crear `entregas_pendientes`.
- [ ] CUANDO `aplicarUpgradeIndexedDB` recibe un objeto sin ningún store y `oldVersion` igual a 0 EL SISTEMA DEBERÁ crear tanto `entregas_pendientes` como `ubicaciones_pendientes`.
- [ ] CUANDO se lee `lib/utils/index.ts` EL SISTEMA DEBERÁ exportar `guardarUbicacionOffline`, `obtenerUbicacionesPendientes` y `sincronizarUbicaciones`, con la misma forma que los helpers existentes de entregas.
- [ ] CUANDO `npm test -- lib/utils/indexeddb-upgrade.test.ts` corre EL SISTEMA DEBERÁ salir con código 0 con 0 pruebas fallidas y 0 omitidas.

**Verify**
```bash
npm test -- lib/utils/indexeddb-upgrade.test.ts   # expect: exit 0, 0 fallidas, 0 omitidas
npm test                                          # expect: exit 0, 0 fallidas
npm run build                                     # expect: exit 0
```

**Checkpoint**
```bash
git add -A && git commit -m "step 9: indexeddb-v2"
git tag step-09-indexeddb-v2
git ls-files --error-unmatch lib/utils/indexeddb-upgrade.test.ts   # expect: exit 0
```

---

#### Step 10 — Crear el hook useUbicacionPing con watchPosition

**Do**
Un solo `navigator.geolocation.watchPosition` con
`{ enableHighAccuracy: true, maximumAge: 60000, timeout: 30000 }`. El throttle vive **en el sitio de
envío**: una marca de tiempo en `useRef` decide si esta lectura se manda o se descarta, con intervalo
de 2 minutos. Un ping extra se dispara de inmediato al activarse el rastreo. `clearWatch` en la
limpieza, siempre. Ante fallo de red o permiso denegado, encola con `guardarUbicacionOffline` del
paso 9 y degrada en silencio. Al recuperar conexión, `sincronizarUbicaciones`.

Cadencia deliberadamente asimétrica: se **escribe** cada 2 minutos, se **lee** cada 15 segundos desde
el panel (paso 14). El costo lo paga el lector, no la batería del chofer.

- `lib/useUbicacionPing.ts`

**Done when**
- [ ] CUANDO el hook se activa EL SISTEMA DEBERÁ llamar a `navigator.geolocation.watchPosition` con `{ enableHighAccuracy: true, maximumAge: 60000, timeout: 30000 }` y enviar un ping inmediato.
- [ ] CUANDO llegan posiciones consecutivas EL SISTEMA DEBERÁ limitar los envíos a uno cada 2 minutos comparando contra una marca de tiempo guardada en un `useRef`, sin usar un temporizador propio.
- [ ] CUANDO el componente que usa el hook se desmonta o el hook se desactiva EL SISTEMA DEBERÁ llamar a `clearWatch` con el identificador devuelto por `watchPosition`.
- [ ] CUANDO el envío al servidor falla o el permiso está denegado EL SISTEMA DEBERÁ degradar en silencio: encolar el ping con `guardarUbicacionOffline` y no lanzar ni mostrar un error bloqueante.
- [ ] CUANDO el hook vuelve a tener conexión EL SISTEMA DEBERÁ vaciar la cola llamando a `sincronizarUbicaciones`, que envía el lote en un solo `POST /api/ubicaciones`.
- [ ] CUANDO `npm run build` y `npm run lint` corren EL SISTEMA DEBERÁ salir con código 0 en ambos.

**Verify**
```bash
npm run build                              # expect: exit 0
npm run lint                               # expect: exit 0
grep -qF 'clearWatch' lib/useUbicacionPing.ts   # expect: exit 0 — la limpieza existe
```

**Checkpoint**
```bash
git add -A && git commit -m "step 10: hook-ping"
git tag step-10-hook-ping
git ls-files --error-unmatch lib/useUbicacionPing.ts   # expect: exit 0
```

---

#### Step 11 — Crear UbicacionTracker con consentimiento e indicador

**Do**
Componente cliente. Antes de que el prompt nativo se dispare siquiera una vez, muestra una tarjeta
explicativa; el hook del paso 10 queda desactivado hasta que el chofer acepta, y la decisión se
persiste en `localStorage`. Un prompt nativo denegado por sorpresa es irrecuperable sin que el
usuario vaya a la configuración del navegador.

El texto debe ser honesto en dos puntos verificables al leerlo: el rastreo ocurre **sólo durante un
turno activo**, y **se detiene cuando la aplicación se cierra** — es una PWA, `watchPosition` muere
con la pestaña. Mientras el rastreo está activo, un indicador permanente y visible lo dice. Sin turno
activo no renderiza nada.

Estilos según §7: `rounded-xl` + `shadow-sm`, `font-outfit` para el título, `font-nunito` para el
cuerpo, colores de señal `#10b981` / `#f59e0b` / `#ef4444`. Sin gradientes.

- `components/chofer/UbicacionTracker.tsx`

**Done when**
- [ ] CUANDO el chofer abre la aplicación y aún no ha aceptado EL SISTEMA DEBERÁ mostrar una tarjeta explicativa antes de disparar el prompt nativo del navegador, y el hook DEBERÁ permanecer desactivado hasta la aceptación.
- [ ] CUANDO el chofer acepta EL SISTEMA DEBERÁ persistir la decisión en `localStorage` y no volver a mostrar la tarjeta en visitas posteriores.
- [ ] CUANDO el rastreo está activo EL SISTEMA DEBERÁ mostrar un indicador permanente y visible mientras se comparte la ubicación.
- [ ] CUANDO se lee el texto de la tarjeta EL SISTEMA DEBERÁ declarar explícitamente que el rastreo sólo ocurre durante un turno activo y que se detiene cuando la aplicación se cierra.
- [ ] CUANDO el chofer no tiene turno activo EL SISTEMA DEBERÁ no renderizar el indicador ni activar el hook.
- [ ] CUANDO `npm run build` y `npm run lint` corren EL SISTEMA DEBERÁ salir con código 0 en ambos.

**Verify**
```bash
npm run build                                                    # expect: exit 0
npm run lint                                                     # expect: exit 0
grep -qF 'localStorage' components/chofer/UbicacionTracker.tsx   # expect: exit 0
grep -qF 'use client' components/chofer/UbicacionTracker.tsx     # expect: exit 0
```

**Checkpoint**
```bash
git add -A && git commit -m "step 11: tracker-consentimiento"
git tag step-11-tracker-consentimiento
git ls-files --error-unmatch components/chofer/UbicacionTracker.tsx   # expect: exit 0
```

---

#### Step 12 — Montar UbicacionTracker en el layout del chofer

**Do**
`app/chofer/layout.tsx` es un componente de servidor **asíncrono**: hace el chequeo de autenticación,
renderiza el header y `<main>{children}</main>`. No puede contener hooks. El cambio es de dos o tres
líneas: importar `UbicacionTracker` y renderizarlo junto al header. No toques el chequeo de
autenticación existente ni la estructura del `<main>`.

- `app/chofer/layout.tsx`

**Done when**
- [ ] CUANDO se lee `app/chofer/layout.tsx` EL SISTEMA DEBERÁ renderizar `UbicacionTracker` como hijo cliente, manteniendo el layout como componente de servidor asíncrono sin ningún hook.
- [ ] CUANDO un usuario sin sesión visita `/chofer` EL SISTEMA DEBERÁ seguir redirigiendo igual que antes, sin cambios en el chequeo de autenticación existente.
- [ ] CUANDO se lee el archivo EL SISTEMA DEBERÁ conservar intactos el header y el `<main>{children}</main>` que ya existían.
- [ ] CUANDO `npm run build` corre EL SISTEMA DEBERÁ salir con código 0 y no reportar el error de hooks en componente de servidor.

**Verify**
```bash
npm run build                                        # expect: exit 0
npm run lint                                         # expect: exit 0
grep -qF 'UbicacionTracker' app/chofer/layout.tsx    # expect: exit 0
```

**Checkpoint**
```bash
git add -A && git commit -m "step 12: montaje-chofer"
git tag step-12-montaje-chofer
git ls-files --error-unmatch app/chofer/layout.tsx   # expect: exit 0
```

---

#### Step 13 — Instalar leaflet con pines exactos y crear MapaFlota

**Do**
Instala con pines **exactos**, sin rango:

```bash
npm i leaflet@1.9.4 react-leaflet@4.2.1
npm i -D @types/leaflet@^1.9.22
```

`npm i react-leaflet` sin pin instala `5.0.0`, cuyos peers exigen React 19 (§2, §11, §20.2).
`@react-leaflet/core` se resuelve transitivamente y nunca se pinea directamente.

`MapaFlota.tsx` es puro cliente: importa `leaflet/dist/leaflet.css` **dentro del propio archivo**,
renderiza `MapContainer` + `TileLayer` de OpenStreetMap
(`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` con la atribución estándar) y un `Marker` por
posición con `L.divIcon` de HTML inline. El color sale de `frescuraSenal` del paso 3: `#10b981`,
`#f59e0b`, `#ef4444`. Los keyframes del pulso van en un `<style>` inline dentro del componente
(§7, *Motion*).

- `package.json`
- `package-lock.json`
- `components/admin/MapaFlota.tsx`

**Done when**
- [ ] CUANDO se lee `package.json` EL SISTEMA DEBERÁ declarar `react-leaflet` en la versión exacta `4.2.1`, sin rango, porque la `5.0.0` exige React 19 y este proyecto usa React 18.
- [ ] CUANDO se lee `package.json` EL SISTEMA DEBERÁ declarar `leaflet` en la versión exacta `1.9.4` y `@types/leaflet` como dependencia de desarrollo.
- [ ] CUANDO se lee `package.json` EL SISTEMA DEBERÁ no declarar `@react-leaflet/core` como dependencia directa, porque se resuelve de forma transitiva.
- [ ] CUANDO se lee `components/admin/MapaFlota.tsx` EL SISTEMA DEBERÁ importar `leaflet/dist/leaflet.css` dentro de ese archivo y usar `L.divIcon` con HTML inline para los marcadores, nunca el icono por defecto de Leaflet.
- [ ] CUANDO se renderiza un marcador EL SISTEMA DEBERÁ elegir su color llamando a `frescuraSenal`: `#10b981` para `'fresca'`, `#f59e0b` para `'vieja'` y `#ef4444` para `'sin_senal'`.
- [ ] CUANDO `npm run build` corre EL SISTEMA DEBERÁ salir con código 0.

**Verify**
```bash
node -e "const p=require('./package.json');if(p.dependencies['react-leaflet']!=='4.2.1'){console.error('react-leaflet debe estar pineado en 4.2.1');process.exit(1)};if(p.dependencies['leaflet']!=='1.9.4'){console.error('leaflet debe estar pineado en 1.9.4');process.exit(1)};if(p.dependencies['@react-leaflet/core']){console.error('@react-leaflet/core no debe ser dependencia directa');process.exit(1)}"
# expect: exit 0 — sale 1 con mensaje si algún pin está mal
grep -qF 'leaflet/dist/leaflet.css' components/admin/MapaFlota.tsx   # expect: exit 0
grep -qF 'divIcon' components/admin/MapaFlota.tsx                    # expect: exit 0
npm run build                                                        # expect: exit 0
npm run lint                                                         # expect: exit 0
```

**Checkpoint**
```bash
git add -A && git commit -m "step 13: leaflet-mapa"
git tag step-13-leaflet-mapa
git ls-files --error-unmatch package-lock.json   # expect: exit 0
```

---

#### Step 14 — Crear FlotaClient con polling de 15 s y tres estados

**Do**
El wrapper cliente. Carga el mapa con
`dynamic(() => import('./MapaFlota'), { ssr: false, loading: () => <esqueleto> })`. Refresca con un
`setInterval` de 15 segundos contra `GET /api/ubicaciones/activas` del paso 6, con bandera `cancelled`
y `clearInterval` en la limpieza para ser seguro bajo StrictMode. **Sin librerías de fetching** — el
proyecto no tiene ninguna.

Los tres estados de §6, *Estados de carga, vacío y error*: esqueleto, tarjeta de estado vacío con
texto, y error de fetch que **mantiene las últimas posiciones buenas** detrás de un banner ámbar
delgado.

- `components/admin/FlotaClient.tsx`

**Done when**
- [ ] CUANDO `FlotaClient` se monta EL SISTEMA DEBERÁ cargar `MapaFlota` con `dynamic(() => import('./MapaFlota'), { ssr: false })` mostrando un esqueleto mientras carga.
- [ ] CUANDO el componente está montado EL SISTEMA DEBERÁ consultar `GET /api/ubicaciones/activas` cada 15 segundos con `setInterval`, usando una bandera `cancelled` y llamando a `clearInterval` en la limpieza para ser seguro bajo StrictMode.
- [ ] CUANDO la respuesta llega vacía EL SISTEMA DEBERÁ mostrar una tarjeta de estado vacío con texto, nunca un mapa en blanco sin explicación.
- [ ] CUANDO una consulta falla EL SISTEMA DEBERÁ mantener renderizadas las últimas posiciones buenas y mostrar un banner ámbar delgado con el texto de reconexión.
- [ ] CUANDO `npm run build` y `npm run lint` corren EL SISTEMA DEBERÁ salir con código 0 en ambos.

**Verify**
```bash
npm run build                                                # expect: exit 0
npm run lint                                                 # expect: exit 0
grep -qF 'ssr: false' components/admin/FlotaClient.tsx       # expect: exit 0
grep -qF 'clearInterval' components/admin/FlotaClient.tsx    # expect: exit 0
```

**Checkpoint**
```bash
git add -A && git commit -m "step 14: flota-client"
git tag step-14-flota-client
git ls-files --error-unmatch components/admin/FlotaClient.tsx   # expect: exit 0
```

---

#### Step 15 — Crear /admin/flota y su entrada en el Sidebar

**Do**
`app/admin/flota/page.tsx` es un componente de servidor que verifica `token.role === 'admin'` inline y
renderiza `FlotaClient`. La entrada "Flota" se agrega al array `navItems` de
`components/admin/Sidebar.tsx` y **jamás** a `VISOR_HREFS`, que queda exactamente como está.

Junto al mapa va una **tabla accesible** con una fila por chofer en turno: nombre, patente, frescura
de señal y hora de la última posición (§15). Un mapa por sí solo no cumple WCAG 2.2 AA.

Éste es el momento en que la garantía de autorización se vuelve significativa: `/admin/flota` no
existía antes. `lib/auth/middleware.ts` es **sólo lectura** y ya redirige a `visor` fuera de
`/admin/pedidos`; los dos chequeos `node -e` del bloque Verify confirman que este paso no lo debilitó.

- `app/admin/flota/page.tsx`
- `components/admin/Sidebar.tsx`

**Done when**
- [ ] CUANDO un usuario sin sesión visita `/admin/flota` EL SISTEMA DEBERÁ responder 307 redirigiendo al login.
- [ ] CUANDO se lee `components/admin/Sidebar.tsx` EL SISTEMA DEBERÁ contener `/admin/flota` dentro de `navItems` y EL SISTEMA DEBERÁ no contenerlo dentro de `VISOR_HREFS`.
- [ ] CUANDO se lee `lib/auth/middleware.ts` EL SISTEMA DEBERÁ no mencionar `flota` en la lista de rutas permitidas al rol `visor`, de modo que el middleware existente siga redirigiendo a `visor` hacia `/admin/pedidos`.
- [ ] CUANDO se lee `app/admin/flota/page.tsx` EL SISTEMA DEBERÁ ser un componente de servidor que verifica `token.role === 'admin'` inline y renderiza `FlotaClient`.
- [ ] CUANDO se renderiza la página EL SISTEMA DEBERÁ incluir, junto al mapa, una tabla accesible con una fila por chofer en turno indicando nombre, patente, frescura de señal y hora de la última posición.

**Verify**
```bash
npm run build   # expect: exit 0
npm run lint    # expect: exit 0
# exit 1 = la propiedad se rompió · exit 3 = la estructura inspeccionada ya no existe
node -e "const s=require('fs').readFileSync('components/admin/Sidebar.tsx','utf8');const m=s.match(/VISOR_HREFS\s*=\s*\[([^\]]*)\]/);if(!m){console.error('VISOR_HREFS no encontrado');process.exit(3)};if(m[1].includes('/admin/flota')){console.error('/admin/flota no debe estar en VISOR_HREFS');process.exit(1)};if(!s.includes('/admin/flota')){console.error('/admin/flota debe estar en navItems');process.exit(1)}"
node -e "const s=require('fs').readFileSync('lib/auth/middleware.ts','utf8');if(!s.includes('visor')){console.error('el middleware ya no menciona visor');process.exit(3)};if(s.includes('flota')){console.error('flota no debe aparecer en el middleware de visor');process.exit(1)}"
mkdir -p ./.tmp; npm run dev > ./.tmp/viflomax-dev.log 2>&1 & DEV_PID=$!; for i in $(seq 1 60); do curl -s -o /dev/null http://localhost:3000/ && break; sleep 2; done; CODE=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/admin/flota); kill $DEV_PID 2>/dev/null || true; test "$CODE" = 307
# expect: exit 0 — anónimo es redirigido, la ruta existe y está protegida
```

**Checkpoint**
```bash
git add -A && git commit -m "step 15: pagina-flota"
git tag step-15-pagina-flota
git ls-files --error-unmatch app/admin/flota/page.tsx   # expect: exit 0
```

---

#### Step 16 — Agregar la purga de retención a 90 días

**Do**
`scripts/purgar-ubicaciones.mjs`, siguiendo la convención de `scripts/seed-admin.mjs`. Un solo
`deleteMany` sobre `Ubicacion` con `registrado_en` anterior a 90 días, imprime cuántas eliminó y sale
con código 0. Es idempotente por construcción.

El script npm es exactamente:

```json
"ubicaciones:purgar": "node --env-file=.env scripts/purgar-ubicaciones.mjs"
```

`--env-file=.env` **no es opcional**: Node no lee `.env` por sí solo, y sin esa bandera el script
muere al construir el `PrismaClient` con un error sobre `DATABASE_URL` que parece un problema de
entorno y no lo es. No se agrega `dotenv` ni ninguna otra dependencia — Node 20.6+ trae `--env-file`
de fábrica y `.nvmrc` ya fija Node 20.

Cuando este `Verify` pasa, corre el gate global de §20.1.

- `scripts/purgar-ubicaciones.mjs`
- `package.json`

**Done when**
- [ ] CUANDO `npm run ubicaciones:purgar` corre EL SISTEMA DEBERÁ salir con código 0 e imprimir la cantidad de filas de `Ubicacion` eliminadas.
- [ ] CUANDO el script corre EL SISTEMA DEBERÁ eliminar únicamente las filas con `registrado_en` anterior a 90 días y no tocar ninguna fila más reciente.
- [ ] CUANDO se lee `package.json` EL SISTEMA DEBERÁ definir el script `ubicaciones:purgar` como `node --env-file=.env scripts/purgar-ubicaciones.mjs`, sin agregar ninguna dependencia nueva.
- [ ] CUANDO el script corre dos veces seguidas EL SISTEMA DEBERÁ salir con código 0 ambas veces y reportar 0 eliminadas en la segunda.
- [ ] CUANDO `npm run build`, `npm run lint` y `npm test` corren al cerrar el paso EL SISTEMA DEBERÁ salir con código 0 en los tres, con 0 pruebas fallidas.

**Verify**
```bash
npm run ubicaciones:purgar   # expect: exit 0, imprime cuántas eliminó
npm run ubicaciones:purgar   # expect: exit 0, 0 eliminadas — idempotente
npm run build                # expect: exit 0
npm run lint                 # expect: exit 0
npm test                     # expect: exit 0, 0 fallidas
```

**Checkpoint**
```bash
git add -A && git commit -m "step 16: retencion-purga"
git tag step-16-retencion-purga
git ls-files --error-unmatch scripts/purgar-ubicaciones.mjs   # expect: exit 0
git tag -l 'step-*' | grep -c . | grep -qx 16
# expect: exit 0 — las 16 etiquetas de §9 existen tras este commit
```

---

### 9.1 Parity and cutover

NOT APPLICABLE — cambio aditivo sobre un sistema en producción; no se reemplaza ningún sistema en
marcha, no se retira ninguna ruta ni se migra ningún dato existente. Las superficies que **no** deben
cambiar están enumeradas en §1 (*Interfaces congeladas*) y en §5 (*Interfaces congeladas*), y su
preservación se verifica en los pasos 12 y 15, no mediante un período de sombra.

---

## 10. Environment Setup

### Prerequisites

| Herramienta | Versión | Chequeo |
|---|---|---|
| Node.js | ≥ v20.6.0 (fijada en `.nvmrc`) | `node -v` |
| npm | el que trae Node 20 | `npm -v` |
| git | cualquiera reciente | `git --version` |
| PostgreSQL accesible | la instancia existente del proyecto | `npx prisma migrate status` |

Node **20.6** es el mínimo real, no 20.0: `--env-file` aparece en esa versión y el script de purga
depende de él.

### Accounts to create first

Ninguna cuenta nueva. Los tiles son de OpenStreetMap, sin API key ni facturación. La base de datos,
GitHub y Vercel ya están configurados para este proyecto.

### Environment variables

| Variable | Propósito | Dónde se obtiene | Requerida desde el paso | ¿Secreta? |
|---|---|---|---|---|
| `DATABASE_URL` | Conexión de Prisma, app y CLI | Consola del proveedor de Postgres del proyecto | 1 | sí |
| `SHADOW_DATABASE_URL` | Base sombra vacía para `prisma migrate dev` | Base `viflomax_shadow` creada a mano en la misma instancia | 1 (y **sólo** ahí) | sí |
| `NEXTAUTH_SECRET` | Firma del JWT de sesión | Ya existe en el proyecto; se genera con `openssl rand -base64 32` | 5 | sí |
| `NEXTAUTH_URL` | URL base para NextAuth | Ya existe en el proyecto | 5 | no |

`SHADOW_DATABASE_URL` **no es variable de runtime y no se agrega a Vercel.** Sólo la lee el CLI de
Prisma durante el paso 1.

**"Requerida desde el paso" es un contrato con §9.** Ninguna variable se vuelve obligatoria antes del
paso indicado. Este cambio **no agrega ninguna validación de entorno al arranque**: hacerlo rompería
retroactivamente el gate de los pasos anteriores, que es exactamente lo que la regla 9 de §9 prohíbe.
Las variables existentes ya son leídas por el código existente, con el comportamiento existente.

**Listar una variable aquí no la carga.** Next.js lee `.env` para la aplicación. El **CLI de Prisma
lee `.env`, nunca `.env.local`** — es la confusión más frecuente en este repositorio. Y
`scripts/purgar-ubicaciones.mjs` no lee nada por sí solo: se ejecuta con `node --env-file=.env`. El
mecanismo por herramienta está en §19.6.

### Files that must be committed

| Archivo | ¿Lo excluye `.gitignore`? | Nota |
|---|---|---|
| `CLAUDE.md` | no | Llega desde `workspace/` |
| `AGENTS.md` | no | Llega desde `workspace/` |
| `.claude/settings.json` | no — el `.gitignore` del proyecto no tiene ningún patrón `.claude` | Llega desde `workspace/` |
| `package-lock.json` | no | Lo actualiza el paso 13 |
| `prisma/migrations/**` | no | Pasos 1 y 2 |
| `scripts/purgar-ubicaciones.mjs` | no | Paso 16 |

`.gitignore` ya existe en el repositorio, es correcto y **no coincide con ninguno de estos archivos**,
por lo que no hace falta ninguna línea de excepción. Como ya está en su lugar antes del primer commit
del Bootstrap, ningún archivo que deba quedar ignorado entra al índice.

### Bootstrap

**Sin base de datos.** Ningún comando de este bloque toca Postgres: todo lo que la requiere vive en
un paso de §9. Eso hace que el bloque completo corra dos veces seguidas en una máquina sin Postgres,
que es la condición que §20.1 verifica.

```bash
# el orden importa: repositorio → copia guardada del workspace → primer commit → instalación →
# cliente Prisma → chequeo de precondiciones → build. .gitignore ya existe y es correcto,
# así que no hay nada que escribir antes del primer commit.

# 1. Ubícate en la raíz del proyecto (el directorio que contiene package.json).
test -f package.json   # expect: exit 0 — si falla, estás en el directorio equivocado

# 2. Versión de Node. .nvmrc fija la línea mayor; un mayor distinto compila igual
#    pero silenciosamente, así que se falla temprano y con mensaje propio.
node -v | grep -qE "^v$(cat .nvmrc)\." || { echo "Node incorrecto: $(node -v), se espera la línea v$(cat .nvmrc).x de .nvmrc. Usa nvm/fnm antes de continuar."; exit 1; }

# 3. Repositorio: idempotente, no hace nada si ya existe.
git rev-parse --git-dir >/dev/null 2>&1 || git init -b main

# 4. Directorio de artefactos efímeros de los gates (logs del dev server, cabeceras).
#    Repo-relativo a propósito: /tmp no resuelve en PowerShell nativo en Windows.
mkdir -p ./.tmp
grep -qxF '.tmp/' .gitignore || echo '.tmp/' >> .gitignore

# 5. Copia guardada del workspace del bundle a la raíz del proyecto.
#    -n nunca sobrescribe: una vez instalado algo, package.json y package-lock.json
#    NO deben volver a su versión sin dependencias.
#    || true porque cp -Rn sale 1 en BSD/macOS cuando omite un archivo existente,
#    y omitir es exactamente el resultado deseado.
cp -Rn blueprints/rastreo-gps-choferes/workspace/. . || true

# 6. Un tag necesita un commit al cual apuntar.
git add -A && git commit -m "chore: workspace del blueprint" --allow-empty

# 7. Dependencias. Sin base de datos.
npm install

# 8. Cliente Prisma. NO toca la base de datos: sólo genera código desde el schema.
npx prisma generate

# 9. Precondiciones, sin llamar al driver.
grep -q '^DATABASE_URL=' .env || { echo "FALTA DATABASE_URL en .env — el CLI de Prisma lee .env, nunca .env.local. Créalo antes del paso 1."; exit 1; }
grep -q '^SHADOW_DATABASE_URL=' .env || { echo "AVISO: falta SHADOW_DATABASE_URL en .env. Sólo se necesita en el paso 1, para 'prisma migrate dev'. Crea una base vacía viflomax_shadow en la misma instancia."; true; }

# 10. Build completo. prisma generate && next build. Sin base de datos.
npm run build
```

Ningún `migrate`, ningún `migrate status`, ningún `migrate diff` aquí: todo eso es el paso 1.

---

## 11. Dependencies

Esta sección es la tabla de procedencia de versiones y es el **único** lugar del blueprint donde
aparece un número de versión en prosa.

### Runtime

| Paquete | Versión | Fuente | Verificado | Instalado por | Propósito |
|---|---|---|---|---|---|
| `leaflet` | `1.9.4` | https://registry.npmjs.org/leaflet | 2026-08-11 | paso 13 (`npm i leaflet@1.9.4 react-leaflet@4.2.1`) | La librería de mapas. Es la dependencia real; react-leaflet sólo la envuelve |
| `react-leaflet` | `4.2.1` | https://unpkg.com/react-leaflet@4.2.1/package.json | 2026-08-11 | paso 13 (`npm i leaflet@1.9.4 react-leaflet@4.2.1`) | Enlace React de Leaflet. **Pin exacto obligatorio:** `5.0.0` es el dist-tag `latest` y sus peers son `{"react":"^19.0.0","react-dom":"^19.0.0"}`, incompatibles con React 18. Peers verificados de `4.2.1`: `{"leaflet":"^1.9.0","react":"^18.0.0","react-dom":"^18.0.0"}` |

### Development

| Paquete | Versión | Fuente | Verificado | Instalado por | Propósito |
|---|---|---|---|---|---|
| `@types/leaflet` | `^1.9.22` | https://registry.npmjs.org/-/package/@types/leaflet/dist-tags | 2026-08-11 | paso 13 (`npm i -D @types/leaflet@^1.9.22`) | Tipos de Leaflet. Rango caret aceptable: sólo afecta el chequeo de tipos, no el runtime |

**Riesgo de obsolescencia, declarado:** `react-leaflet@4.2.1` se publicó el 2024-03-01 y `5.0.0` el
2024-12-14; no hay ningún release en ninguna de las dos líneas en ~20 meses. Está registrado en
§20.2 con su disparador de reversión.

Todo lo demás — Next.js, React, Prisma, NextAuth, Tailwind, Jest, `@ducanh2912/next-pwa` — ya está
instalado y pineado en `package-lock.json` del repositorio. Este blueprint **no cambia ninguna de
esas versiones** y por eso no las repite aquí: repetir un pin del lockfile en prosa crea una segunda
fuente de verdad que se desincroniza.

### Deliberately not used

| Rechazado | En su lugar | Por qué |
|---|---|---|
| `react-leaflet@5.x` | `react-leaflet@4.2.1` | Sus peers exigen React 19; este proyecto usa React 18 |
| `@react-leaflet/core` (como dep directa) | resolución transitiva vía `react-leaflet@4.2.1` | Pinearlo directamente desincroniza la versión que react-leaflet espera |
| `dotenv` | `node --env-file=.env` | Node 20.6+ lo trae de fábrica; `.nvmrc` ya fija Node 20 |
| `fake-indexeddb` | un objeto falso escrito a mano en el test | No pude verificar una versión estable en esta sesión, y la superficie que hay que probar son dos métodos |
| `vitest` | Jest 29 + ts-jest | Migrar es un no-objetivo declarado en §1 |
| `zod` | validación manual con `validarCoordenadas` | El proyecto no usa Zod; introducirlo para dos campos numéricos es una decisión de arquitectura, no un detalle de este cambio |
| `swr` / `@tanstack/react-query` | `setInterval` con bandera `cancelled` | El proyecto no tiene librería de fetching; tres componentes no justifican agregar una |
| Google Maps / Mapbox | OpenStreetMap | Requieren API key, cuenta y facturación por carga de mapa. OSM cuesta $0 |

---

## 12. Deployment Strategy

### Hosting

Vercel, con auto-deploy desde GitHub `Klaudio-krimen/viflomax` al hacer push a `main`. Ya
configurado. Comando de build: `npm run build` (`prisma generate && next build`). Directorio de
salida: el que Next.js gestiona por defecto. Runtime: Node 20, según `.nvmrc`.

Este cambio **no altera** ninguna configuración de Vercel salvo por lo que ya está desplegado. En
particular, `SHADOW_DATABASE_URL` **no se agrega** a las variables de entorno de Vercel.

### Environments

| Entorno | Rama | URL | Base de datos | Modo de terceros |
|---|---|---|---|---|
| Local | — | http://localhost:3000 | La Postgres del proyecto vía `DATABASE_URL` en `.env` | Tiles OSM reales (sin key) |
| Preview | cualquier PR | asignada por Vercel | La misma Postgres del proyecto | Tiles OSM reales |
| Producción | `main` | el dominio de producción del proyecto | La misma Postgres del proyecto | Tiles OSM reales |

Nota honesta: este proyecto no tiene bases de datos separadas por entorno. Es una limitación
preexistente, no algo que este cambio introduzca, y está registrada en §20.2.

### CI/CD

No hay CI: `.github/` no existe en el repositorio y agregarlo es alcance separado. El gate de §20.1
se corre **a mano** desde la raíz del proyecto antes de hacer push a `main`. Vercel construye y
despliega después del push; un fallo de build bloquea el despliegue pero no el push.

### Release and rollback

Promoción: push a `main` → build de Vercel → despliegue. Reversión: promover el despliegue anterior
desde el panel de Vercel, que es inmediato y no requiere rebuild. Para el código local, cada paso de
§9 dejó una etiqueta `step-NN-*`: `git reset --hard step-{N-1}-<slug>` es el objetivo de reversión.

Migraciones respecto del deploy: este cambio es puramente aditivo (una tabla nueva y una relación
inversa), así que la migración puede aplicarse antes del deploy de código sin romper la versión
anterior — la versión vieja simplemente ignora la tabla nueva.

### Domain, DNS, TLS

Sin cambios. El dominio, los certificados y las redirecciones son los que el proyecto ya tiene.

---

## 13. Testing Strategy

| Capa | Framework | Qué cubre | Dónde | Cuándo corre |
|---|---|---|---|---|
| Unitaria | Jest 29 + ts-jest (jsdom) | Los helpers puros de `lib/ubicaciones.ts` y la migración IndexedDB v1→v2 | `lib/ubicaciones.test.ts`, `lib/utils/indexeddb-upgrade.test.ts` | En cada paso que la toca y en el gate de §20.1 |
| Integración | Servidor de desarrollo + `curl` | Que cada ruta nueva está montada y su guard de autenticación responde 401/307 | Bloques `Verify` de los pasos 5, 6, 7, 8, 15 | En esos pasos |
| E2E | NOT APPLICABLE | No hay runner e2e en el proyecto y este cambio no introduce uno | — | — |

**Jest se queda.** Migrar a Vitest es un no-objetivo declarado en §1. `jest.config.js` ya existe
(jsdom, `moduleNameMapper: {'^@/(.*)$': '<rootDir>/$1'}`) y **no se toca**. `lib/precios/calcular.test.ts`
es el único test que existe hoy y es el estilo a imitar.

### Flujos críticos

1. Un chofer con turno activo envía una posición y aparece en el mapa de administración.
2. Un chofer sin turno activo recibe 409 y deja de enviar.
3. Una base IndexedDB v1 con entregas encoladas se actualiza a v2 sin perder ninguna.

Los tres se verifican como se puede verificar en este proyecto: los flujos 2 y 3 con pruebas
automáticas (paso 5 para el 409 vía la ruta, paso 9 para IndexedDB), y el flujo 1 a mano, en el
checklist de lanzamiento post-build de §20.1 — necesita un turno real, un dispositivo real y permiso
de geolocalización otorgado por una persona, y por lo tanto no puede ser un gate de build.

### Datos de prueba

Las pruebas unitarias no tocan la base de datos: son funciones puras y un objeto falso escrito a
mano. No hay base de datos de test que crear ni resetear, y por eso **§19.6 no emite ningún archivo
de servicio local**: ningún comando `Verify` del Bootstrap ni de las pruebas unitarias necesita
Postgres. Las verificaciones que sí la necesitan (pasos 1, 2, 16) usan la base del proyecto, que es
un prerrequisito brownfield documentado en §10.

### Qué no se prueba deliberadamente

El comportamiento real de `navigator.geolocation` y el renderizado real de Leaflet. Probar el primero
requiere un dispositivo con GPS y una persona otorgando permiso; el segundo requiere un navegador
headless con canvas. Ninguno de los dos se puede decidir con un script en esta máquina hoy, así que
sus verificaciones son estructurales (`grep -qF 'clearWatch'`, `grep -qF 'divIcon'`) y su prueba real
está en el checklist de lanzamiento de §20.1.

---

## 14. Security & Secrets

| Preocupación | Control | Implementado en |
|---|---|---|
| Almacenamiento de secretos | Variables de entorno en Vercel y `.env` local, nunca en el repositorio | §10; `.gitignore` existente |
| Rotación de secretos | `NEXTAUTH_SECRET` y `DATABASE_URL` se rotan desde el panel del proveedor; no hay secreto nuevo que rotar en este cambio | Panel de Vercel |
| Validación de entrada | `validarCoordenadas` en cada handler, antes de tocar Prisma | `app/api/ubicaciones/route.ts` |
| Codificación de salida / XSS | React escapa por defecto. **El HTML del `L.divIcon` se construye únicamente con literales del propio componente** — nunca con el nombre del chofer ni ningún otro dato de la base | `components/admin/MapaFlota.tsx` |
| Inyección SQL | Sólo consultas de Prisma, parametrizadas. Ningún SQL construido con strings | Todos los handlers |
| AuthN / AuthZ | Ver §8 — chequeo en el servidor en cada request, inline en cada handler | Los tres `route.ts` nuevos |
| CSRF | NextAuth para sus rutas; las rutas nuevas son de API con sesión por token y no procesan formularios HTML | NextAuth existente |
| Rate limiting / abuso | Ninguno nuevo. El throttle de 2 minutos es del cliente; el servidor no lo impone | Riesgo aceptado, §20.2 |
| Verificación de webhooks | NOT APPLICABLE — este cambio no recibe webhooks | — |
| Auditoría de dependencias | `npm audit` a mano antes de un release; no hay CI que lo automatice | Manual |
| Cabeceras de seguridad | `Permissions-Policy: geolocation=(self)` (paso 8). **Sin CSP** — no existe hoy y agregarla es un no-objetivo declarado | `next.config.mjs` |
| Manejo de PII | Las coordenadas de un trabajador durante su jornada son datos personales. Se guardan sólo con turno activo, se muestran sólo a `admin`, y se purgan a los 90 días | §4; `scripts/purgar-ubicaciones.mjs` |
| Higiene de logs | Ninguna coordenada, `DATABASE_URL` ni token se imprime en logs. El script de purga imprime únicamente un conteo | `scripts/purgar-ubicaciones.mjs` |

**Reglas duras**

- Ningún secreto se commitea, se imprime en un log, se manda a un rastreador de errores ni se
  embebe en el bundle del cliente.
- Toda verificación de autorización corre en el servidor **antes** del trabajo, no después.
- `SHADOW_DATABASE_URL` existe sólo en la máquina del desarrollador durante el paso 1 y jamás llega a
  Vercel.

**Régimen de datos regulados:** Chile tiene la Ley 19.628 sobre protección de la vida privada. El
rastreo de la ubicación de un trabajador durante su jornada requiere consentimiento informado y
finalidad acotada — por eso el consentimiento explícito del paso 11 con texto honesto, el indicador
permanente, el límite estricto al turno activo (409 fuera de turno) y la retención de 90 días no son
opcionales: son el cumplimiento.

---

## 15. Accessibility

**Objetivo: WCAG 2.2 nivel AA.**

### Requisitos base

| Requisito | Regla en este cambio |
|---|---|
| HTML semántico | `/admin/flota` tiene un `<h1>` único, la tabla es una `<table>` real con `<th scope="col">`, y el mapa vive dentro de una `<section>` con `aria-label` |
| **Alternativa al mapa** | **La página lleva, junto al mapa, una tabla accesible con una fila por chofer en turno: nombre, patente, frescura de señal y hora de la última posición. Un mapa por sí solo no es accesible** |
| Teclado | Todos los controles de la tarjeta de consentimiento y de la tabla son alcanzables y operables por teclado, en orden lógico. Los marcadores del mapa **no** son la única forma de llegar a la información |
| Foco visible | Anillo de foco de ≥3:1 contra su fondo en todo elemento enfocable, con el verde `#6ab04c` |
| Contraste | Los pares de §7 están medidos y pasan: 16.1:1, 4.83:1 y 8.0:1 |
| Formularios | La tarjeta de consentimiento tiene botones con texto explícito, no iconos solos |
| Imágenes | Los marcadores son `divIcon` con HTML: llevan `aria-hidden="true"`, porque la información equivalente está en la tabla |
| Movimiento | El pulso del marcador se desactiva bajo `prefers-reduced-motion: reduce` |
| Zoom / reflujo | La página es usable a 200% de zoom y a 320 CSS px de ancho sin scroll horizontal; el mapa tiene altura fija en `rem` y la tabla hace scroll dentro de su contenedor |
| Regiones vivas | El banner "Reconectando…" está en un contenedor con `role="status"`, para que un lector de pantalla anuncie el cambio |
| **Color no es el único canal** | La frescura de señal se comunica con **texto** en cada fila de la tabla y en el tooltip del marcador, no sólo con `#10b981` / `#f59e0b` / `#ef4444` |

### Adiciones de WCAG 2.2 más olvidadas

| SC | Requisito aquí |
|---|---|
| 2.4.11 Focus Not Obscured | El panel flotante del mapa nunca tapa por completo un elemento enfocado de la tabla |
| 2.5.7 Dragging Movements | El zoom y el paneo del mapa tienen alternativa de un solo puntero: los botones `+` / `−` de Leaflet, que se conservan |
| 2.5.8 Target Size | Los botones de la tarjeta de consentimiento y los controles de zoom miden al menos 24×24 CSS px |
| 3.3.7 Redundant Entry | El consentimiento se pide una sola vez y se recuerda en `localStorage` |
| 3.3.8 Accessible Authentication | Sin cambios en el login; no se agrega ningún test cognitivo |

### Verificación

No hay runner de accesibilidad automatizado en este proyecto y este cambio no introduce uno — sería
alcance separado. La verificación es estructural en el paso 15 (la tabla existe, con una fila por
chofer) y manual antes del lanzamiento: recorrido sólo con teclado de `/admin/flota`, una pasada de
lector de pantalla, y una pasada a 200% de zoom en el breakpoint más angosto. Está en el checklist de
§20.1.

---

## 16. Observability & Cost

### Instrumentación

| Señal | Herramienta | Qué captura | Quién lo mira |
|---|---|---|---|
| Errores de runtime | Logs de Vercel (los del proyecto) | Excepciones no controladas de los tres handlers nuevos | Administración técnica |
| Logs | `console.error` en los handlers, visible en Vercel | Fallos de Prisma y de autorización, sin coordenadas ni tokens | Administración técnica |
| Métricas | Consultas SQL a mano contra la tabla `Ubicacion` | Las tres métricas de abajo | Administración técnica, mensual |
| Uptime | El que Vercel ya provee | Disponibilidad del despliegue | Administración técnica |

No se agrega Sentry ni ninguna herramienta de observabilidad nueva: sería una cuenta más, una
dependencia más y alcance separado.

### Métricas que importan en este cambio

| Métrica | Objetivo | Alertar cuando |
|---|---|---|
| Filas en `Ubicacion` | < 500.000 | Supere 1.000.000 — señal de que la purga no se está corriendo |
| Turnos activos sin ninguna ubicación en la última hora | 0 durante horario de reparto | Sea ≥ 2 dos días seguidos — señal de que el consentimiento se está denegando |
| Frescura de señal en el panel | ≥ 70% de marcadores verdes | Caiga bajo 40% en horario de reparto |

### Health check

No se agrega endpoint de health nuevo. El chequeo operativo real es abrir `/admin/flota` y ver
marcadores frescos: verifica de una sola vez que la base responde, que la ruta funciona y que los
choferes están enviando. Es la única señal que importa para esta feature.

### Modelo de costo

| Servicio | Capa gratuita | Costo al volumen de v1 | Costo a 10× | Precipicio a vigilar |
|---|---|---|---|---|
| Tiles OpenStreetMap | Uso razonable sin key | $0 | $0 | La política de uso justo de OSM si el panel se dejara abierto en muchas pantallas todo el día |
| PostgreSQL (existente) | La del plan actual | ~240 filas por chofer por jornada; despreciable | ~10 MB/mes con 10 choferes | El límite de almacenamiento del plan si la purga deja de correrse |
| Vercel (existente) | El plan actual | $0 adicional | $0 adicional | Las invocaciones de función del polling de 15 s si hubiera muchos administradores mirando a la vez |

**Costo mensual adicional estimado en el lanzamiento: $0.** La partida más grande es cero porque los
tiles no se cobran; el único costo que puede crecer es el almacenamiento de `Ubicacion`, y la palanca
para cortarlo es la retención de 90 días del paso 16. Ningún servicio escala de forma superlineal con
el uso.

---

## 17. Model Routing

NOT APPLICABLE — este proyecto no llama a un LLM en runtime.

---

## 18. Skills to Use During Build

| Skill | Pasos de §9 | Por qué ahí | Instalación |
|---|---|---|---|
| `ui-ux-pro-max` | 11, 14, 15 | Concreta el tratamiento visual del indicador de rastreo, el panel de flota y los estados vacío/error, dentro de la paleta y la escala tipográfica ya fijadas en §7 | `/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill`<br>`/plugin install ui-ux-pro-max@ui-ux-pro-max-skill` |
| `frontend-design` | 11, 13, 14, 15 | Estructura de componentes y estados de UI de calidad de producción para el mapa y la tarjeta de consentimiento | `/plugin marketplace add anthropics/skills`<br>`/plugin install example-skills@anthropic-agent-skills` |
| `emil-design-eng` | 13 | Duraciones y easing del pulso del marcador, y el comportamiento bajo `prefers-reduced-motion` | `npx skills@latest add emilkowalski/skills` |

Los tres **auto-activan**: se nombran en prosa, no se invocan con `/`. Ninguno es una dependencia
dura — si uno no está disponible, el constructor sigue con las especificaciones de §7 y §15, lo
anota en una línea y continúa.

---

## 19. Agent Workspace

Los archivos de abajo se emiten como archivos reales bajo
`blueprints/rastreo-gps-choferes/workspace/`, y el Bootstrap de §10 copia el **contenido de ese
directorio** a la raíz del proyecto con una sola orden guardada
(`cp -Rn blueprints/rastreo-gps-choferes/workspace/. . || true`). La copia es no-destructiva a
propósito: una vez que `npm install` corrió, `package.json` y `package-lock.json` **nunca** deben
volver a su versión sin dependencias, y `|| true` está porque `cp -Rn` sale 1 en BSD/macOS cuando
omite un archivo existente — omitir es exactamente el resultado buscado, así que el guard no debe
hacer fallar el bloque bajo `set -e`.

**`.claude/commands/` no se emite**, en ningún caso. Un slash command sólo se dispara cuando un
humano lo escribe, y un constructor autónomo no escribe nada.

**Exclusión de la ruta del bundle: `n/a`, razonada.** El bundle vive dentro del proyecto, en
`blueprints/rastreo-gps-choferes/`, y §19.6 no emite ninguna config que camine el árbol de
directorios. Las únicas herramientas que caminan el árbol en este proyecto son `next lint`, que sólo
inspecciona archivos `.js/.jsx/.ts/.tsx` en los directorios de Next, y Jest, cuyo `testMatch` sólo
recoge archivos `*.test.ts`. El bundle contiene exclusivamente `.md` y `.json` — ni un `.ts`, ni un
`.tsx`, ni una segunda config raíz — por lo que ninguna de las dos lo ve. Se deja escrito para que un
lector futuro sepa que se consideró y no se olvidó.

### 19.1 `CLAUDE.md`

Emitido como `workspace/CLAUDE.md`. Contenido íntegro, bajo 200 líneas, comandos primero. Ver el
archivo real en `blueprints/rastreo-gps-choferes/workspace/CLAUDE.md`; su contenido es normativo y
este blueprint no lo duplica en prosa para que no existan dos copias que se desincronicen. Cubre:
comandos (incluida la nota de que **no existe `npm run typecheck`** y el gate es
`npm run build && npm run lint && npm test`), stack, camino de una petición de rastreo y de la vista
de flota, tabla de límites de importación, dónde vive cada cosa, nueve reglas de código, el sistema
de diseño con hexadecimales literales, la tabla de entorno y siete reglas no negociables.

### 19.2 `AGENTS.md`

Emitido como `workspace/AGENTS.md`. Stub tool-neutral para agentes que no leen `CLAUDE.md`: una línea
de descripción, la tabla de comandos, las seis reglas no negociables y el puntero a `CLAUDE.md` como
fuente de verdad. No es opcional: un agente que no sea Claude Code lee este archivo y ninguno más.

### 19.3 `.claude/settings.json`

Emitido como `workspace/.claude/settings.json`. **Contiene un `allow` para cada comando que aparece
en cada bloque `Verify` de §9 y en el gate de §20.1**: `npm install`, `npm run build`,
`npm run lint`, `npm test`, `npm run dev`, `npm run ubicaciones:purgar`, `npm i:*`,
`npx prisma validate|generate|format|migrate status|migrate dev|migrate diff|migrate resolve`,
`node --env-file=.env:*`, `node -e:*`, `curl:*`, `grep:*`, `test:*`, `seq:*`, `sleep:*`, `kill:*`,
`cp -Rn:*` y los subcomandos de git que el Bootstrap y los Checkpoints usan. Sin esas entradas, un
build desatendido se detiene en un prompt de permisos en cada gate.

`deny`: `Read(./.env)`, `Read(./.env.*)`, `git push:*`, `npx prisma migrate reset:*`,
`npx prisma db push:*`, `npx prisma db execute:*`. Los tres últimos son los comandos de Prisma que
pueden destruir la base de producción de este proyecto, que es la misma base en los tres entornos.

### 19.4 Project skills — `.claude/skills/<name>/SKILL.md`

NOT APPLICABLE — este cambio no introduce ningún flujo de trabajo repetible que justifique un skill
de proyecto. Los dos flujos candidatos ya están cubiertos: agregar una migración es
`npx prisma migrate dev --name <nombre>`, documentado en `CLAUDE.md`, y la purga es un script npm.
Un skill que sólo repite una línea de la tabla de comandos es peso muerto.

### 19.5 `.claude/rules/*.md`

NOT APPLICABLE — este cambio toca tres áreas (datos, API, UI) y las convenciones de cada una caben en
`CLAUDE.md`, que está muy por debajo del límite de 200 líneas. Emitir archivos de reglas diferidos
aquí fragmentaría en tres archivos lo que un constructor necesita saber en cada turno, sin ahorrar
contexto real.

### 19.6 Verify-critical config and local infrastructure

**No hay ninguna config nueva verify-crítica que emitir, y esto es una conclusión, no un olvido.**

| Config que un `Verify` necesita | ¿Existe ya? | Emitida en `workspace/` |
|---|---|---|
| Config del runner de tests | Sí — `jest.config.js` (jsdom, `moduleNameMapper: {'^@/(.*)$': '<rootDir>/$1'}`) funciona hoy con `lib/precios/calcular.test.ts` | No — no se toca |
| Config de runner e2e | No existe ninguno y este cambio no lo introduce | No aplica |
| Archivo de setup de tests | No hace falta: las pruebas son de funciones puras y de un objeto falso escrito a mano; ninguna lee variables de entorno | No aplica |
| Config de alias de rutas | Sí — `tsconfig.json` y `jest.config.js` ya declaran `@/` | No — no se toca |
| Compose file de servicios locales | No aplica: la Postgres es un prerrequisito brownfield documentado en §10, y **ningún comando del Bootstrap la toca** | No aplica |

Los tres archivos que sí se emiten (`CLAUDE.md`, `AGENTS.md`, `.claude/settings.json`) son
configuración de agente, no de gate, y están descritos en §19.1–§19.3.

#### Matriz de convención de resolución

La única convención de resolución de este proyecto es el alias `@/` → raíz del proyecto (§3).
Reconciliada contra cada contexto que carga módulos:

| Contexto | Resuelto por | Comando literal que lo ejercita | Ajuste que lo hace funcionar | ¿Verificado? |
|---|---|---|---|---|
| Código de aplicación | El resolvedor de Next.js / tsc | `npm run build` | `paths` en `tsconfig.json` — ya existe, no se toca | sí |
| Archivos de test | El resolvedor de Jest | `npm test` | `moduleNameMapper: {'^@/(.*)$': '<rootDir>/$1'}` en `jest.config.js` — ya existe, no se toca | sí |
| Scripts sueltos | El runtime de Node, **sin compilador y sin bundler** | `node --env-file=.env scripts/purgar-ubicaciones.mjs` | **Ninguno — y por eso el script es `.mjs` y NO usa `@/`.** Importa `@prisma/client` por nombre de paquete, que Node resuelve nativamente. Ésta es la decisión que evita el defecto: un script que usara `@/` moriría con módulo no encontrado, porque Node resuelve especificadores literalmente | sí |
| Build / bundle | El bundler de Next.js | `npm run build` | Mismo `paths` de `tsconfig.json`; el alias se resuelve en tiempo de build y no sobrevive al output | sí |
| Service worker (PWA) | `@ducanh2912/next-pwa` sobre el output de Next | `npm run build` | Consume el output ya resuelto; no ve especificadores `@/` | sí |

#### Carga de variables de entorno por herramienta

| Herramienta | ¿Lee env? | Mecanismo | Dónde aparece |
|---|---|---|---|
| Aplicación Next.js (`npm run dev`, `npm run build`) | sí | Next.js carga `.env` y `.env.local` de fábrica | §10 |
| CLI de Prisma (`validate`, `generate`, `migrate *`) | sí | El CLI de Prisma carga **`.env`**, nunca `.env.local`. Es la confusión más frecuente en este repositorio y está escrita en `CLAUDE.md` y en el aviso del Bootstrap | §10 Bootstrap paso 7, §9 pasos 1 y 2 |
| `scripts/purgar-ubicaciones.mjs` | sí | **Bandera del runner:** `node --env-file=.env`, presente en la definición del script npm y por lo tanto en **todos** sus sitios de llamada (§9 paso 16, §20.1, `CLAUDE.md`, `AGENTS.md`), porque todos invocan `npm run ubicaciones:purgar` | §9 paso 16 |
| Jest (`npm test`) | no | Ninguna prueba lee una variable de entorno: son funciones puras y un objeto falso | §13 |
| `curl`, `grep`, `node -e` de los gates | no | No leen ninguna variable | §9 |

#### Reconciliación de valores entre artefactos

| Valor | Fuente única | Dónde más aparece | ¿Comparado? |
|---|---|---|---|
| `4.2.1` (pin de `react-leaflet`) | §11, fila de `react-leaflet` | §2 advertencia, §9 paso 13 (comando y `node -e`), §20.2 riesgo, epic 03 | sí — idéntico en las 5 |
| `node --env-file=.env scripts/purgar-ubicaciones.mjs` | `package.json`, script `ubicaciones:purgar` (paso 16) | §9 paso 16, §19.6 tabla de env, §20.1, `CLAUDE.md`, `AGENTS.md`, epic 03 | sí — idéntico en las 6 |
| `blueprints/rastreo-gps-choferes/workspace/` | §10 Bootstrap, línea de copia | §19 preámbulo, §20.1 | sí — idéntico en las 3 |
| `/admin/flota` | `app/admin/flota/page.tsx` (paso 15) | §3 árbol, §6 rutas, §8 protección de rutas, §9 paso 15, epic 03 | sí — idéntico en las 5 |
| `ubicaciones_pendientes` (store IndexedDB) | `lib/utils/index.ts` (paso 9) | §9 paso 9, epic 02 | sí — idéntico en las 2 |
| `#10b981` / `#f59e0b` / `#ef4444` | §7, tabla de colores | §9 paso 13, `CLAUDE.md`, epic 02, epic 03 | sí — idénticos en las 4 |
| `16` (cantidad de pasos y de etiquetas) | §9, step map — contado sobre las filas de esa tabla | §9 paso 16 Checkpoint, §20.1, epic 03 | sí — idéntico en las 3 |

#### Reconciliación de artefactos byte-exactos

NOT APPLICABLE — este blueprint no autora ningún golden file, fixture, snapshot baseline ni literal
que un `Verify` compare con `diff`. Ninguna aserción de este blueprint depende de una cadena
producida por el runtime: los gates comparan códigos HTTP (`401`, `307`), códigos de salida y
presencia de subcadenas escritas por el propio constructor (`clearWatch`, `divIcon`, `ssr: false`),
nunca el texto de un mensaje de error que sólo la versión pineada del runtime podría emitir.

---

## 20. Acceptance Gate, Risks & Decision Log

### 20.1 Global acceptance gate

El cambio está **terminado** cuando cada comando de abajo sale con código 0 desde la raíz del
proyecto, y no antes.

```bash
npm ci                       # expect: exit 0, sin modificar package-lock.json
npm run lint                 # expect: exit 0, cero errores y cero advertencias
npm test                     # expect: exit 0, 0 fallidas, 0 omitidas
npm run build                # expect: exit 0 — incluye el chequeo de tipos (next build corre tsc)
npx prisma migrate status    # expect: exit 0, sin migraciones pendientes
npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --exit-code
                             # expect: exit 0 — deriva cero
npm run ubicaciones:purgar   # expect: exit 0, imprime el conteo eliminado

# La superficie servida se EJERCITA, no sólo se compila: se levanta el servidor y se piden
# las tres rutas nuevas más la página de flota, comparando contra el código documentado en §5 y §8.
mkdir -p ./.tmp; npm run dev > ./.tmp/viflomax-dev.log 2>&1 & DEV_PID=$!; for i in $(seq 1 60); do curl -s -o /dev/null http://localhost:3000/ && break; sleep 2; done; A=$(curl -s -o /dev/null -w '%{http_code}' -X POST http://localhost:3000/api/ubicaciones -H 'Content-Type: application/json' -d '{"latitud":-33.5,"longitud":-70.76}'); B=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/ubicaciones/activas); C=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/ubicaciones/turno/00000000-0000-0000-0000-000000000000); D=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/admin/flota); curl -sI http://localhost:3000/ > ./.tmp/viflomax-headers.txt; kill $DEV_PID 2>/dev/null || true; test "$A" = 401 && test "$B" = 401 && test "$C" = 401 && test "$D" = 307 && grep -qi 'permissions-policy: geolocation=(self)' ./.tmp/viflomax-headers.txt
# expect: exit 0
```

**Cada expectativa de arriba es una propiedad, no un conteo**, salvo el `16` de las etiquetas, que se
contó sobre las 16 filas del step map de §9 y aparece idéntico en los tres lugares donde se repite.
**Cada línea sale con código 0 en un build correcto**, y ninguna trata "sale distinto de cero" como
condición de aprobación: los códigos HTTP se comparan por igualdad contra un valor nombrado.

Más estos gates manuales, verificados una vez antes del lanzamiento:

- [ ] Cada paso de §9 tiene su etiqueta en git: `git tag -l 'step-*' | grep -c . | grep -qx 16`
      sale con código 0. El repositorio donde viven esas etiquetas lo crea el Bootstrap de §10, no un
      scaffolder.
- [ ] Cada archivo de la tabla *Files that must be committed* de §10 está presente en una copia
      limpia — `git ls-files --error-unmatch <ruta>` sale 0 para cada uno, **una ruta por invocación**,
      de modo que un fallo sea del archivo y no del comando.
- [ ] Ninguno de esos archivos está ignorado: `git check-ignore -q <ruta>; test $? -eq 1` para cada
      uno, uno por línea. `1` = no ignorado; `128` = error de uso, que ahora falla en vez de pasar.
- [ ] `.gitignore` ya existía antes del primer commit del Bootstrap:
      `git log --diff-filter=A --format=%H -- .gitignore` no apunta a ninguno de los commits de §9.
- [ ] El bloque Bootstrap de §10 se corrió una segunda vez sobre un árbol ya inicializado, **salió
      con código 0**, y no cambió nada que importara: `package.json` sigue listando `leaflet` y
      `react-leaflet`, y `npm run build` sigue encontrando sus binarios. Esto prueba que la copia
      guardada con `cp -Rn … || true` aguanta y que el guard mismo no falla en el caso que protege.
- [ ] Cada fila de la tabla *Reconciliación de valores entre artefactos* de §19.6 dice
      `Comparado: sí`, y `npm run lint` y `npm run build` se corrieron desde la raíz del proyecto
      **con el bundle presente** en `blueprints/rastreo-gps-choferes/`.
- [ ] Cada no-objetivo de §1 sigue sin construirse. En particular: `TurnoBanner.tsx` y las dos rutas
      de turnos no aparecen en ningún diff del build.
- [ ] `DATABASE_URL`, `NEXTAUTH_SECRET` y `NEXTAUTH_URL` están puestas en Vercel;
      `SHADOW_DATABASE_URL` **no** está en Vercel y no está en el repositorio.
- [ ] Prueba de terreno con un chofer real: inicia turno, acepta el consentimiento, y su marcador
      aparece en `/admin/flota` en verde en menos de 5 minutos. Requiere una persona, un dispositivo
      con GPS y un permiso otorgado a mano, por eso no es un gate de build.
- [ ] Un usuario con rol `visor` inicia sesión y es redirigido a `/admin/pedidos` al intentar entrar
      a `/admin/flota`. Requiere una cuenta real con ese rol.
- [ ] Recorrido sólo con teclado de `/admin/flota`, una pasada de lector de pantalla sobre la tabla
      de flota, y una pasada a 200% de zoom en el breakpoint más angosto (§15).
- [ ] Se ejecutó una reversión a propósito, una vez, promoviendo el despliegue anterior desde el
      panel de Vercel (§12).

**Ninguna advertencia se ignora.** Una advertencia tolerada se vuelve permanente, y la próxima
advertencia real se esconde dentro de ella.

### 20.2 Risk register

| Riesgo | Probabilidad | Impacto | Señal temprana | Mitigación |
|---|---|---|---|---|
| El usuario de Postgres no tiene `CREATEDB` y `prisma migrate dev` no puede crear la base sombra | A | A | El paso 1 falla con un error sobre la shadow database | El operador crea `viflomax_shadow` vacía a mano en la misma instancia y la apunta con `SHADOW_DATABASE_URL`. Es el punto donde el build se atasca con más frecuencia, y por eso el Bootstrap avisa de su ausencia antes del paso 1 |
| `npm i react-leaflet` sin pin instala `5.0.0` y rompe React 18 | A | A | El build falla con un error de peers que apunta a React y no a react-leaflet | El paso 13 pinea `4.2.1` de forma exacta y su gate `node -e` sale 1 si el pin cambia |
| `react-leaflet` sin releases en ~20 meses (`4.2.1` de 2024-03-01, `5.0.0` de 2024-12-14) | M | M | Un defecto en React 18 StrictMode sin arreglo upstream, o el proyecto migra a React 19 | Evaluar MapLibre GL JS + `react-map-gl` (peer de React `>=16.3.0`). El mapa está aislado en `MapaFlota.tsx`, así que el reemplazo toca un solo archivo |
| La migración IndexedDB v1→v2 pierde entregas encoladas si `onupgradeneeded` no cubre ambos stores | M | A | Choferes reportan entregas que "desaparecieron" tras actualizar la app | El paso 9 extrae la lógica a una función pura y la prueba **específicamente** en los dos casos: `oldVersion` 0 y `oldVersion` 1 |
| `.env.example` obsoleto (menciona Supabase y Google Maps, omite `DATABASE_URL`) confunde a un desarrollador nuevo | M | M | Alguien crea un `.env` siguiendo el ejemplo y nada funciona | Declarado como no-objetivo en §1 en vez de arreglarlo silenciosamente. El Bootstrap chequea `DATABASE_URL` explícitamente y explica en su mensaje que el CLI de Prisma lee `.env`, no `.env.local` |
| `Ubicacion` crece sin límite porque nadie corre la purga | M | M | La consulta de conteo de §16 supera 1.000.000 de filas | `npm run ubicaciones:purgar` documentado en `CLAUDE.md` y `AGENTS.md`, y la métrica con umbral de alerta en §16. Sin cron: se acepta que es una tarea manual mensual |
| La deriva de esquema reaparece si alguien vuelve a aplicar SQL suelto | M | A | `npx prisma migrate diff --exit-code` empieza a salir 2 | El gate de §20.1 corre esa comparación en cada verificación de aceptación, así que la deriva se detecta la primera vez que alguien corre el gate, no meses después |
| El servidor no impone el throttle de 2 minutos; un cliente modificado podría inundar `POST /api/ubicaciones` | B | M | Crecimiento anómalo de filas para un solo `turno_id` | Riesgo aceptado para v1: el endpoint exige sesión válida y turno activo, así que el atacante tendría que ser un chofer autenticado. Si aparece, la mitigación es un límite por `turno_id` en el handler |

### 20.3 Decision log

| # | Decisión | Alternativa rechazada | Por qué | Se revertiría si |
|---|---|---|---|---|
| 1 | `Decimal(10, 7)` para `latitud` / `longitud` | `Float`, que usaba el proyecto de referencia | La convención propia del repositorio gana sobre la de un proyecto ajeno: `Entrega.latitud` ya es `Decimal(10,7)`, y mezclar tipos para el mismo concepto obliga a recordar cuál es cuál en cada consulta | El proyecto migrara `Entrega` a `Float` por alguna razón propia |
| 2 | `onDelete: Cascade` en `Ubicacion → Turno` | `SetNull` o restricción | Sin cascade quedarían filas apuntando a turnos inexistentes y el mapa dibujaría marcadores fantasma que ninguna consulta puede explicar | Se necesitara conservar el histórico de posiciones después de borrar un turno, lo que implicaría desnormalizar chofer y patente en `Ubicacion` |
| 3 | Baseline de migraciones antes de agregar nada (paso 1) | Hand-authorear el SQL delta de `Ubicacion` sobre el historial derivado | Escribir SQL a mano es exactamente lo que causó la deriva; usarlo para arreglarla se derrota a sí mismo. Establecer la base sombra además desbloquea toda migración futura, no sólo ésta | El proveedor de Postgres no permitiera crear una segunda base bajo ninguna circunstancia |
| 4 | `SHADOW_DATABASE_URL` sólo en el paso 1, fuera de Vercel | Agregarla a todos los entornos "por si acaso" | No es variable de runtime: sólo la lee el CLI de Prisma durante `migrate dev`. Ponerla en Vercel es una credencial de escritura extra expuesta sin ningún consumidor | Vercel corriera migraciones durante el build, cosa que este proyecto no hace |
| 5 | Escribir cada 2 min, leer cada 15 s | Cadencia simétrica, o WebSockets | La asimetría pone el costo en el lector (un panel de escritorio enchufado) y no en la batería del chofer. WebSockets serían infraestructura nueva para refrescar unos pocos marcadores | Hubiera decenas de choferes y el polling se volviera el cuello de botella |
| 6 | Throttle en el sitio de envío con `useRef`, no un `setInterval` | Un temporizador propio que dispare envíos | Un temporizador desacopla el envío de la lectura: manda posiciones viejas, se duplica en StrictMode y sigue corriendo cuando el watcher ya murió | `watchPosition` dejara de entregar lecturas con la frecuencia suficiente en algún navegador objetivo |
| 7 | `L.divIcon` con HTML inline | El icono por defecto de Leaflet con el parche de rutas de imagen | El bug de rutas en bundlers deja marcadores invisibles y el parche hay que recordarlo en cada archivo. `divIcon` lo esquiva por completo y además permite colorear por frescura | Leaflet arreglara el bug de rutas y se necesitaran iconos rasterizados |
| 8 | `scripts/purgar-ubicaciones.mjs` con `node --env-file=.env` | `ts-node` + `tsconfig-paths`, o `dotenv` | Cero dependencias nuevas. Node 20.6+ trae `--env-file` de fábrica y `.nvmrc` ya fija Node 20; `.mjs` es además la convención existente de `scripts/` | El proyecto bajara de Node 20.6, cosa que `.nvmrc` impide |
| 9 | Objeto falso escrito a mano para probar IndexedDB | `fake-indexeddb` | No pude verificar una versión estable de ese paquete en esta sesión, y la superficie a probar son dos métodos (`objectStoreNames.contains` y `createObjectStore`). Una dependencia sin pin verificado es peor que quince líneas de objeto falso | Las pruebas de IndexedDB crecieran hasta necesitar transacciones y cursores reales |
| 10 | Jest se queda | Migrar a Vitest | Hay exactamente un test hoy. Migrar es trabajo puro de infraestructura con cero valor para este cambio, y rompería el gate de todos los pasos anteriores mientras se hace | El proyecto tuviera suficientes tests como para que la velocidad de Jest fuera un problema medible |
| 11 | Sin CSP | Agregar `Content-Security-Policy` junto con `Permissions-Policy` | El proyecto no tiene una. Agregarla mal rompe Cloudinary y el service worker de la PWA, y el síntoma aparece en producción, no en el build | Se dedicara tiempo a una auditoría de seguridad que pruebe la CSP contra ambos |
| 12 | Chequeo de rol inline, sin `requireRole()` | Un helper central de autorización | Centralizarlo tocaría todas las rutas existentes y convertiría un cambio aditivo en una refactorización transversal, con un gate que ya no prueba esta feature | Una revisión de autorización cubriera todas las rutas del proyecto a la vez |
| 13 | Tiles de OpenStreetMap | Google Maps o Mapbox | $0, sin API key, sin cuenta, sin token en el bundle del cliente. Para mostrar diez marcadores en Maipú, la diferencia de calidad de tiles es irrelevante | Se necesitara street view, tráfico en vivo o geocodificación, ninguno de los cuales OSM provee |

### 20.4 What to build next

1. **Trayecto de la jornada en el mapa.** El endpoint `GET /api/ubicaciones/turno/[id]` ya existe
   desde el paso 7 y devuelve los puntos ordenados; falta sólo la `Polyline` y el selector de turno.
   Disparador: existan 90 días de datos reales y alguien pida revisar un recorrido por nombre.
2. **Geocercas y ETA.** Requieren el historial que este cambio empieza a acumular. Disparador: el
   mismo — datos reales y una petición explícita.
3. **Corrección del `.env.example`.** Menciona Supabase y Google Maps y omite `DATABASE_URL`.
   Disparador: se haga una pasada de onboarding para desarrolladores nuevos.
4. **Purga automatizada.** Hoy es manual. Disparador: la métrica de §16 muestre que la tabla superó
   1.000.000 de filas porque nadie corrió el script.
5. **Rastreo en segundo plano.** Sólo posible con una app nativa. Disparador: la operación justifique
   construir y mantener una app en dos tiendas.

---

*Fin del blueprint. El orden de construcción es §9. Deténte cuando §20.1 esté verde.*
