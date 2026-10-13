# Agua Viflomax

Sistema de pedidos de agua purificada a domicilio en Maipú y Padre Hurtado. Landing pública con
pedido inline, más panel `/admin` y app de `/chofer`.

## Comandos

| Tarea | Comando |
|---|---|
| Dev server | `npm run dev` — http://localhost:3000 |
| Build (incluye `prisma generate` y el chequeo de tipos) | `npm run build` |
| Lint | `npm run lint` |
| Tests (todos) | `npx jest` |
| Tests (un archivo) | `npx jest lib/landing/gotas.test.ts` |
| Instalar (solo si falta `node_modules`) | `npm ci` |

**Compuerta:** `npm run lint && npx jest && npm run build` tiene que pasar antes de marcar cualquier
tarea como hecha. No hay script `typecheck`: el chequeo de tipos vive dentro de `npm run build` y
dentro de ts-jest.

La versión de Node está fijada en `.nvmrc` (20). Las versiones de dependencias están en
`package-lock.json` — se leen de ahí, nunca se adivinan.

## Stack

Next.js 14 App Router · TypeScript · Tailwind 3 (`tailwind.config.ts`) · PostgreSQL · Prisma 5 ·
NextAuth v4 · Vercel. Gestor de paquetes: **npm**. Sin `src/`: `app/`, `components/`, `lib/` y
`types/` cuelgan de la raíz, y el alias `@/` apunta a la raíz.

## Arquitectura

**Camino de una request real.** Visitante → `app/(public)/page.tsx` (Server Component) → `<Hero />`
(server) y `<PedidoProvider>` (client) envolviendo `<ProductGrid />` (client), `<PorQueElegirnos />`
y `<Cobertura />` (server, pasados como children) y `<PedidoForm />` (client) → al enviar,
`fetch('/api/pedidos/publico')` → `app/api/pedidos/publico/route.ts` → `lib/db.ts` (Prisma) →
PostgreSQL. La respuesta 201 trae `numero_pedido`, y recién entonces se abre `wa.me`.

**Fronteras.** Cruzar una de éstas al revés rompe el build:

| Capa | Puede importar de | Nunca debe |
|---|---|---|
| `app/**` (rutas) | `components`, `lib` | Consultar la base fuera de `app/api/**` |
| `components/public/**` | `lib/**`, otros `components/public/**` | Importar `lib/db`, `@prisma/client` o `app/api/**` |
| `lib/landing/**` | nada del proyecto | Importar React, tocar `window`, `fetch` o `process.env` |
| `app/api/**` | `lib/**` | Importar nada de `components/` |

**Dónde vive cada cosa.**

| Tema | Fuente única de verdad |
|---|---|
| Catálogo, precios, nombres de producto | `lib/productos.ts` — los nombres son la clave que el endpoint resuelve contra la base |
| Teléfono, WhatsApp, horario, zona | `lib/contacto.ts` — **nunca escribir un número literal en un componente** |
| Tokens de color y tipografía | `tailwind.config.ts` — sin hex sueltos en componentes |
| Animaciones de la landing | `app/globals.css` — `logo-float` y `waterfall` |
| Lógica pura de la landing | `lib/landing/**` — sin React, testeable con Jest |
| Esquema de datos | `prisma/schema.prisma` |

## Reglas de código

1. **Server Components por defecto.** `'use client'` solo con estado, efectos o handlers, y siempre
   lo más cerca de la hoja posible. Un Server Component pasado como *child* de un Client Component
   sigue renderizando en el servidor: es el patrón que usa `app/(public)/page.tsx`.
2. **Alias `@/` hacia la raíz** en código de aplicación. En los tests, importar el módulo hermano con
   especificador relativo (`./gotas`), que es el patrón de los tests que ya existen.
3. **Nada de aleatoriedad en el render.** La home es estática y se hidrata; `Math.random()` o
   `Date.now()` durante el render provocan hydration mismatch. Las gotas usan un LCG sembrado
   (`lib/landing/gotas.ts`) y se calculan a nivel de módulo.
4. **Todo elemento interactivo es un elemento nativo** — `<button>`, `<a>`, `<input>`, `<select>`.
   Nunca `<div onClick>`.
