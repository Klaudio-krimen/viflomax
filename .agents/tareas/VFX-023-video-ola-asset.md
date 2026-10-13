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
rama:
archivos: [design_handoff_landing_redesign/agua-viva/video/**, public/video/hero-ola-*, .agents/decisiones/0003-video-ola-hero.md]
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

### 2026-10-13 · claude · nota (revisión del plan con Claudio)
- Claudio confirma que la ola sigue en pie como **capa de temporada** sobre la portada aprobada en VFX-021 (que se aprobó "sin ola"). Se enmienda la ADR 0003 §4: el H1 conserva el ritmo pausado, pero solo con `transform`, y la imagen y las palabras quedan con opacidad 1 desde el cuadro 0.
- El preview sobre el hero estaba compuesto sobre un degradado azul→verde que no es el hero real. Ahora `codificar.sh` captura con Chrome headless `plate-hero.html` (réplica del fondo de `Hero.tsx`: azul-900 y dos manchas difusas) y compone plate → ola en `screen` → scrim negro/30. Sobre el azul-900 real los brillos se leen bien: **no hace falta subir la exposición** y los entregables no cambian. También genera `renders/hoja-hero-*.png`.
- **Corrección a la bitácora anterior:** el MP4 sí es reproducible byte a byte, pero el **WebM (VP9 con `-row-mt 1`) no lo es**: al recodificar cambian los bytes, aunque no la imagen. Se restauraron los WebM commiteados para no generar un diff vacío. Si hace falta determinismo estricto, hay que quitar `-row-mt 1`.
- `.hyperframes/` sale del índice de git (`git rm --cached`); ya estaba en `.gitignore`.
- `rama:` vacío (ADR 0004). El asset ya está en `main` desde `d602a27`.
- Siguiente: Codex revisa el look sobre `renders/hoja-hero-*.png` y `preview-hero-*.mp4` (`npm run render` los regenera), los pesos y los scripts.

## Commit

```bash
git add design_handoff_landing_redesign/agua-viva/video/.gitignore design_handoff_landing_redesign/agua-viva/video/codificar.sh design_handoff_landing_redesign/agua-viva/video/plate-hero.html design_handoff_landing_redesign/agua-viva/video/README.md .agents/decisiones/0003-video-ola-hero.md .agents/tareas/VFX-023-video-ola-asset.md .agents/tareas/VFX-024-integrar-video-ola-hero.md
git add -u design_handoff_landing_redesign/agua-viva/video/16x9/.hyperframes design_handoff_landing_redesign/agua-viva/video/9x16/.hyperframes
git commit -m "chore(landing): VFX-023 preview de la ola sobre el hero real y enmienda de la ADR 0003"
git push
```

## Revisión
