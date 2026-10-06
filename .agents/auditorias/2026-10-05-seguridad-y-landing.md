# Auditoría 2026-10-05 — Seguridad de `app/api` y conversión de la landing

- **Autor:** claude · **Alcance:** los 28 `route.ts` de `app/api/**`, `lib/auth*`, `middleware.ts`,
  `next.config.mjs`, `app/layout.tsx`, `app/(public)/**`, `components/public/**`.
- **Método:** lectura de código. No se tocó la base de datos ni producción, así que nada de esto
  está verificado contra datos reales.

## Resumen

La autorización por rol está bien encaminada (casi todos los endpoints de admin exigen `admin`),
pero hay **dos defectos p0**: uno puede tumbar la creación de todos los pedidos y el otro deja a
cualquier chofer cerrar pedidos ajenos. La landing es accesible y liviana, pero pierde clientes en
el paso a WhatsApp en iPhone y es casi invisible para el SEO local.

## Seguridad e integridad

| # | Sev. | Hallazgo | Tarea |
|---|---|---|---|
| S1 | **p0** | Numeración `count()+1` con `@unique` y `DELETE` en duro: borrar un pedido que no sea el último rompe **para siempre** la creación de pedidos (web, admin y terreno). | VFX-002 |
| S2 | **p0** | IDOR en `POST /api/entregas`: un chofer registra la entrega de cualquier pedido. Chequeo de estado fuera de la transacción. | VFX-003 |
| S3 | p1 | `/api/**` ignora `choferActivo` y `mustChangePassword`: un chofer desvinculado sigue operando hasta 30 días con su JWT. | VFX-004 |
| S4 | p1 | `POST /api/clientes` y `POST /api/precios/calcular` aceptan cualquier rol (incluye `visor` y `publico`); el segundo filtra datos de clientes. | VFX-005 |
| S5 | p1 | Sin límite de tasa en login (fuerza bruta) ni en el pedido público (spam que crea clientes y pedidos). | VFX-006 |
| S6 | p2 | Sin cabeceras `X-Frame-Options`, `nosniff`, `Referrer-Policy` ni HSTS. | VFX-007 |
| S7 | p1 | Endpoint público congelado: carrera en la numeración, sin topes de cantidad ni de largo, cliente duplicado por pedido. | VFX-008 (decisión humana) |

Lo que está bien: contraseñas con bcrypt; revalidación de chofer activo en el callback `jwt`;
mensajes de error genéricos en el login; los handlers no filtran trazas de error; `.env*` ignorados.

Observación de rendimiento: el callback `jwt` hace hasta 2 consultas a la base **por request**. Hoy
es aceptable; si crece el tráfico, conviene cachear `mustChangePassword` y `choferActivo` unos
segundos.

## Landing, conversión y SEO

| # | Prio. | Hallazgo | Tarea |
|---|---|---|---|
| L1 | p1 | `window.open` de WhatsApp después de un `await`: Safari iOS lo bloquea y el cliente nunca llega a confirmar. | VFX-009 |
| L2 | p1 | Formulario sin `autoComplete`, sin total estimado, sin aviso de fuera de zona; botones fuera del sistema de diseño. | VFX-010 |
| L3 | p1 | Un solo producto por pedido; el contrato ya acepta varios. | VFX-011 |
| L4 | p1 | Sin sitemap, robots, Open Graph ni JSON-LD `LocalBusiness`; el título omite Padre Hurtado. | VFX-012 |
| L5 | p2 | `SessionProvider` en el layout raíz: la landing carga NextAuth y consulta la sesión en cada visita. | VFX-013 |
| L6 | p2 | Cero medición del embudo. | VFX-014 |

Documentación desactualizada: `ROLES.md` y `.env.example` describen Supabase (VFX-001).

## Orden sugerido

1. **Hoy:** el humano corre la consulta de VFX-002 en producción. Codex toma VFX-002 y VFX-003 (p0).
2. Claude implementa VFX-004 en paralelo; luego Codex hace VFX-005.
3. El humano configura VFX-006 en Vercel.
4. Codex hace VFX-009 → VFX-010 y VFX-012. Claude diseña VFX-011.
