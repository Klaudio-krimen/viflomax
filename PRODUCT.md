# Product

## Register

product

## Users

**Primary: Chofer (Conductor de ruta)**
- Trabaja en terreno, entre entregas, desde su furgón
- Necesita acceso rápido a pedidos, rutas, GPS, y confirmación de entregas
- Contexto: estrés bajo-medio, ambiente móvil, posible conexión lenta (intermitente)
- Usa Android, necesita soporte offline para sincronizar cuando regrese a bodega

**Secondary: Admin/Staff**
- Gestiona inventario, precios, clientes, pedidos en backend
- Contexto: escritorio, oficina, conexión estable, workflows complejos

**Tertiary: Cliente (Comprador en sitio web)**
- Ordena agua a través del sitio público
- Contexto: navegación casual, dispositivo variado (mobile o desktop)

## Product Purpose

Reemplazar sistemas legacy (AppSheet) con una plataforma digital nativa para **Agua Viflomax**, empresa de distribución de agua purificada a domicilio en Maipú, Chile.

Tres surfaces integradas:
1. **Sitio web público** — vitrina de productos y pedidos online
2. **Admin dashboard** — gestión de clientes, pedidos, inventario, precios, choferes
3. **PWA para choferes** — entregas en terreno con GPS, modo offline, confirmación en campo

Success: choferes pueden completar 30+ entregas/día sin fricción, admin ve inventario en tiempo real, clientes ordenan en <2 minutos.

## Brand Personality

**Three words:** Confiable, cercano, ágil

**Voice & tone:**
- Conversacional pero profesional (no robótico)
- Local y accesible (para un negocio chileno, pequeño pero sólido)
- Práctico: diseño que funciona, no diseño que impresiona

**Emotional goals:**
- **Confianza**: "Puedo dejar mi pedido aquí y sé que llegará"
- **Cercanía**: "Este es un servicio que me entiende, de mi ciudad"
- **Agilidad**: "Rápido, sin complicaciones, sin burocracia"

## Anti-references

**Evitar:**
- **Corporativo SaaS estándar** — Asana, Monday, Slack-clones. Demasiado gris + azul, demasiado genérico
- **Tech-crypto neon** — Dark mode forzado, colores agresivos, vibes web3
- **Minimalismo corporativo frío** — Blanco/gris extremo, sin carácter local

**What NOT to feel:** "Esta app me podría servir para cualquier negocio en el mundo." Debe sentirse de Maipú, de Chile, de agua purificada.

## Design Principles

1. **Localidad sobre universalidad** — Diseña como si fuera solo para chofer de Maipú, no como plataforma global
2. **Contexto del chofer primero** — Cada elemento debe resolver un problema real de terreno (GPS, offline, confirmación rápida)
3. **Accesibilidad = velocidad** — No es "inclusive design" corporativo; es "puede completar 30 entregas sin cansarse"
4. **Calidez en lo digital** — Verde y azul Viflomax no son colores fríos; son naturaleza (agua) y cielo (confianza). Usarlos con intención
5. **Nada decorativo** — Sin animaciones innecesarias, sin gradientes que no sirvan. Todo debe ganar velocidad o claridad

## Accessibility & Inclusion

- **WCAG 2.1 AA** mínimo (en el admin, lo más crítico)
- **PWA offlineFirst**: el chofer no puede depender de conexión 4G flaky en terreno
- **Respuesta rápida** — formularios deben ser pequeños (2-3 campos), no procesos largos
- **Contraste**: los colores Viflomax (verde/azul) deben pasar AA contra fondos (sin usar white/black puros)
- **Modo reduced-motion**: respetar `prefers-reduced-motion` (algunos choferes pueden tener sensibilidad)
- **Soporte multilenguaje futuro**: i18n listo, aunque por ahora es solo ES-CL

