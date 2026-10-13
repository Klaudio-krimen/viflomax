# Agua viva — propuesta creativa para la portada

Fecha: 2026-10-13 · Autor: Codex · Estado: propuesta visual, pendiente de integración y revisión de Claude.

**Estado vigente tras feedback:** la ola que atravesaba el hero se retiró por solicitud del usuario. Se eliminaron su elemento, estilos, keyframes y reinicio; el recurso ya no se carga. Se mantienen el titular palabra por palabra, la aparición de la imagen y el ritmo pausado. Los apartados de la ola que siguen documentan iteraciones anteriores, no el comportamiento actual.

Abrir [concepto.html](concepto.html) directamente en el navegador. Es una maqueta animada del hero y del catálogo completo, no una implementación del pedido. Usa recursos locales y funciona sin instalar paquetes. El hero reutiliza la imagen existente `public/productos/recarga-20l.jpg` con composición, flotación y un barrido de luz; no es un modelo 3D ni una simulación del agua. El botón «Pausar animación» permite comparar el diseño quieto y en movimiento.

## Revisión tras feedback del usuario

La primera maqueta mostraba solo dos de los nueve productos y un bidón SVG demasiado esquemático para el acabado solicitado. Se corrigió el catálogo para mostrar sus nueve imágenes, con nombres, descripciones y precios extraídos de `lib/productos.ts`. La recarga destacada abre la galería; los otros ocho productos tienen imágenes grandes en proporción vertical, sin el padding que antes las reducía a miniaturas. Los archivos originales permanecen intactos.

Se reemplazó el SVG del hero por la imagen de marca disponible, presentada con marco curvo, profundidad por composición, movimiento leve y luz que pasa una vez. Es una mejora del lenguaje visual aprovechando recursos existentes. Para rotación real del bidón, refracción y agua simulada sería necesario un recurso 3D o una secuencia renderizada específica; no se atribuyen esas capacidades a esta maqueta.

Las imágenes existentes son composiciones completas con producto, fondo y marca, no recortes transparentes del producto. Por eso se conserva su proporción y se evita superponer otra etiqueta sobre la galería o recortarlas agresivamente. La revisión inicial no detectó esta diferencia y les dio muy poco protagonismo.

Verificación de esta revisión: nueve imágenes del catálogo cargadas en Chrome; sin desbordamiento horizontal a 320, 390, 768 y 1440 px; nombres y precios contrastados automáticamente con el catálogo vigente; `git diff --check` en verde. Se mantiene el alcance de maqueta, sin integración ni publicación.

## Entrada cristalina y titular por palabras

### Revisión vigente: agua más realista y ritmo pausado

Por solicitud del usuario, el pase se amplió de 1,4 a **2,8 segundos**. Se sustituyó la ola SVG por un recurso de aspecto fotográfico generado con `image_gen`: [`assets/ola-cristalina-v2.png`](assets/ola-cristalina-v2.png). Tiene 1774 × 887 px, canal alpha con píxeles total y parcialmente transparentes y pesa 1 677 065 bytes. El prompt final y la procedencia se conservan en [`assets/ola-cristalina-v2.prompt.md`](assets/ola-cristalina-v2.prompt.md). El original generado se preservó y se copió el recurso a este directorio; no se editaron las imágenes del catálogo.

La cresta, los reflejos, las gotas y la textura son parte del bitmap. Su desplazamiento, escala y opacidad son animaciones CSS; no se simula agua en tiempo real. Las palabras duran 1100 ms cada una, con retrasos de 500 ms y separaciones de 180 ms. La imagen entra desde 1200 ms y queda visible a 2350 ms. El pase concluye a 2800 ms y el brillo posterior de la imagen permanece como detalle independiente. Los botones se colocan por encima de la ola para conservar su legibilidad.

Verificación vigente: recurso cargado en Chrome; estados intermedio y final inspeccionados; duración de la ola 2800 ms; palabras e imagen visibles al terminar; sin desbordamiento a 320, 375, 390, 768 y 1440 px; nueve productos conservados y CTA alcanzable. El fallback sin regla de movimiento mantiene texto e imagen visibles y cero animaciones. `git diff --check` pasó. Antes de integrar este bitmap en la aplicación será necesario revisar compresión y carga frente a la línea base de rendimiento. El límite inicial de 1,4 s de la propuesta anterior se reemplaza en esta maqueta por la nueva preferencia explícita del usuario; no se modifica la ADR canónica.

### Implementación anterior (referencia histórica)

A petición del usuario se añadió una ola translúcida que cruza el hero de izquierda a derecha. Sus capas SVG combinan gradientes transparentes, borde iluminado y líneas internas de luz. El movimiento usa únicamente transform y opacity; no es una simulación física de agua ni modifica las imágenes originales.

La pasada dura 1400 ms. Las cuatro palabras del H1 emergen desde máscaras con retrasos de 240, 340, 440 y 540 ms y una duración de 650 ms cada una. La imagen aparece desde 700 ms y queda completamente visible a 1350 ms. Los botones permanecen visibles y operables desde el inicio. El H1 ofrece su frase completa una sola vez a lectores de pantalla; la versión visual está marcada aria-hidden. Sin la media query de movimiento todo el contenido es visible, sin ola. La preferencia reduced-motion mantiene este estado estático.

