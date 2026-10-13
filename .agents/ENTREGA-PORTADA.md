# VFX-025 — Entrega lista para commit y push

Carpeta única: **D:\CLAUDEKODE\viflomax**. Rama: **main**, base 7aa715a.
Sin commit ni push realizados por Codex. Servidores 3000, 3001 y 3015 apagados.

## Resultado

- Bidón protagonista con PNG recortado y transparente; fuente comercial original intacta. Marca y palabras de la etiqueta verificadas visualmente, sin afirmar identidad pixel a pixel del edit de IA.
- Hero sin marco de tarjeta, iluminación localizada, reflejo corto y título “Agua purificada. Tu casa abastecida.” Imagen visible desde el comienzo, entrada por transform y palabra por palabra.
- Catálogo con nueve productos, fotos completas, ampliación en pestaña nueva, tres columnas desktop y accesorios horizontales en móvil. Filtros y pedido conservados.
- Dirección de verano documentada: render físico y composición tipo After Effects. No se produjo ni integró un nuevo video en esta tarea.

## Verificación

Node 20.20.2. Lint sin errores/avisos, 53 tests en 10 suites, build de 42 páginas aprobado. Home 5.76 kB y First Load JS 101 kB; base previa 5.42 kB/101 kB (redondeados).

QA sobre build local: 320/375/390/768/1440 px sin overflow; misma proporción de imagen/reflejo en tablet; nueve fotos cargadas; filtros 9/4/3/2; selección de los nueve nombres en formulario y ancla bajo el header.

A 390 px, catálogo de 3533 px frente a 6715,25 px: reducción 47,4%. Snapshot Lighthouse móvil: accesibilidad, buenas prácticas y SEO 100. No es auditoría de rendimiento ni verificación en teléfono físico.

Revisión independiente Claude Code: APROBADA tras corregir la proporción del hero en tablet. Registro y límites en VFX-025. Snapshot y revisión no sustituyen QA de producción después del push.

PNG de fuente 1122x1402, RGBA, 1.382.712 B; muestra optimizada local WebP 69.362 B. Prompt y modo incorporado image_gen registrados junto al asset.

## Commit y push del humano

Desde esta misma carpeta, ejecutar:

```powershell
git add app/globals.css components/public/Hero.tsx components/public/ProductGrid.tsx components/public/ProductoImagen.tsx public/productos/hero-bidon.png public/productos/hero-bidon.prompt.md .agents/tareas/VFX-025-impacto-visual-portada.md .agents/auditorias/2026-10-13-impacto-visual-portada.md .agents/auditorias/2026-10-13-direccion-verano-hero.md .agents/ENTREGA-PORTADA.md
git commit -m "feat(landing): VFX-025 producto protagonista y catalogo compacto"
git push origin main
```

Sin dependencias nuevas. Sin cambios en endpoint, nombres/precios, contacto, formulario/provider, admin/chofer, package o lockfile. No agregar entornos, node_modules, .next ni archivos PWA generados.

## Dirección para el verano

Leer [asesoría de verano](auditorias/2026-10-13-direccion-verano-hero.md). Es una propuesta de siguiente fase: materiales con refracción, iluminación de estudio y composición, con el agua concentrada alrededor del producto.

El guion propuesto de 3,6 s requiere una enmienda posterior de la ADR 0003, hoy limitada a 2,4 s. Se deberán actualizar los plates a la nueva composición del hero antes de volver a renderizar VFX-023/VFX-024. No se cambió esa ADR ni sus assets.
