---
id: VFX-021
titulo: Integrar el hero aprobado sin ola con entrada pausada y navegacion compacta
estado: en-revision
prioridad: p1
asignado: codex
revisor: claude
area: landing
depende_de: []
blueprint:
rama: codex/VFX-021-portada-aprobada
archivos: [components/public/Hero.tsx, components/public/SiteHeader.tsx, components/public/SiteFooter.tsx, components/public/WhatsAppFloat.tsx, app/(public)/page.tsx, app/globals.css]
bloqueo:
creado: 2026-10-13
actualizado: 2026-10-13
---

## Contexto

El humano aprobo la maqueta `D:/CLAUDEKODE/viflomax/design_handoff_landing_redesign/agua-viva/concepto.html` y solicito integrarla, dejando commit y push a su cargo. Sustituye la direccion de VFX-016 y VFX-017 para esta entrega: sin ola que atraviese el hero, sin bidon SVG, sin palabra rotativa, con la imagen comercial existente. El ritmo pausado de la maqueta fue aprobado tras descartar el pase de agua. Mantener Nunito/Outfit y tokens existentes.

## Criterios de aceptacion

- [x] Hero server de dos columnas; en movil mensaje y CTAs antes del producto.
- [x] H1 palabra por palabra; frase accesible completa una sola vez, visible sin movimiento.
- [x] Imagen existente con entrada suave, prioridad y dimensiones reservadas; sin descargar ola.
- [x] Botones visibles desde inicio, enlaces y contacto conservados; sin superposicion de WhatsApp en movil.
- [x] Sin dependencias nuevas ni cambios en contrato, catalogo, contacto, admin o chofer.
- [x] Compuerta lint, Jest y build verde; browser QA y revision cruzada documentadas.

## Bitacora

### 2026-10-13 · codex · lista → en-curso
- Autorizacion directa del humano para integrar el diseno. Se crea tarea especifica; no se ejecutan las variantes antiguas VFX-015 a VFX-019.
- Worktree desde main f626a0a: D:/CLAUDEKODE/viflomax-codex-landing. La carpeta original de Claude conserva su rama y cambios previos.
- Excepcion explicita del humano: no realizar el commit de claim ni ningun otro commit; el humano hara commit y push. Claim espejado en la carpeta original para que Claude vea los candados aun sin commit.
- Protocolo leido en la carpeta original; trabajo segun AGENTS.md, CLAUDE.md y reglas diferidas vigentes alli.
- Primera medicion de build bloqueada por DLL Prisma compartida mediante junction. Se aislara node_modules con npm ci sin detener procesos ajenos.

## Revision

### 2026-10-13 · codex · ampliacion de alcance antes de editar
- Se agregan SiteFooter.tsx y app/(public)/page.tsx al candado para asegurar Contacto en mobile sin ampliar el header y ajustar la ancla de pedido al alto del header sticky, tras revision independiente de Claude.

Pendiente de Claude Code; no aprobar la propia implementacion.

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

### 2026-10-13 · codex · correccion de ubicacion de entrega
- El humano reporta que no ve cambios. Verificacion actual: el servidor Next dev de puerto 3001 sirve D:/CLAUDEKODE/viflomax; los ocho archivos de landing de esa carpeta son identicos a main f626a0a. La implementacion sigue sin commit en el worktree auxiliar.
- Se aplicara el mismo diff aprobado al working tree de la carpeta habitual, conservando la rama claude/VFX-000-protocolo-agentes y los trabajos de Claude. Excepcion operativa al aislamiento por rama para corregir la entrega solicitada por el humano; sin commit, push ni merge. Sin tareas en-curso que choquen con estos archivos.
- Se repetira compuerta y QA en el puerto habitual; VFX-023/VFX-024 se conservan sin implementar en esta correccion.

### 2026-10-13 · codex · correccion de ubicacion verificada → en-revision
- Diff aprobado aplicado en D:/CLAUDEKODE/viflomax sobre claude/VFX-000-protocolo-agentes, sin cambiar rama, commit, push ni merge. Los ocho archivos coinciden byte a byte con la implementacion revisada por Claude; no hay cambios nuevos de diseno.
- Compuerta repetida en la carpeta habitual bajo Node 20.20.2: npm run lint sin errores/avisos, npx jest --runInBand 10 suites/53 tests aprobados, npm run build codigo 0 con 42 paginas. Home 5.42 kB / 101 kB First Load JS. git diff --check limpio.
- Servidor dev habitual reiniciado en http://localhost:3001. Verificacion HTTP 200 del HTML servido: hero nuevo id=inicio, cuatro spans hero-palabra, imagen recarga-20l, nueve articles de productos, sin video ni el hero antiguo. La revision visual completa previa sigue correspondiendo al mismo codigo; no se declara nueva inspeccion visual completa de navegador en esta correccion.
- Conservados contrato, precios, contacto, dependencias y trabajo de Claude, incluyendo sus assets y tareas de video. .agents/ENTREGA-PORTADA.md ahora apunta a la carpeta habitual; el worktree auxiliar se conserva como respaldo.