El botón «Repetir entrada del hero» en el pie de la maqueta vuelve al hero y reinicia las animaciones de entrada. Se conserva el control de pausa. El replay se oculta para reduced-motion. Estos controles son de revisión del prototipo, no una nueva dependencia de la aplicación.

Verificación en Chrome: se inspeccionó la secuencia a 650 y 1400 ms. Al finalizar, las cuatro palabras y la imagen tienen opacidad 1, la ola opacidad 0 y el CTA sigue alcanzable con hit testing. Sin desbordamiento a 320, 375, 390, 768 y 1440 px; nueve productos conservados. Se comprobó el fallback desactivando temporalmente la regla CSS de movimiento: cero animaciones, texto e imagen visibles. Esto verifica el fallback CSS y no constituye una emulación de la preferencia del sistema. Replay comprobado; `git diff --check` pasó. Compuerta de la aplicación e integración siguen pendientes porque esta entrega solo modifica la maqueta y su documentación.

## Diagnóstico de la portada actual

Revisión del checkout `D:\CLAUDEKODE\viflomax`, reglas canónicas, handoff previo, ADR 0002 y tareas VFX-015 a VFX-020. Inspección local de la home en Chrome a 1440 × 900 y con emulación móvil real de viewport 390 × 844. El puerto 3000 estaba ocupado por Radar Organizacional; Viflomax se levantó en 3001 y se comprobó el título antes de evaluarlo.

| Hallazgo | Impacto | Cambio propuesto |
|---|---|---|
| Hero centrado con un logo grande, sin producto | La marca se identifica, pero el comprador todavía no ve qué recibirá | Dos columnas: mensaje y CTA a la izquierda; bidón con volumen a la derecha. Logo en navegación |
| En 390 px el CTA principal empieza en y=728 y el secundario termina en y=868, fuera de la pantalla de 844 px | La primera pantalla dedica demasiado espacio a logo, separaciones y titular | Compactar header y padding; H1 móvil en tres líneas controladas; bidón debajo de los CTAs |
| WhatsApp flotante se superpone a la zona inferior de los CTAs en móvil | Compite visualmente con la acción de compra | Reservar espacio para el botón o cambiar su presentación móvil; comprobar todas las anclas y el final del formulario |
| Gotas cayendo en catálogo y cobertura, logo flotante | Hay movimiento, pero poca sensación de material, frescura y volumen | Concentrar la firma visual en agua, reflejos y un bidón; bajar intensidad en contenido y formulario |
| Catálogo largo antes del formulario | La selección de producto sí funciona, pero el recorrido puede sentirse extenso | Acceso inmediato a recargas y envases con jerarquía clara; conservar filtros y selección existentes |
| Copy «proceso certificado», «mismo día», descuentos recurrentes | Son promesas comerciales que requieren respaldo; esta revisión no acredita su vigencia | Incorporar evidencia real o usar mensajes verificables: formatos, comunas y confirmación del pedido |

No hubo scroll horizontal en las dos vistas observadas. Se probó «Pedir este» en Envase 20 Litros: navegó a `#pedido` y seleccionó ese producto correctamente. No se envió ningún pedido ni se comprobó la base de datos.

## Dirección de arte

**Concepto: Agua viva.** Una presencia limpia, cercana y contemporánea. Azul profundo como escenario, agua azul clara como material y verde oscuro como acción de compra. Mantener Nunito en títulos, Outfit en cuerpo, fondos blancos fuera del hero y tokens existentes. El carácter premium proviene del volumen, la composición y el ritmo.

- Hero de proporción aproximada 1,2 / 0,8 en escritorio. En móvil, mensaje → CTAs → producto, sin altura mínima de pantalla completa.
- Bidón con hombros, nervaduras, reflejo vertical y agua recortada dentro de su silueta. La iluminación y la sombra crean una apariencia de volumen 2,5D sin motor 3D.
- Titular estable: «Agua purificada a domicilio». Descripción concreta: «Recargas, bidones y dispensadores para tu casa. Entregamos en Maipú y Padre Hurtado».
- «Pedir ahora» domina; «Ver productos» tiene menor peso. Comunas y condiciones de precio permanecen legibles y quietas.
- Separador de una sola ola. Alternar áreas quietas y áreas con movimiento; evitar animar todos los bloques a la vez.
- En catálogo, foto real y precio tienen prioridad. La maqueta reutiliza las fotos disponibles; revisar consistencia de encuadre antes de producción.

## Guion de animación recomendado

