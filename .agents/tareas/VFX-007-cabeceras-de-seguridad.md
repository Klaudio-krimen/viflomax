---
id: VFX-007
titulo: Agregar cabeceras HTTP de seguridad en next.config.mjs
estado: lista
prioridad: p2
asignado:
revisor: claude
area: infra
depende_de: []
blueprint:
rama:
archivos: [next.config.mjs]
bloqueo:
creado: 2026-10-05
actualizado: 2026-10-05
---

## Contexto

`next.config.mjs` solo emite `Permissions-Policy: geolocation=(self)`. Faltan protección contra
clickjacking del panel admin, `nosniff`, política de referer y HSTS.

## Criterios de aceptación

- [ ] CUANDO se corre `curl -sI http://localhost:3000/` sobre `npm run build && npx next start` EL
      SISTEMA DEBERÁ incluir `X-Content-Type-Options: nosniff`,
      `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`,
      `Strict-Transport-Security: max-age=63072000; includeSubDomains` y la `Permissions-Policy`
      ampliada con `camera=(self), microphone=()`.
- [ ] CUANDO se usan `/chofer` (cámara para fotos, GPS, mapa Leaflet) y la landing (fuentes,
      imágenes, WhatsApp) EL SISTEMA DEBERÁ funcionar igual; anotar la prueba manual.
- [ ] `npm run lint && npx jest && npm run build` sale con código 0.

## Fuera de alcance

- `Content-Security-Policy`: requiere inventariar orígenes (Cloudinary, tiles de Leaflet, scripts
  inline de Next). Va en otra tarea, empezando en modo `Report-Only`.

## Bitácora

### 2026-10-05 · claude · → lista
- Hallazgo S6 de la auditoría.

## Revisión
