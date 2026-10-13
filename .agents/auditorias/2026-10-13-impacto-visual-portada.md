# Revisión visual de portada y assets de Claude

Fecha: 2026-10-13. Autor: Codex. Skill aplicada: design:design-critique.
Base: main, commit 7aa715a. Revisión de lectura y propuesta; sin cambios de aplicación.

## Conclusión

La portada tiene una base clara y consistente, pero su protagonista todavía se presenta como una fotografía comercial dentro de una tarjeta. El salto visual más útil es mejorar la composición y la imagen del producto. La ola debe acompañar esa escena; su integración, por sí sola, no dará a la portada el acabado buscado.

## Qué cambió Claude y qué sigue pendiente

- 7aa715a ajusta coordinación, scripts y el preview de la ola sobre el fondo del hero real. No modifica Hero.tsx, ProductGrid.tsx ni globals.css frente a d55bf17.
- VFX-023 produjo los cuatro videos; VFX-024 sigue lista. En www.viflomax.cl hay cero elementos video: el asset no está integrado.
- Vercel CLI y GitHub confirman Production Ready del commit 7aa715a. Se inspeccionó el dominio público www.viflomax.cl, sin enviar formularios ni pedidos.
- Las hojas de contacto compuestas contienen el fondo, la ola y el scrim; no incluyen el título, las llamadas a la acción ni la imagen del bidón. No prueban todavía la composición con el contenido completo.

## Qué funciona

Azul profundo, texto de alto contraste, CTA verde, lectura clara y producto identificable. En móvil, los CTAs preceden a la imagen y están visibles en la primera pantalla. La preferencia de movimiento reducido tiene fallback en CSS. El catálogo conserva los nueve productos y sus nombres/precios originales.

## Hallazgos y prioridades

| Prioridad | Hallazgo observado | Mejora propuesta | Resultado buscado |
|---|---|---|---|
| P1 | La imagen del hero es una foto rectangular con fondo propio, dentro de un marco girado. | Preparar un recorte limpio del bidón real, preservando etiqueta, proporciones y color. Darle mayor escala en desktop, sombra de contacto y un reflejo inferior corto. Simplificar los marcos orbitales. | Que el producto parezca presente en la escena y tenga mayor protagonismo. |
| P1 | Imagen y texto se ocultan inicialmente por las animaciones; la imagen espera 1,2 s y aparece durante 1,15 s. | Imagen visible desde el primer cuadro, entrada por desplazamiento de 12–16 px. Palabras por máscara y transform, con ritmo pausado pero sin larga espera inicial. Mantener CTAs visibles y reduced-motion. | Una primera impresión completa, sin huecos mientras arranca el efecto. |
| P1 | El catálogo móvil mide aproximadamente 6.715 px a 390 px de ancho; el encabezado del formulario está a 9.110 px del inicio. | Mantener los nueve productos y filtros; usar una recarga protagonista y tarjetas más compactas para el resto. En móvil, imagen y datos en una fila para accesorios; en desktop, evaluar tres columnas para tarjetas estándar. Fotos completas con object-contain. | Reducir repetición y acercar la decisión de compra sin perder productos. |
| P2 | El H1 de desktop queda en 66 px y comparte peso visual con un área grande de fondo vacío. | Probar 76–88 px a 1440 px, con un ancho de texto controlado, y mantener 40–44 px en móvil. Mensaje propuesto: “Agua purificada. Tu casa abastecida.” Mantener la entrega a domicilio explícita en el apoyo. | Dar una firma visual más fuerte y una promesa breve. |
| P2 | Fondo oscuro con manchas difusas de bajo contraste; las secciones siguientes vuelven a bloques y tarjetas convencionales. | Una iluminación azul localizada detrás del bidón y cáusticas suaves en un área pequeña. Tras el hero, una franja de tres pasos reales: elegir, pedir y confirmar entrega. Dar continuidad de tipografía, color e imagen al resto de secciones. | Más profundidad y continuidad de marca. |
| P2 | Los renders de la ola tienen un contorno triangular muy definido y líneas internas repetitivas. | Redondear y variar el frente, interrumpir el borde luminoso continuo, reducir estrías uniformes y variar el espesor/curvatura de la lámina. Renderizar una prueba sobre el hero completo antes de integrar. | Que se lea como fluido y no como una lámina luminosa o vidrio. |

## Revisión específica de la ola

Opinión artística: funciona como motion graphic azul, pero aún no transmite agua cristalina convincente. En desktop el abanico se mantiene triangular; en móvil la línea frontal diagonal domina. Aumentar únicamente brillo o duración reforzaría esos rasgos.

La mezcla screen aporta luz al fondo; por sí sola no deforma ni refracta lo que hay detrás. No presentar ese asset como simulación físicamente realista. Si se busca mayor realismo, hay que preparar la composición con el fondo y la iluminación de destino, o una solución específica de refracción que mantenga legibles texto y botones.

Datos comprobados con ffprobe y tamaños de archivo:

| Asset | Bytes | Duración | Resolución | Audio |
|---|---:|---:|---|---|
| 16x9 MP4 | 362.086 | 2,4 s | 1440x810 | no |
| 16x9 WebM | 171.482 | 2,4 s | 1440x810 | no |
| 9x16 MP4 | 285.716 | 2,4 s | 720x1280 | no |
| 9x16 WebM | 116.629 | 2,4 s | 720x1280 | no |

Los pesos y formatos cumplen el presupuesto documentado. No se regeneraron assets ni se verificó de nuevo el determinismo de los renders. Esta revisión no sustituye la compuerta ni una revisión completa del shader.

## Secuencia recomendada

1. Mejorar el protagonista del hero y definir una composición estática convincente.
2. Ajustar tipografía y entrada del contenido sobre esa composición.
3. Compactar el catálogo sin eliminar productos.
4. Refinar la ola y comprobarla junto al contenido completo antes de integrar VFX-024.
5. Medir rendimiento y verificar móvil/reduced-motion al implementar. No añadir dependencias para este primer bloque.

Se conserva el diseño actual hasta que el humano elija ejecutar la propuesta. No se agregan testimonios, certificaciones, plazos ni cifras comerciales sin evidencia del negocio.

## Evidencia y límites

Inspección visual de producción a 1440x1000 y 390x844. Sin desbordamiento horizontal en esos dos tamaños. Lectura del código, diff del último commit y hojas de contacto desktop/móvil. No es una auditoría completa de accesibilidad, cross-browser, teléfono físico o rendimiento. No se atribuye una medición LCP a la duración de las animaciones.

Se intentó iniciar un servidor propio de revisión en 3015; se cerró al detectar que el árbol .next ya estaba en uso. El servidor de Claude en 3000 se conservó y devolvió 404 en la consulta realizada; la crítica visual se hizo sobre producción, sin modificar el entorno de Claude.

## Commit del informe

```powershell
git add .agents/auditorias/2026-10-13-impacto-visual-portada.md .agents/tareas/VFX-025-impacto-visual-portada.md
git commit -m "docs(landing): VFX-025 critica visual y propuesta de impacto para portada"
git push origin main
```

Sin commit ni push ejecutados por Codex. Este commit solo documenta la propuesta; no cambia la web.
