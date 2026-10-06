---
id: VFX-012
titulo: SEO local — metadatos completos, JSON-LD LocalBusiness, sitemap y robots
estado: lista
prioridad: p1
asignado:
revisor: claude
area: landing
depende_de: []
blueprint:
rama:
archivos: [app/layout.tsx, app/(public)/layout.tsx, app/sitemap.ts, app/robots.ts, components/public/DatosEstructurados.tsx, lib/contacto.ts, lib/landing/**]
bloqueo:
creado: 2026-10-05
actualizado: 2026-10-05
---

## Contexto

El negocio vive de búsquedas locales («agua purificada Maipú», «bidones a domicilio Padre
Hurtado»), pero la landing:

- No tiene `sitemap.xml`, `robots.txt`, Open Graph, `metadataBase` ni imagen para compartir:
  al compartirla por WhatsApp sale sin vista previa.
- No tiene datos estructurados (`LocalBusiness`): Google no recibe zona, horario ni teléfono.
- `title` y `description` mencionan solo Maipú; `lang="es"` en vez de `es-CL`.
- Nada impide indexar `/admin`, `/chofer` o `/login`.

## Criterios de aceptación

- [ ] CUANDO se pide `/robots.txt` EL SISTEMA DEBERÁ permitir `/` y prohibir `/admin`, `/chofer`,
      `/api`, `/login` y `/cambiar-password`, y enlazar el sitemap.
- [ ] CUANDO se pide `/sitemap.xml` EL SISTEMA DEBERÁ listar `/` y `/contacto`.
- [ ] CUANDO se inspecciona el `<head>` de `/` EL SISTEMA DEBERÁ tener `title` y `description` con
      Maipú **y** Padre Hurtado, `og:title`, `og:description`, `og:image`, `og:locale=es_CL`,
      `twitter:card` y `<html lang="es-CL">`.
- [ ] CUANDO se inspecciona `/` EL SISTEMA DEBERÁ incluir un `<script type="application/ld+json">`
      `LocalBusiness` con nombre, teléfono, horario y `areaServed` tomados de `lib/contacto.ts`
      (nunca literales), construido por una función pura en `lib/landing/` con test.
- [ ] La URL base sale de `NEXT_PUBLIC_SITE_URL`, documentada en `.env.example` y en la tabla de
      entorno de `CLAUDE.md`.
- [ ] `npm run lint && npx jest && npm run build` sale con código 0.

## Notas de implementación

El humano debe dar el dominio de producción. Si falta, la tarea queda `bloqueada` con ese motivo.
Imagen OG: usar `app/opengraph-image.tsx` (ya hay `icon.tsx` como patrón). Validar con
https://search.google.com/test/rich-results.

## Bitácora

### 2026-10-05 · claude · → lista
- Hallazgo L4 de la auditoría.

## Revisión
