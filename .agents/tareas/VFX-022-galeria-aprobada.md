---
id: VFX-022
titulo: Integrar la galeria completa con imagenes grandes y seleccion de producto intacta
estado: en-revision
prioridad: p1
asignado: codex
revisor: claude
area: landing
depende_de: [VFX-021]
blueprint:
rama: codex/VFX-021-portada-aprobada
archivos: [components/public/ProductGrid.tsx, components/public/ProductoImagen.tsx]
bloqueo:
creado: 2026-10-13
actualizado: 2026-10-13
---

## Contexto

Segunda unidad de la integracion aprobada: conservar los nueve productos, dar protagonismo a sus imagenes verticales completas y a la recarga destacada. Nombres, precios y categorias vienen de lib/productos.ts sin modificarlo. Conservar filtros, ProductoImagen fallback y PedidoProvider.

## Criterios de aceptacion

- [x] Nueve productos en Todos; filtros conservados y estado activo accesible.
- [x] Imagenes completas sin padding reductor, proporcion vertical y tamaños responsive correctos.
- [x] Recarga destacada de ancho completo; resto de la galeria en dos columnas desktop y una movil.
- [x] Pedir este sincroniza el producto exacto y navega a #pedido; endpoint y formulario intactos.
- [x] Compuerta verde, QA de seleccion/filtros y revision cruzada.

## Bitacora

### 2026-10-13 · codex · lista → en-curso
- El humano aprobo este catalogo y autorizo integracion conjunta con VFX-021. Rama compartida para una entrega coherente; archivos sin solapamiento entre ambas tareas.
- No commit ni push por instruccion explicita del humano. Claim espejado en la carpeta original; revisar ambas tareas juntas.

## Revision

Pendiente de Claude Code.

### 2026-10-13 · codex · en-curso → en-revision
- Integracion terminada en codex/VFX-021-portada-aprobada, worktree D:/CLAUDEKODE/viflomax-codex-landing. Commit y push reservados al humano por instruccion explicita; no se marca hecha.
- Compuerta final Node 20.20.2: lint sin avisos, Jest 10 suites/53 tests, build exitoso (42 paginas). git diff --check limpio.
- Home: linea base 10.4 kB/100 kB First Load JS; final 5.42 kB/101 kB. El motion es CSS server; hay un aumento redondeado de 1 kB en First Load JS respecto de la base. No se afirma cumplir el presupuesto +0 KB de las tareas antiguas.
- Browser QA sobre build de produccion local: 320/375/390/768/1440 px sin desbordamiento, CTAs accesibles desde el inicio, H1 completo en arbol accesible. Nueve imagenes cargadas, filtros 9/4/3/2 y seleccion de los nueve nombres exactos en formulario, incluso con hash repetido. Ancla de pedido bajo header sticky.
- Contraste conservador de capas: azul300 sobre fondo hero compuesto 8.22:1; blanco sobre verde700 5.95:1. Motion finito <=4.5 s y reduced-motion con estado CSS visible; fallback comprobado por reglas CSS, sin emular preferencia nativa del SO.
- Lighthouse snapshot movil: accesibilidad/buenas practicas/SEO 100, cero auditorias fallidas. Snapshot no mide rendimiento; no se declara LCP/INP ni telefono fisico/cross-browser/produccion verificados.
- Sin diferencias en endpoint congelado, catalogo/precios, contacto, PedidoForm, package.json o lockfile; sin dependencias nuevas de aplicacion ni modificaciones de admin/chofer.
- Contexto local: la configuracion preexistente no define NEXTAUTH_SECRET para npm start, por lo que /api/auth/session responde 500. No se editaron .env ni se verifico login en produccion. No se enviaron pedidos reales. La comprobacion de seleccion y contrato usa UI y tests puros existentes; no se declara un POST real ni una prueba E2E simulada de envio.
- Pendientes preexistentes de formulario/contexto: elegir A, cambiar select a B y volver a elegir el mismo A no re-sincroniza; foco tras scroll sigue en catalogo. Claude los registro como fuera de alcance, no bloqueantes. Las tareas de conversion VFX-009/VFX-010 siguen pendientes.

### 2026-10-13 · claude revisa · APROBADA
- Revision independiente mediante Claude Code CLI de solo lectura; segunda pasada aprobada. Primera pasada CAMBIOS: bandas blancas en destacado y acceso Contacto mobile. Ambos corregidos.
- Condicion de aprobacion verificada por Codex contra lib/productos.ts: exactamente un destacado, en indice 0, Recarga 20 Litros. No se cambia el orden ni los datos del catalogo.
- Claude no realizo browser QA; las observaciones visuales y de interaccion anteriores son de Codex. Veredicto copiado de la respuesta independiente, no autoaprobacion del implementador.
