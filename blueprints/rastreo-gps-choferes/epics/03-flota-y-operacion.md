# Epic 03: Flota y operación

> Al terminar este épico el rastreo está montado en la aplicación del chofer, administración tiene un
> mapa en vivo con la última posición de cada chofer en turno y una tabla accesible equivalente, y
> existe una purga de retención a 90 días.

| | |
|---|---|
| **Epic id** | `03-flota-y-operacion` |
| **Tasks** | `E3-T1` … `E3-T5` |
| **Depends on** | `01-cimientos-e-ingesta`, `02-captura-en-terreno` |
| **Unlocks** | nada — es el último épico |
| **Parallel with** | `E3-T2` sólo depende de `E1-T3`, así que puede correr en paralelo con `E3-T1` |

No necesitas ningún otro archivo para completar este épico. Todo lo de abajo se repite aquí a propósito.

---

## Stack

Next.js 14 App Router · TypeScript · Tailwind CSS · PostgreSQL · Prisma 5 · NextAuth v4
(Credentials + JWT) · Leaflet + react-leaflet · PWA con `@ducanh2912/next-pwa` · Vercel.
Gestor de paquetes: `npm`. Runtime fijado en `.nvmrc` (Node 20). Las versiones de dependencias
viven en `package-lock.json` — léelo, nunca adivines una.

| Tarea | Comando |
|---|---|
| Dev | `npm run dev` |
| Build (incluye chequeo de tipos) | `npm run build` |
| Lint | `npm run lint` |
| Test | `npm test` |
| Purgar ubicaciones > 90 días | `npm run ubicaciones:purgar` |

**Gate:** `npm run build && npm run lint && npm test` pasa antes de marcar cualquier tarea de aquí
como terminada. **No existe `npm run typecheck`** en este repositorio: `npm run build` es
`prisma generate && next build`, y `next build` corre `tsc`.

`E3-T4` y `E3-T5` verifican contra el servidor de desarrollo y la base de datos real, que necesitan
`DATABASE_URL` en `.env`. Es un prerrequisito brownfield ya existente. El script de purga la carga
con `node --env-file=.env`, porque el runtime de Node no lee `.env` por sí solo.

## Subárbol de directorios

Sólo lo que este épico toca:

```
package.json                          # existe, lo editas en E3-T2 (deps) y E3-T5 (script)
package-lock.json                     # existe, lo actualiza npm en E3-T2
app/
  chofer/layout.tsx                   # existe, lo editas en E3-T1 — server component async
  admin/flota/page.tsx                # NUEVO en E3-T4 — página de servidor
components/
  admin/MapaFlota.tsx                 # NUEVO en E3-T2 — componente Leaflet puro cliente
  admin/FlotaClient.tsx               # NUEVO en E3-T3 — polling + estados + dynamic import
  admin/Sidebar.tsx                   # existe, lo editas en E3-T4 — navItems y VISOR_HREFS
  chofer/UbicacionTracker.tsx         # existe desde E2-T5, sólo lectura
lib/
  ubicaciones.ts                      # existe desde E1-T3, sólo lectura
  auth/middleware.ts                  # existe, SÓLO LECTURA — ya bloquea a visor fuera de /admin/pedidos
scripts/
  purgar-ubicaciones.mjs              # NUEVO en E3-T5 — convención .mjs del repositorio
```

Todo lo que esté fuera de este subárbol queda fuera de alcance. Si una tarea parece exigir editar un
archivo que no está aquí, detente y reporta: significa que el límite del épico está mal.

## Modelo de datos tocado aquí

| Entidad | Campos que este épico agrega o lee | Notas |
|---|---|---|
| `Ubicacion` | lee `latitud`, `longitud`, `registrado_en`, `turno_id`; borra por antigüedad en `E3-T5` | Coordenadas ya convertidas a `number` por la API |
| `Turno` | lee `estado`, `chofer`, `bodega` (vía `include` de la API) | Congelado para escritura |
| `Chofer` | lee `nombre` | Se muestra como etiqueta del marcador |
| `Bodega` | lee `patente` | Se muestra como identificador del vehículo |

Retención: `Ubicacion` se purga a los **90 días** contra `registrado_en`. Sin la purga la tabla crece
sin límite — un chofer, 8 horas de turno, un ping cada 2 minutos son ~240 filas por jornada.

## Contratos

**Consumidos** — ya existen, no los reconstruyas:

| De | Interfaz | Garantía |
|---|---|---|
| `E1-T3` | `lib/ubicaciones.ts` → `frescuraSenal(fecha, ahora?)` | Devuelve `'fresca'` \| `'vieja'` \| `'sin_senal'` |
| `E1-T3` | `lib/ubicaciones.ts` → `minutosDesde(fecha, ahora?)` | Minutos transcurridos, como número |
| `E1-T6` | `GET /api/ubicaciones/activas` | Una fila por turno activo, coordenadas ya `Number()`, con nombre de chofer y patente |
| `E2-T5` | `components/chofer/UbicacionTracker.tsx` | Componente cliente sin props obligatorias |
| repositorio | `lib/auth/middleware.ts` | Su regex permite a `visor` sólo `/admin/pedidos` y `/admin/pedidos/[id]`; todo lo demás redirige a `/admin/pedidos`. **Sólo lectura** |
| repositorio | `components/admin/Sidebar.tsx` | Tiene `navItems` y `VISOR_HREFS = ['/admin/pedidos']` |

**Producidos** — nada fuera de este épico depende de ellos; es el último.

| Export | Firma | Usado por |
|---|---|---|
| `components/admin/MapaFlota.tsx` → default | `({ posiciones }) => JSX` | `E3-T3` |
| `components/admin/FlotaClient.tsx` → default | `() => JSX`, componente cliente | `E3-T4` |
| `npm run ubicaciones:purgar` | script npm | operación |

## Convenciones que muerden en esta área

- **Leaflet se parte en tres archivos, siempre.** `page.tsx` de servidor → wrapper cliente que hace
  `dynamic(() => import('./MapaFlota'), { ssr: false, loading: <esqueleto> })` → el componente
  Leaflet. Leaflet toca `window` al importarse; con SSR el build falla.
- **`import 'leaflet/dist/leaflet.css'` va DENTRO del componente dinámico**, nunca en `globals.css`.
- **Marcadores con `L.divIcon` y HTML inline.** Esquiva por completo el bug del icono por defecto de
  Leaflet en bundlers. Los keyframes van en un bloque `<style>` inline, porque Leaflet renderiza el
  HTML del `divIcon` fuera del árbol de React.
- **Los tiles son OpenStreetMap** — `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` con la
  atribución estándar. Sin API key, sin facturación, costo cero.
- **El color del marcador lo decide `frescuraSenal`**, no una condición escrita a mano en el
  componente. `#10b981` fresca, `#f59e0b` vieja, `#ef4444` sin señal.
- **`visor` nunca entra a `/admin/flota`.** La entrada "Flota" va en `navItems` y **jamás** en
  `VISOR_HREFS`. El middleware existente ya bloquea el resto; este épico verifica que sigue así.
- **Un mapa solo no es accesible.** La página lleva, además del mapa, una tabla equivalente con una
  fila por chofer en turno.
- **Los scripts sueltos son `.mjs`** en `scripts/`, siguiendo `scripts/seed-admin.mjs`. Se ejecutan
  con `node --env-file=.env` porque Node no lee `.env` por sí solo.

Reglas completas del proyecto: `CLAUDE.md`. Está en la raíz del proyecto — el constructor lo copió
desde `workspace/` del bundle antes de la tarea uno.

---

## Tasks

Listadas en el mismo orden que `tasks.json`. Ese orden es el orden de construcción — trabaja de
arriba hacia abajo y no reordenes por prioridad ni por lo que parezca rápido.

### `E3-T1` — Montar UbicacionTracker en el layout del chofer

**Depends on:** `E2-T5` · **Priority:** p0 — metadato para recortes de alcance, no orden de ejecución

`app/chofer/layout.tsx` es un componente de servidor **asíncrono**: hace el chequeo de autenticación,
renderiza el header y `<main>{children}</main>`. No puede contener hooks. Por eso el tracker se monta
como un hijo cliente dentro del layout, no como lógica del layout. El cambio es de dos o tres líneas:
importar `UbicacionTracker` y renderizarlo junto al header. No toques el chequeo de autenticación
existente ni la estructura del `<main>`.

**Files**
- `app/chofer/layout.tsx` — edición: renderiza `UbicacionTracker`

**Acceptance**

