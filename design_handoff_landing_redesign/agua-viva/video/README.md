# Ola cristalina — video del hero (VFX-023, ADR 0003)

Shader WebGL procedural renderizado con [HyperFrames](https://hyperframes.heygen.com) y codificado con
FFmpeg. Solo dibuja la **luz** del agua sobre negro puro: en la web se mezcla con
`mix-blend-mode: screen`, el negro desaparece y quedan los brillos sobre el hero.

## Requisitos

- Node ≥ 22 (no es el Node 20 de la app; este directorio tiene su propio `package.json` y no toca el de la raíz).
- FFmpeg en el PATH (`winget install --id Gyan.FFmpeg -e`).
- `npx --yes hyperframes@0.8.153 doctor` en verde para Chrome y FFmpeg.

## Comandos (desde este directorio)

| Comando | Qué hace |
|---|---|
| `npm run lint` | Valida los dos cortes con `hyperframes lint` |
| `npm run preview:16x9` / `preview:9x16` | Studio de HyperFrames para mover el cursor de tiempo |
| `npm run render` | PNG de los dos cortes → hojas de contacto → `public/video/hero-ola-{16x9,9x16}.{mp4,webm}` + previews sobre el hero en `renders/` |

`renders/` está ignorado por git. Para revisar sin abrir un video, mira `renders/hoja-*.png` (la ola sola) y `renders/hoja-hero-*.png` (compuesta sobre el hero), con un cuadro cada 0,2 s.

## Estructura

| Archivo | Rol |
|---|---|
| `ola.js` | **Única fuente** del shader y del frame source (`registerFrameSource`). Los scripts lo copian a cada corte antes de renderizar |
| `16x9/index.html` | Corte desktop 1440 × 810: el vaso se vuelca arriba a la derecha y la ola barre en diagonal |
| `9x16/index.html` | Corte móvil 720 × 1280: la ola cae de arriba hacia abajo con una leve diagonal |
| `render-hoja.sh`, `codificar.sh` | Render a PNG + hoja de contactos; codificación final y previews |
| `plate-hero.html` | Réplica del fondo de `components/public/Hero.tsx` (azul-900 y dos manchas). `codificar.sh` la captura con Chrome headless (variable `CHROME` si no está en la ruta por defecto) y compone plate → ola en `screen` → scrim negro/30. **Si cambia el fondo del hero, hay que actualizarla** |

El encuadre de cada corte se ajusta en los `data-ola-*` del `#root`: `ox` y `oy` son el labio del vaso
(fracción del ancho y de la altura) y `dx` y `dy` son la dirección del flujo.

## Guion (2,4 s, 30 fps, 72 cuadros)

| t (s) | Qué pasa |
|---|---|
| 0,0–0,7 | El labio del vaso entra en línea de luz y se inclina |
| 0,2–1,8 | La lámina sale del labio en abanico y cruza el cuadro: frente con filo Fresnel y dispersión cromática, cáusticas, estrías de flujo y espuma |
| 0,4–1,6 | Las gotas se desprenden por delante del frente, con gravedad y estela de movimiento |
| 0,9–2,1 | La cola cruza; queda un brillo húmedo de cáusticas que se apaga |
| 2,26–2,4 | Negro exacto (últimos 4 cuadros), para que en la web no quede ningún resto |

## Reglas

- Determinista: nada de `Math.random`, `Date.now` ni `requestAnimationFrame`. Todo depende de `t`.
  Los PNG y el MP4 son idénticos byte a byte entre renders; el WebM no (VP9 con `-row-mt 1`), aunque la imagen es la misma.
- Colores de marca en el shader: `#2f9fd6` (cuerpo) y `#a3d9f0` (altas luces).
- Presupuesto (ADR 0003): 16:9 ≤ 700 kB y 9:16 ≤ 400 kB por formato, sin pista de audio.
