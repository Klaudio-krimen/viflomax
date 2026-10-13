# 0003 — Video de ola cristalina en el hero (enmienda a la 0002)

- **Fecha:** 2026-10-13
- **Estado:** aceptada (Claudio, 2026-10-13: pipeline **B**, tiempos de agua de ~2,4 s; la composición la hace Claude).
  Enmendada el mismo día (§4): la ola es una **capa de temporada** sobre la portada aprobada en VFX-021,
  que se aprobó "sin ola"; Claudio confirma que el video va encima igual.
- **Enmienda:** ADR 0002 §1 (+0 KB de JS) y la fila "coreografía ≤ 1,4 s" del presupuesto
- **Tareas:** VFX-023 (asset), VFX-024 (integración web)

## Contexto

Para la temporada de verano se quiere una entrada de hero en la que un vaso se vuelca y una ola
de agua cristalina barre el hero antes de que aparezcan el texto y la imagen. Las pruebas CSS/SVG y
bitmap de la maqueta `design_handoff_landing_redesign/agua-viva/` no lograron un agua creíble. Un
fluido fotorrealista no se puede hacer en tiempo real con CSS.

## Decisión

1. **Pipeline B (sin créditos):** el agua es un **shader WebGL procedural** dentro de una composición
   **HyperFrames** (frame source determinista, `render(t)`), renderizado sobre **negro puro** y
   codificado con FFmpeg. No se dibuja el cuerpo del agua, solo su luz (frente con borde Fresnel y
   dispersión cromática, cáusticas, espuma, estrías de flujo, gotas con desenfoque de movimiento y el
   borde del vaso en línea de luz). Estética: motion graphics premium, no fotorrealismo.
   La composición vive fuera de la app (`design_handoff_landing_redesign/agua-viva/video/`) con su
   propio `package.json`. **No entra nada al `package.json` del proyecto.** Se descartó el pipeline A
   (video generativo) por costo en créditos.
2. **El video es solo una capa decorativa.** H1, subtítulo, CTAs e imagen siguen siendo HTML y nunca
   esperan al video. El video va **debajo** del scrim y del contenido, con `mix-blend-mode: screen`:
   el negro desaparece y solo quedan los brillos del agua sobre el azul profundo.
3. **Se permite una isla cliente de ≤ 1,5 kB gzip** (`HeroOla`). Esta isla:
   - inserta el `<video>` después del primer pintado (`requestIdleCallback`, con `setTimeout` como fallback); el video no puede ser candidato a LCP;
   - no lo carga con `prefers-reduced-motion`, con `navigator.connection.saveData` ni con `effectiveType` en `2g`/`3g`;
   - lo reproduce **una vez por sesión** (`sessionStorage`, siempre envuelto en `try/catch`);
   - se retira del DOM al terminar (`ended`). Si `play()` falla, no deja rastro.
4. **Tiempos:** el agua dura ≤ 2,4 s. El H1 **empieza** a revelarse en t ≤ 0,5 s, con o sin video, y
   conserva el ritmo pausado aprobado en VFX-021 (termina cerca de 2,1 s). Ese ritmo se logra solo
   con `transform` (máscara por palabra): las palabras y la imagen del hero tienen **opacidad 1 desde el
   primer cuadro** y nunca parten de `opacity: 0`, para que sigan siendo candidatas a LCP.
   *(Enmienda del 2026-10-13: antes decía "el H1 completo termina en ≤ 1,2 s".)*
5. **Peso:** WebM (VP9 o AV1) más MP4 (H.264) como fallback. 16:9 a 1440 × 810 en ≤ 700 kB y 9:16 a
   720 × 1280 en ≤ 400 kB, elegidos con `<source media>`. Sin audio (sin pista de audio).

## Consecuencias

- El First Load JS de `/` puede subir hasta 1,5 kB; cualquier otra tarea sigue bajo +0 kB.
- Si el visitante entra con red lenta, ve el hero sin agua. Es aceptable: el agua es el postre, no el plato.
- Cambiar la temporada (invierno, por ejemplo) es re-renderizar la composición, no tocar la app.
- Apagar la ola es quitar `<HeroOla />` de `Hero.tsx`. Los archivos de `public/video/` quedan publicados
  aunque no se usen (≈ 0,9 MB en total; no afectan la carga de la página).