1. **CUANDO** se lee `app/chofer/layout.tsx` **EL SISTEMA DEBERÁ** renderizar `UbicacionTracker` como hijo cliente, manteniendo el layout como componente de servidor asíncrono sin ningún hook.
2. **CUANDO** un usuario sin sesión visita `/chofer` **EL SISTEMA DEBERÁ** seguir redirigiendo igual que antes, sin cambios en el chequeo de autenticación existente.
3. **CUANDO** se lee el archivo **EL SISTEMA DEBERÁ** conservar intactos el header y el `<main>{children}</main>` que ya existían.
4. **CUANDO** `npm run build` corre **EL SISTEMA DEBERÁ** salir con código 0 y no reportar el error de hooks en componente de servidor.

**Verify** — todos los comandos, en orden, desde la raíz del proyecto.

```bash
npm run build
npm run lint
grep -qF 'UbicacionTracker' app/chofer/layout.tsx
```

**Checkpoint**

```bash
git add -A && git commit -m "E3-T1: montar UbicacionTracker en el layout del chofer"
git tag step-12-montaje-chofer
```

### `E3-T2` — Instalar leaflet con pines exactos y crear MapaFlota

**Depends on:** `E1-T3` · **Priority:** p0 — metadato para recortes de alcance, no orden de ejecución

Instalación, con pines **exactos**, sin rango:

```bash
npm i leaflet@1.9.4 react-leaflet@4.2.1
npm i -D @types/leaflet@^1.9.22
```

`npm i react-leaflet` sin pin instala `5.0.0`, cuyos peers son `{"react":"^19.0.0","react-dom":"^19.0.0"}`
— incompatibles con React 18, que es lo que este proyecto usa. Los peers verificados de `4.2.1` son
`{"leaflet":"^1.9.0","react":"^18.0.0","react-dom":"^18.0.0"}`. `@react-leaflet/core@2.1.0` se
resuelve de forma transitiva; nunca lo pines directamente.

`MapaFlota.tsx` es puro cliente: importa `leaflet/dist/leaflet.css` dentro del propio archivo,
renderiza `MapContainer` + `TileLayer` de OpenStreetMap con su atribución estándar, y un `Marker` por
posición usando `L.divIcon` con HTML inline. El color sale de `frescuraSenal`. Los keyframes de la
animación de pulso van en un `<style>` inline dentro del componente, porque Leaflet inserta el HTML
del `divIcon` fuera del árbol de React y una clase de Tailwind aplicada por React no lo alcanza.

**Files**
- `package.json` — edición: dependencias de leaflet
- `package-lock.json` — edición: lo actualiza npm
- `components/admin/MapaFlota.tsx` — nuevo

**Acceptance**

1. **CUANDO** se lee `package.json` **EL SISTEMA DEBERÁ** declarar `react-leaflet` en la versión exacta `4.2.1`, sin rango, porque la `5.0.0` exige React 19 y este proyecto usa React 18.
2. **CUANDO** se lee `package.json` **EL SISTEMA DEBERÁ** declarar `leaflet` en la versión exacta `1.9.4` y `@types/leaflet` como dependencia de desarrollo.
3. **CUANDO** se lee `package.json` **EL SISTEMA DEBERÁ** no declarar `@react-leaflet/core` como dependencia directa, porque se resuelve de forma transitiva.
4. **CUANDO** se lee `components/admin/MapaFlota.tsx` **EL SISTEMA DEBERÁ** importar `leaflet/dist/leaflet.css` dentro de ese archivo y usar `L.divIcon` con HTML inline para los marcadores, nunca el icono por defecto de Leaflet.
5. **CUANDO** se renderiza un marcador **EL SISTEMA DEBERÁ** elegir su color llamando a `frescuraSenal`: `#10b981` para `'fresca'`, `#f59e0b` para `'vieja'` y `#ef4444` para `'sin_senal'`.
6. **CUANDO** `npm run build` corre **EL SISTEMA DEBERÁ** salir con código 0.

**Verify** — todos los comandos, en orden, desde la raíz del proyecto. El primero sale con código 0
sólo si los tres pines son exactamente los esperados.

```bash
node -e "const p=require('./package.json');if(p.dependencies['react-leaflet']!=='4.2.1'){console.error('react-leaflet debe estar pineado en 4.2.1');process.exit(1)};if(p.dependencies['leaflet']!=='1.9.4'){console.error('leaflet debe estar pineado en 1.9.4');process.exit(1)};if(p.dependencies['@react-leaflet/core']){console.error('@react-leaflet/core no debe ser dependencia directa');process.exit(1)}"
grep -qF 'leaflet/dist/leaflet.css' components/admin/MapaFlota.tsx
grep -qF 'divIcon' components/admin/MapaFlota.tsx
npm run build
npm run lint
```