5. **Validar en el borde y en el servidor.** La validación de cliente se suma a la del endpoint,
   nunca la reemplaza.
6. **Sin dependencias nuevas sin discutirlo primero.** Los iconos son `<svg>` inline. Si algo parece
   necesitar un paquete, primero se busca en lo que ya está instalado.
7. **Sin archivos barril.** Importar desde el módulo de origen.
8. **Máximo 300 líneas por componente.** Más largo significa que hay que partirlo.

## Sistema de diseño

Los tokens se definen una sola vez en `tailwind.config.ts`; los componentes usan nombres de token.

| Rol | Valor | Se usa para |
|---|---|---|
| Azul de marca | `#2f9fd6` (`viflomax-azul`) | Superficies e iconos. **Nunca texto blanco encima: 2.98:1** |
| Azul texto blanco | `#1a628a` (`viflomax-azul-700`) | Botones secundarios, anillo de foco — 6.65:1 |
| Azul oscuro | `#164a63` (`viflomax-azul-800`) | Header, footer, títulos — 9.57:1 |
| Verde de marca | `#6ab04c` (`viflomax-verde`) | Bordes, iconos, gradiente. **Nunca texto blanco encima: 2.65:1** |
| Verde de CTA | `#3f6f31` (`viflomax-verde-700`) | **Todos los botones y badges con texto blanco** — 5.95:1 |
| Fondo | `#ffffff` | Toda la superficie pública |
| WhatsApp | `#25D366` | Solo el botón flotante — color fijo de marca |

- **Tipografía:** títulos `font-nunito` (`--font-nunito`); cuerpo, la del sistema. H1
  `text-5xl md:text-7xl`, H2 `text-3xl md:text-4xl`, H3 `text-xl`.
- **Radio:** `rounded-full` en botones, pills y badges; `rounded-2xl` en tarjetas.
- **Sombra:** `shadow-sm` en reposo, `hover:shadow-lg` en tarjetas.
- **Movimiento:** `logo-float` 5s ease-in-out; `waterfall` 4–9s linear. Ambos se apagan con
  `prefers-reduced-motion: reduce`. Solo `transform` y `opacity`.
- **Layout:** `max-w-6xl mx-auto px-6`, secciones a `py-16`, mobile-first.

## Entorno

| Variable | Requerida | La usa | Origen |
|---|---|---|---|
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | no — hay fallback en el código | `lib/contacto.ts` | `.env.local` |
| `DATABASE_URL` | sí, en runtime | `lib/db.ts` | `.env.local` |
| `NEXTAUTH_URL`, `NEXTAUTH_SECRET` | sí, para `/admin` y `/chofer` | NextAuth | `.env.local` |
| `CLOUDINARY_*` | sí, para fotos de entrega | `/chofer` | `.env.local` |

`.env.example` está commiteado. `.env`, `.env.local` y `.env*.local` nunca.

## Reglas diferidas

Leer el archivo que corresponda antes de editar esa área:

| Archivo | Aplica a |
|---|---|
| `.claude/rules/landing-publica.md` | `components/public/**`, `lib/landing/**`, `app/(public)/**` |
| `.claude/rules/contratos-congelados.md` | `app/api/pedidos/publico/**`, `lib/productos.ts`, `lib/contacto.ts` |

## Innegociable

1. **`app/api/pedidos/publico/route.ts` no se edita.** Su contrato está congelado; si el cliente no
   lo satisface, el que cambia es el cliente.
2. **Los nombres y precios de `lib/productos.ts` no se cambian.** El endpoint resuelve el producto
   por coincidencia exacta de nombre contra la base: renombrar rompe todos los pedidos.
3. **El número de teléfono no se escribe literal en ninguna parte.** Sale de `lib/contacto.ts`.
4. **Cero dependencias nuevas sin una razón en el mensaje del commit.**
5. **Texto blanco sobre verde va siempre en `viflomax-verde-700`**, nunca en `viflomax-verde`.
6. Nunca commitear secretos, `.env` ni salida de build.
7. Nunca editar archivos generados (`lib/generated/prisma`, `public/sw.js`, `public/workbox-*.js`).
8. Nunca marcar una tarea como hecha con una compuerta en rojo.
