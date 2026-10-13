---
id: VFX-023
titulo: Producir el video de la ola cristalina del hero con un shader WebGL en HyperFrames
estado: en-revision
prioridad: p2
asignado: claude
revisor: codex
area: landing
depende_de: []
blueprint:
rama: claude/VFX-023-ola-shader
archivos: [design_handoff_landing_redesign/agua-viva/video/**, public/video/hero-ola-*]
bloqueo:
creado: 2026-10-13
actualizado: 2026-10-13
---

## Contexto

ADR [`0003`](../decisiones/0003-video-ola-hero.md). Esta tarea produce **solo el asset**; la
integración en la web es VFX-024.

## Paso 1 — Plate

~~Plate generativo~~: se descartó (pipeline A). El agua la genera el shader del paso 2. No hay plate.

## Paso 2 — Composición HyperFrames (claude)

- [x] `design_handoff_landing_redesign/agua-viva/video/` contiene una composición HyperFrames con su
      propio `package.json` (Node ≥ 22, que **no** es el `.nvmrc` del proyecto; usar `npx -p node@22` o
      nvm). Nada se agrega al `package.json` raíz.
- [x] La composición dura 2,4 s a 30 fps. Es un frame source WebGL determinista (sin `Math.random`, `Date.now` ni rAF), con altas luces en `#a3d9f0` y cuerpo en `#2f9fd6`; el borde del vaso entra en 0–0,5 s, la lámina cruza en 0,3–1,5 s y las gotas y el brillo húmedo se apagan hasta el final; termina en **negro puro** (los últimos 4 frames).
- [x] Renderiza `public/video/hero-ola-16x9.webm` y `.mp4` (1440 × 810) y `public/video/hero-ola-9x16.webm` y `.mp4` (720 × 1280), sin pista de audio.
- [x] Pesos: 16:9 ≤ 700 kB y 9:16 ≤ 400 kB, por formato. Anotar en la bitácora los comandos de ffmpeg y los pesos reales.
- [x] `ffprobe` confirma que los cuatro archivos no tienen stream de audio y que duran ≤ 2,5 s.
- [x] Un README en `video/` explica cómo volver a renderizar.

## Fuera de alcance

- Tocar componentes de la app (VFX-024).

## Bitácora

### 2026-10-13 · claude · → bloqueada
- Intento de preflight en Higgsfield: costo de 35 créditos y saldo de 0,5. No se envió ningún job ni se gastó crédito.

### 2026-10-13 · claude · bloqueada → en-curso
- Claudio cambia a pipeline B (shader + HyperFrames, sin créditos) y asigna la composición a Claude. Codex revisa.
- FFmpeg 9.0.2 instalado con winget; `hyperframes doctor` en verde para Chrome y FFmpeg.

### 2026-10-13 · claude · en-curso → en-revision
- Hecho: composición HyperFrames en `design_handoff_landing_redesign/agua-viva/video/`. Hay una sola fuente del shader (`ola.js`, frame source WebGL con `registerFrameSource`) y dos cortes, `16x9/` y `9x16/`. `npm run render` hace todo: PNG, hojas de contacto, entregables y previews sobre el hero.
- Look dev en 4 iteraciones mirando hojas de contacto:
  1. Las estrías dominaban y se leían como lluvia; los bordes del abanico eran rectos; las cáusticas parecían humo; la ola salía de cuadro a 1,4 s.
  2. Bordes orgánicos y cáusticas nítidas, pero el filo lateral se dibujaba sin agua y la pared del vaso cruzaba el cuadro.
  3. Se corrigieron el filo y las gotas, y se bajó la dispersión cromática del frente.
  4. El vaso quedó solo como labio y se subió la exposición, porque compuesta bajo el scrim se veía apagada.
- Decisiones: no hay video con canal alfa (Safari no reproduce VP9 con alfa); va negro más `screen`. El vaso quedó reducido al labio: con paredes y reflejo ensuciaba la lámina.
- Entregables (`public/video/`): `hero-ola-16x9.mp4` 362 086 B · `.webm` 171 482 B · `hero-ola-9x16.mp4` 285 716 B · `.webm` 116 629 B. Todos están bajo el presupuesto (700 y 400 kB).
- `ffprobe`: los 4 archivos duran 2,400 s y tienen 0 streams de audio. Los últimos 6 cuadros tienen YMAX=16 (negro de rango limitado).
- Determinismo: dos renders completos seguidos produjeron archivos idénticos byte a byte.
- Codificación: H.264 `-preset veryslow -crf 26 -tune grain +faststart` y VP9 `-crf 40 -b:v 0`. Comandos en `codificar.sh`.
- `hyperframes lint` da 0 errores y 0 advertencias en los dos cortes.
- Compuerta: lint ✅ · jest ✅ (53 tests en 10 suites) · `next build` ✅ (`/` = 10,4 kB, First Load JS de 100 kB, línea base para VFX-024).
  ⚠ `npm run build` falla **antes** de Next, en `prisma generate`: EPERM al renombrar `query_engine-windows.dll.node`, porque otros procesos node tienen tomado el DLL (posiblemente el `next dev` de Codex). Este cambio no toca Prisma ni TypeScript. Hay que repetirla con los servidores apagados antes del merge.
- Entorno: FFmpeg 9.0.2 instalado con winget (en `%LOCALAPPDATA%\Microsoft\WinGet\Links`).
- Siguiente: Codex revisa (look, pesos, scripts). Después, VFX-024 integra el video en el hero.

## Revisión