**Checkpoint**

```bash
git add -A && git commit -m "E3-T2: instalar leaflet con pines exactos y crear MapaFlota"
git tag step-13-leaflet-mapa
```

### `E3-T3` — Crear FlotaClient con polling de 15 s y tres estados

**Depends on:** `E1-T6`, `E3-T2` · **Priority:** p0 — metadato para recortes de alcance, no orden de ejecución

El wrapper cliente. Carga `MapaFlota` con
`dynamic(() => import('./MapaFlota'), { ssr: false, loading: () => <esqueleto> })` — es la única
forma de que Leaflet no rompa el build de servidor.

El refresco es un `setInterval` simple de 15 segundos contra `GET /api/ubicaciones/activas`, con una
bandera `cancelled` y `clearInterval` en la limpieza para ser seguro bajo StrictMode. Nada de
librerías de fetching: el proyecto no tiene ninguna y no es momento de agregar una.

Tres estados explícitos y visibles, no dos:

1. **Cargando** — esqueleto, mientras el import dinámico y el primer fetch resuelven.
2. **Vacío** — tarjeta con texto cuando no hay ningún chofer en turno. Nunca un mapa en blanco sin
   explicación: un mapa vacío es indistinguible de un mapa roto.
3. **Error de fetch** — se **mantienen renderizadas las últimas posiciones buenas** y se muestra un
   banner ámbar delgado con el texto de reconexión. Borrar el mapa ante un fallo transitorio de red
   es peor que mostrar datos de hace 30 segundos.

**Files**
- `components/admin/FlotaClient.tsx` — nuevo

**Acceptance**

1. **CUANDO** `FlotaClient` se monta **EL SISTEMA DEBERÁ** cargar `MapaFlota` con `dynamic(() => import('./MapaFlota'), { ssr: false })` mostrando un esqueleto mientras carga.
2. **CUANDO** el componente está montado **EL SISTEMA DEBERÁ** consultar `GET /api/ubicaciones/activas` cada 15 segundos con `setInterval`, usando una bandera `cancelled` y llamando a `clearInterval` en la limpieza para ser seguro bajo StrictMode.
3. **CUANDO** la respuesta llega vacía **EL SISTEMA DEBERÁ** mostrar una tarjeta de estado vacío con texto, nunca un mapa en blanco sin explicación.
4. **CUANDO** una consulta falla **EL SISTEMA DEBERÁ** mantener renderizadas las últimas posiciones buenas y mostrar un banner ámbar delgado con el texto de reconexión.
5. **CUANDO** `npm run build` y `npm run lint` corren **EL SISTEMA DEBERÁ** salir con código 0 en ambos.

**Verify** — todos los comandos, en orden, desde la raíz del proyecto.

```bash
npm run build
npm run lint
grep -qF 'ssr: false' components/admin/FlotaClient.tsx
grep -qF 'clearInterval' components/admin/FlotaClient.tsx
```

**Checkpoint**

```bash
git add -A && git commit -m "E3-T3: crear FlotaClient con polling de 15 s y tres estados"
git tag step-14-flota-client
```

### `E3-T4` — Crear /admin/flota y su entrada en el Sidebar

**Depends on:** `E3-T3` · **Priority:** p0 — metadato para recortes de alcance, no orden de ejecución

`app/admin/flota/page.tsx` es un componente de servidor que verifica `token.role === 'admin'` inline
y renderiza `FlotaClient`. La entrada "Flota" se agrega al array `navItems` de
`components/admin/Sidebar.tsx` y **jamás** a `VISOR_HREFS`, que debe quedar exactamente como está.

Junto al mapa va una **tabla accesible** con una fila por chofer en turno: nombre, patente, frescura
de señal y hora de la última posición. Un mapa por sí solo no cumple WCAG 2.2 AA — un usuario de
lector de pantalla no puede leer marcadores. La frescura se comunica con texto, no sólo con color.

Este es el momento en que la garantía de autorización se vuelve significativa: `/admin/flota` no
existía antes, así que ahora sí tiene sentido verificar que `visor` no llega a ella. El middleware
existente (`lib/auth/middleware.ts`) ya lo hace y es **sólo lectura**; los dos chequeos de `node -e`
del bloque Verify confirman que este paso no lo debilitó.

