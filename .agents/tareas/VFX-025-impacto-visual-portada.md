---
id: VFX-025
titulo: Elevar el impacto de portada con producto protagonista y catalogo compacto
estado: en-revision
prioridad: p1
asignado: codex
revisor: claude
area: landing
depende_de: []
blueprint:
archivos: [components/public/Hero.tsx, components/public/ProductGrid.tsx, components/public/ProductoImagen.tsx, app/globals.css, public/productos/hero-bidon.png, public/productos/hero-bidon.prompt.md, .agents/auditorias/2026-10-13-impacto-visual-portada.md, .agents/ENTREGA-PORTADA.md, .agents/auditorias/2026-10-13-direccion-verano-hero.md]
bloqueo:
creado: 2026-10-13
actualizado: 2026-10-13
---

## Contexto

Claudio solicita revisar el trabajo de Claude y proponer mayor impacto visual. Informe: [crítica y prioridades](../auditorias/2026-10-13-impacto-visual-portada.md). El humano aprobo la secuencia y autorizo su implementacion. Respetar el alcance y los candados de VFX-024 antes de programar.

## Criterios propuestos para especificar antes de implementar

- [x] Imagen del bidón con recorte limpio y marca y texto de etiqueta conservados en apariencia, protagonista del hero.
- [x] Imagen visible desde el inicio; entrada de texto pausada por máscara/transform y fallback reducido.
- [x] Nueve productos y filtros preservados, con catálogo móvil más compacto y fotos completas.
- [x] Sin cambios en nombres, precios, contrato público, contacto ni formulario.
- [x] Revisar composición estática y movimiento en desktop y móvil, contraste y rendimiento.
- [x] Compuerta lint/Jest/build verde y revisión cruzada antes de entregar código.
- [x] Una sola carpeta, main, servidores propios apagados, bloque exacto de commit/push para el humano.

## Fuera de alcance

Integrar o cambiar el video de ola de VFX-023/VFX-024, modificar admin/chofer, añadir dependencias o inventar garantías comerciales.

## Bitácora

### 2026-10-13 · codex · propuesta
- Revisión de código y producción del commit 7aa715a, con imágenes y tamaños reales del catálogo, más hojas de contacto de la ola. Opiniones de acabado artístico separadas de la comprobación de formatos/pesos.
- Sin modificaciones de aplicación, sin commit/push y sin afirmar compuerta nueva. La propuesta espera priorización del humano.

## Revisión

Pendiente de definición e implementación. No se marca APROBADA ni hecha.

## Commit

El bloque exacto para commitear este documento y su informe está en el informe enlazado. No publica cambios de aplicación.

### 2026-10-13 · codex · propuesta → en-curso
- El humano aprueba la secuencia recomendada y solicita posteriormente asesoramiento para un acabado de verano realista. Se implementan producto protagonista, entrada y tipografia, y catalogo compacto; la asesoria del agua se entrega como direccion de arte, sin integrar el video en esta tarea.
- Main 7aa715a, misma carpeta; no tareas en-curso con archivos solapados. VFX-024 sigue lista y no se toma durante esta entrega. Sin commit/push por Codex.
- Candado ampliado antes de editar: asset PNG con alpha y prompt, entrega y asesoria de verano. No dependencias nuevas; CSS nativo, tokens y fuentes existentes por reglas del proyecto, por encima de defaults genericos de la skill de diseno.

### 2026-10-13 · codex · en-curso → en-revision
- Integrado producto protagonista con recorte RGBA 1122x1402 derivado de la foto comercial mediante image_gen incorporado. Source JPG conservado; prompt e inspeccion documentados. Conserva marca/texto en apariencia, sin afirmar identidad pixel a pixel. La transparencia exterior se verifico en canvas (alpha esquina 0). PNG 1.38 MB de fuente; muestra optimizada local WebP 69.362 B.
- Hero sin marco de tarjeta, iluminacion localizada, reflejo corto, H1 nuevo y mayor en desktop; contenido e imagen con opacity 1 y movimiento por transform. Ultima palabra termina aproximadamente en 1.61 s. Movimiento nuevo finito y fallback reduced-motion revisado por codigo, no por preferencia del SO emulada.
- Catalogo con recarga destacada, fotos completas, tres columnas en lg y accesorios horizontales en movil. Nueve links nativos para ampliar, con aviso de nueva pestana; filtros y seleccion originales preservados.
- Compuerta final Node20.20.2: lint sin errores/avisos; 10 suites/53 tests; npm run build exitoso con 42 paginas. Home 5.76 kB/101 kB First Load JS (base previa 5.42/101). git diff --check limpio. Sin cambios en endpoint, nombres/precios, contacto, formulario/provider, paquetes o lockfile.
- QA local sobre build: 320/375/390/768/1440 sin overflow; proporcion identica de bidon/reflejo, incluido tablet. 9imagenes cargadas, filtros9/4/3/2, seleccion de9 nombres y hash repetido; pedido h2 top191.75px contra header113px, sin quedar tapado. CTA hero bottom<=498.2px en los tamanos moviles comprobados.
- Catalogo final a390px: 3533px contra6715.25px de base, reduccion47.4%. Formulario h2 a6061.53px contra9110.03px de base. Desktop1440: catalogo2090.5px contra4563.98px de base. No se ocultan productos.
- Lighthouse snapshot movil: accesibilidad, buenas practicas, SEO y agentic100; 34 aprobados, cero fallos. No mide rendimiento. Sin declaracion LCP/INP de campo, telefono fisico, cross-browser, autenticacion o envio de pedidos reales.
- El humano autorizo cerrar el servidor de Claude en3000 para compuerta. Servidor propio de QA3015 cerrado al terminar; 3000/3001/3015 libres. Sin commit ni push; todos los archivos en esta carpeta y main.
- Entregada asesoria de verano como propuesta de render fisico + composicion. No se produjo ni integro otro video; guion3.6s exige enmienda posterior de ADR0003, que actualmente limita2.4s.

### 2026-10-13 · claude revisa · APROBADA
- Revision independiente por Claude Code CLI en modo solo lectura, sin herramientas. Primera pasada CAMBIOS: proporcion de imagen/reflejo con altura fija en tablet. Corregido con h-auto y mismos anchos adaptativos.
- Segunda llamada tuvo error interno de parseo, sin veredicto util. Tercera llamada produjo APROBADA: sin bloqueos nuevos en Hero, ProductGrid, ProductoImagen ni globals.css. Resultado completo guardado en TEMP/viflomax-vfx025-claude-review-confirm.json; no es autoaprobacion de Codex.
- Observaciones no bloqueantes: flotado de una sola vez intencional, scrollIntoView de respaldo intencional para hash repetido, reflejo con misma URL optimizada de la imagen principal. Claude no inspecciono el bitmap ni browser; la evidencia visual anterior es de Codex.

## Commit de la implementacion aprobada

Los comandos exactos estan en .agents/ENTREGA-PORTADA.md. Se incluyen los 4 archivos de aplicacion, PNG/prompt, tarea, critica aprobada y asesoria. No incluir entornos, node_modules ni .next.
