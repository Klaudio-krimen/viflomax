# Agua Viflomax — instrucciones para agentes

Sistema de pedidos de agua purificada a domicilio (Maipú y Padre Hurtado): landing pública con
pedido inline, panel `/admin` y app de `/chofer`. Next.js 14 App Router · TypeScript · Tailwind 3 ·
Prisma 5 · PostgreSQL. Gestor de paquetes: **npm**. Sin `src/`; el alias `@/` apunta a la raíz.

## Comandos

| Tarea | Comando |
|---|---|
| Dev server | `npm run dev` — http://localhost:3000 |
| Build (incluye `prisma generate` y tipos) | `npm run build` |
| Lint | `npm run lint` |
| Tests (todos) | `npx jest` |
| Tests (un archivo) | `npx jest lib/landing/gotas.test.ts` |

**Compuerta:** `npm run lint && npx jest && npm run build` pasa antes de marcar algo como hecho.

## Innegociable

1. `app/api/pedidos/publico/route.ts` no se edita: su contrato está congelado.
2. Los nombres y precios de `lib/productos.ts` no se cambian: el endpoint resuelve por nombre exacto.
3. El número de teléfono nunca se escribe literal; sale de `lib/contacto.ts`.
4. Cero dependencias nuevas sin una razón en el mensaje del commit.
5. Texto blanco sobre verde va siempre en `viflomax-verde-700`, nunca en `viflomax-verde`.
6. Nunca commitear secretos ni `.env`; nunca editar archivos generados.
7. Nunca marcar una tarea como hecha con una compuerta en rojo.

Arquitectura completa, fronteras de importación y tokens de diseño: ver `CLAUDE.md` en este mismo
directorio, que es la fuente canónica.