**Files**
- `app/admin/flota/page.tsx` — nuevo
- `components/admin/Sidebar.tsx` — edición: nueva entrada en `navItems`

**Acceptance**

1. **CUANDO** un usuario sin sesión visita `/admin/flota` **EL SISTEMA DEBERÁ** responder 307 redirigiendo al login.
2. **CUANDO** se lee `components/admin/Sidebar.tsx` **EL SISTEMA DEBERÁ** contener `/admin/flota` dentro de `navItems` y EL SISTEMA DEBERÁ no contenerlo dentro de `VISOR_HREFS`.
3. **CUANDO** se lee `lib/auth/middleware.ts` **EL SISTEMA DEBERÁ** no mencionar `flota` en la lista de rutas permitidas al rol `visor`, de modo que el middleware existente siga redirigiendo a `visor` hacia `/admin/pedidos`.
4. **CUANDO** se lee `app/admin/flota/page.tsx` **EL SISTEMA DEBERÁ** ser un componente de servidor que verifica `token.role === 'admin'` inline y renderiza `FlotaClient`.
5. **CUANDO** se renderiza la página **EL SISTEMA DEBERÁ** incluir, junto al mapa, una tabla accesible con una fila por chofer en turno indicando nombre, patente, frescura de señal y hora de la última posición.

**Verify** — todos los comandos, en orden, desde la raíz del proyecto. Los dos `node -e` salen con
código 1 cuando la propiedad se rompe y con código 3 cuando la estructura que inspeccionan ya no
existe, de modo que un cambio de forma no pasa como aprobado.

```bash
npm run build
npm run lint
node -e "const s=require('fs').readFileSync('components/admin/Sidebar.tsx','utf8');const m=s.match(/VISOR_HREFS\s*=\s*\[([^\]]*)\]/);if(!m){console.error('VISOR_HREFS no encontrado');process.exit(3)};if(m[1].includes('/admin/flota')){console.error('/admin/flota no debe estar en VISOR_HREFS');process.exit(1)};if(!s.includes('/admin/flota')){console.error('/admin/flota debe estar en navItems');process.exit(1)}"
node -e "const s=require('fs').readFileSync('lib/auth/middleware.ts','utf8');if(!s.includes('visor')){console.error('el middleware ya no menciona visor');process.exit(3)};if(s.includes('flota')){console.error('flota no debe aparecer en el middleware de visor');process.exit(1)}"
npm run dev > /tmp/viflomax-dev.log 2>&1 & DEV_PID=$!; for i in $(seq 1 60); do curl -s -o /dev/null http://localhost:3000/ && break; sleep 2; done; CODE=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/admin/flota); kill $DEV_PID 2>/dev/null || true; test "$CODE" = 307
```

**Checkpoint**

```bash
git add -A && git commit -m "E3-T4: crear /admin/flota y su entrada en el Sidebar"
git tag step-15-pagina-flota
```

### `E3-T5` — Agregar la purga de retención a 90 días

**Depends on:** `E1-T4`, `E2-T1`, `E2-T2`, `E3-T1`, `E3-T4` · **Priority:** p1 — metadato para recortes de alcance, no orden de ejecución

`scripts/purgar-ubicaciones.mjs`, siguiendo la convención de `scripts/seed-admin.mjs`. Borra las
filas de `Ubicacion` con `registrado_en` anterior a 90 días con un solo `deleteMany`, imprime cuántas
eliminó y sale con código 0. Es idempotente por construcción: correrlo dos veces seguidas reporta 0
en la segunda pasada.

El script npm es exactamente:

```json
"ubicaciones:purgar": "node --env-file=.env scripts/purgar-ubicaciones.mjs"
```

`--env-file=.env` no es opcional: Node no lee `.env` por sí solo, y sin esa bandera el script muere
al construir el `PrismaClient` con un error sobre `DATABASE_URL` que parece un problema de entorno y
no lo es. No agregues `dotenv` ni ninguna otra dependencia — Node 20.6+ trae `--env-file` de fábrica,
y `.nvmrc` ya fija Node 20.

Esta es la última tarea del build. Cuando su `Verify` pasa, corre el gate global de la sección 20.1
del blueprint.

**Files**
- `scripts/purgar-ubicaciones.mjs` — nuevo
- `package.json` — edición: script `ubicaciones:purgar`

**Acceptance**