| Elemento | Movimiento | Duración / condición |
|---|---|---|
| Mensaje del hero | Entrada corta por bloques, texto completo accesible desde el HTML | 450–650 ms; secuencia completa ≤ 1,4 s |
| Bidón | Flotación de 5–8 px y balanceo máximo de 1 grado | 7–9 s, suave; solo decoración |
| Agua interior | Dos olas a velocidades diferentes dentro de una máscara SVG | 7 y 11 s; recorridos cortos |
| Luz | Dos superficies de luz de baja opacidad detrás del producto | 18–26 s; evitar que iluminen el fondo del texto |
| Reflejo del bidón | Barrido discreto sobre el volumen | Una vez al entrar; luego quieto |
| Tarjeta de producto | Elevación 3–4 px y escala de imagen 1,025 | 200–300 ms, hover y focus-within |
| CTA | Presión leve; llenado oscuro opcional | 150–300 ms; foco visible; posición fija |
| Formulario | Mensaje de estado tras una respuesta real | Entrada única; sin movimiento continuo detrás de los inputs |

El precio nunca cuenta desde cero y el CTA no espera a terminar una animación. Reduced-motion muestra toda la composición estática. Los loops de la maqueta se pueden pausar; en producción aplicar también control de movimiento o ciclos finitos cuando corresponda. Las entradas del H1 deben validarse contra el LCP: no se debe ocultar o retrasar el elemento más grande si empeora la métrica.

## Ajustes al plan existente antes de implementar

1. **VFX-015:** mantener CSS primero, estado visible por defecto, generadores deterministas y fallback estático. Registrar baseline de build y rendimiento antes de cambios.
2. **VFX-016:** priorizar texto estable sobre palabra rotativa. «El Mismo Día» depende de respaldo operativo. El brillo que empieza en 1600 ms no cabe en una coreografía completa de ≤ 1,4 s: definirlo como efecto posterior opcional o retirarlo. Probar contraste de las capas realmente compuestas, no asumir que el scrim garantiza AA.
3. **VFX-017:** llevar el protagonismo al bidón con nervaduras y reflejos; reducir tamaño del logo en el hero. Resolver primero el layout móvil. Recontar elementos animados: las 14 burbujas de VFX-016, burbujas internas, palabras, olas y luz pueden superar juntas el límite de 30. Recomiendo 6 burbujas exteriores y 4 interiores como máximo inicial.
4. **VFX-018:** una entrada corta por tarjeta; hover solo donde hay puntero fino. El escalonado por `índice % 3` no representa las columnas reales en móvil o tablet: adaptar la variable por breakpoint o eliminarlo. Encabezado server pasado desde la página al catálogo client para preservar el presupuesto de JS. La ADR exige +0 KB, pero esta tarea admite +0,3 KB: unificar ese criterio antes de implementar.
5. **VFX-019:** fondo suave en información; formulario predominantemente quieto para facilitar la lectura. Revisar si el blur aporta suficiente valor para su coste de pintura.
6. **VFX-020:** reservar las cáusticas WebGL para una prueba aislada posterior. La primera propuesta ya logra profundidad con SVG y CSS. Si se evalúa 3D real, exigir fallback, pausa fuera de vista, liberación de recursos y comparación de rendimiento móvil.

El handoff previo contiene una instrucción histórica de checkout solo por WhatsApp y textos de precio que difieren del código actual. La implementación vigente guarda por `POST /api/pedidos/publico` y luego abre WhatsApp: `CLAUDE.md` y ese flujo son la autoridad. Esta propuesta conserva esa arquitectura y los nombres y precios de `lib/productos.ts`.

## Orden de trabajo

Primero: composición del hero, producto visible y CTA móvil despejado. Después: VFX-015 → VFX-016 → VFX-017; finalmente VFX-018 y ajustes seleccionados de VFX-019. El desbloqueo de WhatsApp (VFX-009) y la fricción del formulario (VFX-010) son mejoras de conversión paralelas al diseño, no sustituidas por efectos.

Antes de integrar: contraste AA medido en el peor punto; teclado y foco; 320, 375, 390, 768 y 1440 px; reduced-motion; navegadores sin animaciones por scroll; imágenes y fuentes; LCP/CLS/INP respecto de baseline. Compuerta obligatoria `npm run lint && npx jest && npm run build`, revisión cruzada y merge humano.

## Alcance y evidencia

La maqueta se abrió desde `concepto.html` en Chrome y se comprobó a 320, 375, 390, 768 y 1440 px: imágenes locales cargadas y sin desbordamiento horizontal. En 390 × 844 ambos CTAs aparecen completos alrededor de y=347–400, frente a y=728–868 en la home vigente. El control de pausa actualizó `aria-pressed` y detuvo todas las animaciones activas. Se revisó por código la media query de reduced-motion, pero no se emuló esa preferencia en navegador. `git diff --check` pasó. La maqueta usa la tipografía del sistema para funcionar offline; la integración utilizará Nunito y Outfit ya presentes y deberá revisar de nuevo sus saltos de línea.

Se añaden únicamente este documento y una maqueta HTML dentro del handoff de diseño. No se modifican componentes de aplicación, contratos, datos, dependencias ni tareas existentes. La compuerta de la aplicación no se ejecuta por esta revisión de diseño y no se declara ninguna tarea implementada, hecha o lista para producción. La emulación local no acredita un teléfono físico, otros navegadores ni producción.
