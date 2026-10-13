# Dirección de verano: frescura con acabado de publicidad

Fecha: 2026-10-13. Propuesta posterior a VFX-025; todavía no se produce ni integra otro video.

## Recomendación

Preparar una pieza prerenderizada: agua física en Blender/Cycles y composición en After Effects, o el compositor de Blender si no se dispone de Adobe. La web muestra el resultado como video decorativo. Tipografía, botones y producto siguen siendo HTML e imagen independientes.

La escena debe sugerir frío, pureza y verano alrededor del bidón: condensación, luz lateral azul suave, una lámina corta de agua y cáusticas en el fondo. Evitar un barrido grande que tape el mensaje. El realismo depende de iluminación, espesor, refracción y contacto; no de aumentar el brillo.

## Tratamiento visual

- Bidón identificable desde el cuadro inicial, etiqueta intacta. La foto recortada de VFX-025 es la referencia de encuadre y color.
- Agua casi incolora. El azul viene principalmente de la luz y del entorno. Un frente curvo irregular, con espesor variable, sin borde triangular continuo.
- Condensación de tamaños variados; dos o tres gotas con recorrido lento bastan. Evitar partículas uniformes flotando por toda la pantalla.
- Luz grande lateral y contraluz controlado para revelar bordes y volumen. Reflejo de apoyo corto; el producto no debe parecer que gira suspendido sin peso.
- Fondo izquierdo tranquilo para conservar lectura. La energía visual se concentra en la zona del producto.

## Cómo lo produciría

1. Primero aprobar un cuadro estático completo, con fondo, bidón, texto y CTA. El agua sola sobre negro no valida la escena final.
2. Para el fluido, preparar dominio, flujo y malla de líquido. Blender permite separar el cálculo del líquido y su malla visible. [Manual de malla líquida](https://docs.blender.org/manual/en/3.6/physics/fluid/type/domain/liquid/mesh.html).
3. Renderizar un material transmisivo que refleje y refracte. Como punto de partida artístico: transmisión 1, IOR cercano a 1,33 y rugosidad baja; ajustar con referencias, no tratar esos valores como garantía. El Principled BSDF separa transmisión, reflexión y rugosidad. [Manual de materiales](https://docs.blender.org/manual/en/4.5/render/shader_nodes/shader/principled.html).
4. Conservar pases de iluminación/reflejos y una máscara para proteger la marca. Componer sobre el fondo real de destino, con la cámara y perspectiva ya fijadas. El compositor de Blender puede cubrir esta etapa; After Effects facilita ajuste fino y versiones.
5. En After Effects, un mapa de desplazamiento puede deformar una capa usando otra capa de control. Aplicarlo al fondo de la composición para el acabado óptico, manteniendo etiqueta y textos protegidos. No confundir este truco con una simulación física de fluido. [Adobe: Displacement Map](https://helpx.adobe.com/after-effects/desktop/apply-effects-and-animation-presets/list-of-effects/distort-effects.html).
6. Generar desktop y móvil con encuadres propios; no recortar automáticamente una sola película horizontal. Codificar versiones WebM/MP4 sin audio y un poster coherente con el cuadro inicial.

## Guion a explorar

Propuesta de 3,6 s, con una sola reproducción: 0–0,7 s luz y producto presentes; 0,7–2,4 s agua alrededor de la base y detrás del bidón; 2,4–3,6 s el fluido se asienta y queda una superficie calmada.

Este guion requiere enmendar expresamente la duración máxima de 2,4 s de la ADR 0003 y volver a medir los presupuestos de peso. No es un cambio realizado en VFX-025. Si se mantiene la ADR actual, se prepara un gesto de 2,4 s con menor recorrido, no una ola comprimida a mayor velocidad.

## Integración web

Mantener el poster y la imagen visibles antes de que cargue el video. Cargarlo como mejora progresiva, sin bloquear contenido. Video sin audio, muted y playsInline; autoplay puede ser rechazado y requiere fallback. [MDN: autoplay](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay).

Respetar reduced-motion, ahorro de datos y una sola reproducción por sesión. No quemar título, precios o CTA dentro del video. Para agua que refracta el fondo, prerenderizar ese fondo dentro del clip; screen sobre negro solo suma luz y no refracta el HTML que hay detrás.

## Decisión práctica

La ruta recomendada es **render físico + composición + video ligero**. Si hay fotografía de agua real bien iluminada y licenciada, también puede ser una excelente base de composición. CSS y el shader procedural existente son útiles para ambientación estilizada, pero no los usaría como pieza principal si el criterio de aprobación es agua fotorrealista.

No se afirma que After Effects o Blender estén instalados, que se haya comprado una licencia o que se haya renderizado este plan. La versión actual de VFX-025 mejora la escena estática y su entrada; esta pieza de verano es el siguiente trabajo de dirección de arte.