1. **CUANDO** `npm run ubicaciones:purgar` corre **EL SISTEMA DEBERÁ** salir con código 0 e imprimir la cantidad de filas de `Ubicacion` eliminadas.
2. **CUANDO** el script corre **EL SISTEMA DEBERÁ** eliminar únicamente las filas con `registrado_en` anterior a 90 días y no tocar ninguna fila más reciente.
3. **CUANDO** se lee `package.json` **EL SISTEMA DEBERÁ** definir el script `ubicaciones:purgar` como `node --env-file=.env scripts/purgar-ubicaciones.mjs`, sin agregar ninguna dependencia nueva.
4. **CUANDO** el script corre dos veces seguidas **EL SISTEMA DEBERÁ** salir con código 0 ambas veces y reportar 0 eliminadas en la segunda.
5. **CUANDO** `npm run build`, `npm run lint` y `npm test` corren al cerrar el paso **EL SISTEMA DEBERÁ** salir con código 0 en los tres, con 0 pruebas fallidas.

**Verify** — todos los comandos, en orden, desde la raíz del proyecto.

```bash
npm run ubicaciones:purgar
npm run ubicaciones:purgar
npm run build
npm run lint
npm test
```

**Checkpoint**

```bash
git add -A && git commit -m "E3-T5: agregar la purga de retención a 90 días"
git tag step-16-retencion-purga
git tag -l 'step-*' | grep -c . | grep -qx 16   # expect: exit 0 — las 16 etiquetas existen tras este commit
```

---

## Epic acceptance

El épico está terminado cuando cada tarea está `done` **y**:

1. **CUANDO** un usuario sin sesión visita `/admin/flota` **EL SISTEMA DEBERÁ** responder 307 redirigiendo al login, y `VISOR_HREFS` **DEBERÁ** no contener `/admin/flota`.
2. **CUANDO** `npm run ubicaciones:purgar` corre dos veces seguidas **EL SISTEMA DEBERÁ** salir con código 0 ambas veces, probando que la retención es idempotente.

```bash
npm run build && npm run lint && npm test
npm run ubicaciones:purgar
```

Se ejecutan desde la raíz del proyecto.

## Pitfalls

- **`npm i react-leaflet` sin pin.** Instala `5.0.0`, que exige React 19. El build falla con un error
  de peers que apunta a React y no a react-leaflet. El chequeo `node -e` de `E3-T2` existe para eso.
- **Importar Leaflet sin `ssr: false`.** Leaflet toca `window` al cargarse; el build de servidor
  muere con `window is not defined` en un archivo que se ve inocente.
- **`leaflet.css` en `globals.css`.** Funciona en desarrollo y se rompe de formas sutiles con el
  service worker de la PWA. Va dentro del componente dinámico.
- **Usar el icono por defecto de Leaflet.** El bug de rutas de imagen en bundlers deja marcadores
  invisibles. `L.divIcon` con HTML inline lo esquiva por completo.
- **Agregar "Flota" a `VISOR_HREFS`.** Le da a un rol de sólo lectura de pedidos acceso a la posición
  en vivo de personas. Va en `navItems` y en ningún otro lugar.
- **Mapa sin tabla equivalente.** Falla WCAG 2.2 AA y el criterio 5 de `E3-T4`.
- **Olvidar `--env-file=.env` en el script npm.** El script muere con un error de `DATABASE_URL` que
  parece un problema de configuración de la máquina. No lo es: es la bandera faltante.
- **Borrar el mapa cuando falla un fetch.** El operador ve la pantalla vaciarse y asume que todos los
  choferes desaparecieron. Se mantienen las últimas posiciones buenas detrás del banner ámbar.

## Before moving on

- [ ] Cada tarea de este épico está `done` en `tasks.json` — ninguna quedó `in_progress`.
- [ ] Cada comando `verify` de cada tarea pasó, no sólo el primero.
- [ ] Ningún comando `verify` fue editado, y ninguno se omitió porque un archivo no existía.
- [ ] Cada tarea tiene su etiqueta `checkpoint` en git — `git tag -l 'step-*'` lista las 16 del build.
- [ ] El comando de gate pasa limpio, corrido desde la raíz del proyecto.
- [ ] Ningún archivo fuera del subárbol fue modificado; `lib/auth/middleware.ts` sigue intacto.
- [ ] Este épico no agrega ninguna variable de entorno nueva.
- [ ] Un commit por tarea, cada uno prefijado con su id, cada uno seguido de su etiqueta.
- [ ] El gate global de la sección 20.1 del blueprint corrió y quedó verde.
