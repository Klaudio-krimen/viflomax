# Design

## Overview

**Creative North Star:** Claridad accesible. El verde transmite crecimiento y energía del terreno. El azul comunica tranquilidad y confianza. El espacio blanco respeta la atención del chofer. La tipografía contrasta claro y visible para lectura rápida en campo.

**Register:** product

**Design Intent:** Aplicación de trabajo para choferes en terreno. Cada decisión visual sirve la velocidad de interacción (toque rápido en móvil), la claridad sin distracciones, y el registro confiable de ventas y entregas. Ningún elemento es decorativo.

**Key Principles:**
- Tap-friendly: objetos clickeables ≥44×44px, espaciado cómodo para pulgar
- Contraste alto: 7:1 mínimo en texto principal, legible bajo luz solar
- Sin decoración: sombras sutiles, bordes funcionales, animaciones solo para feedback
- Jerarquía clara: tamaño + peso + color comunican importancia, no gradientes
- Espacio respetuoso: respira entre secciones, no apretujado

---

## Colors

### Brand Palette

| Nombre | Hex | RGB | OKLCH | Uso Primario |
|--------|-----|-----|-------|--------------|
| Verde Viflomax | #6ab04c | 106, 176, 76 | 0.64 / 0.16 / 142° | Acciones primarias, confirmaciones |
| Verde Claro | #7ec850 | 126, 200, 80 | 0.72 / 0.15 / 142° | Estados hover, background suave |
| Azul Viflomax | #4db8e8 | 77, 184, 232 | 0.71 / 0.18 / 243° | Focus, links, información secundaria |
| Azul Oscuro | #1a6ba0 | 26, 107, 160 | 0.43 / 0.12 / 243° | Estados activos, énfasis en navegación |

### Semantic Colors

| Rol | Hex | OKLCH | Uso |
|-----|-----|-------|-----|
| Success | #10b981 | 0.68 / 0.18 / 151° | Entregas completadas, confirmaciones |
| Warning | #f59e0b | 0.76 / 0.18 / 74° | Pendientes, estados en ruta |
| Error | #ef4444 | 0.56 / 0.21 / 27° | Validaciones fallidas, alertas |
| Neutral BG | #f9fafb | 0.98 / 0.002 / 270° | Fondos principales, espacios vacíos |
| Neutral Text | #111827 | 0.21 / 0.003 / 270° | Cuerpo de texto |

### Color Character

**Verde (#6ab04c):** Energía de terreno. Naturaleza, crecimiento, acción segura. Botones principales, confirmaciones, indicadores de éxito. Cálido pero profesional.

**Azul (#4db8e8):** Confianza tranquila. Cielo, agua, fiabilidad. Estados activos, información secundaria, focus rings. Complementa verde sin competir.

**Grises:** Neutros tintados hacia azul-verde muy sutilmente. Respetan la paleta sin distracciones. Bordes: gray-200 (#e5e7eb). Texto secundario: gray-600 (#4b5563).

---

## Typography

### Font Stack

| Rol | Fuente | Stack | Uso |
|-----|--------|-------|-----|
| Body / Números | Nunito | Nunito, sans-serif | Cuerpo de texto, datos, números en grillas |
| UI / Labels | Outfit | Outfit, sans-serif | Botones, labels de formulario, tablas, instrucciones |

### Hierarchy

| Nivel | Tamaño | Weight | Line Height | Uso |
|-------|--------|--------|-------------|-----|
| h1 | 2rem (32px) | 600 | 1.2 | Títulos de página, encabezados principales |
| h2 | 1.5rem (24px) | 600 | 1.25 | Subtítulos, secciones de formulario |
| h3 | 1.25rem (20px) | 600 | 1.3 | Títulos de card, nombres de clientes |
| body-lg | 1rem (16px) | 400 | 1.5 | Cuerpo de texto, instrucciones de orden |
| body | 0.875rem (14px) | 400 | 1.6 | Descripción, datos secundarios |
| body-sm | 0.75rem (12px) | 400 | 1.5 | Helper text, metadata, timestamps |
| label | 0.875rem (14px) | 500 | 1.4 | Labels de formulario, botones |
| caption | 0.625rem (10px) | 500 | 1.4 | Badges, tags muy pequeñas |

### Contrast Rules

- **Mínimo 7:1** para body text sobre fondos (WCAG AAA)
- **Mínimo 4.5:1** para UI text pequeño (labels, helpers)
- **Prueba:** texto gris-600 sobre blanco (6.5:1 ✓), verde oscuro sobre verde-claro (mínimo 5:1, evitar)
- **En campo:** considera luz solar directa. Verde y azul oscuro mantienen legibilidad. Evita grises muy claros en fondos.

---

## Elevation

### Philosophy

Elevación basada en **proximidad funcional**, no decoración. Sombras sutiles indican superficie interactiva. Bordes comunican contención. Sin capas apiladas; máximo 2 niveles en cualquier pantalla.

### Shadow System

| Nivel | CSS | Uso |
|-------|-----|-----|
| Subtle | `shadow-sm` (0 1px 2px 0 rgba(0,0,0,0.05)) | Cards, inputs en reposo |
| Slight | `shadow` (0 1px 3px 0 rgba(0,0,0,0.1)) | Modales, dropdowns al abrir |
| None | Sin sombra | Fondos, grupos, secciones |

### Border System

| Estilo | CSS | Uso |
|--------|-----|-----|
| Subtle divider | `border-gray-200` (1px) | Separar secciones, encabezados de card |
| Accent border | `border-viflomax-azul` (1px) | Focus state de inputs, elementos activos |
| Error state | `border-red-500` (1px) | Inputs con error |

### Spacing & Rhythm

| Escala | px | Uso |
|--------|----|----|
| xs | 0.25rem | Micro-espaciado interno (badges) |
| sm | 0.5rem | Gap pequeño entre elementos |
| md | 1rem | Padding de inputs, gap estándar |
| lg | 1.5rem | Padding de card, separación entre secciones |
| xl | 2rem | Separación vertical entre paneles |

---

## Components

### Button

**Variants:** primary, secondary, danger, ghost

**Sizes:** sm (28px), md (36px), lg (44px)

**States:** default, hover, active, disabled, loading

**Rules:**
- Mínimo 44×44px (sm para UI no crítica)
- Primary verde (#6ab04c), hover verde-claro (#7ec850)
- Secondary gris con borde, hover gris más oscuro
- Danger rojo, reservado para cancelaciones y eliminaciones
- Ghost solo borde, sin fondo
- Font: Outfit medium, texto visible en campo
- Focus ring: viflomax-azul (2px)
- Nunca deshabilitado por defecto; mostrar motivo si está bloqueado

**Usage:**
```tsx
<Button variant="primary" size="md">Confirmar Entrega</Button>
<Button variant="secondary" size="md">Cancelar</Button>
<Button variant="ghost" size="sm">Ver más</Button>
```

### Card

**Structure:** optional title + description, body (children), optional footer

**Styling:**
- White background, rounded-xl (12px), shadow-sm
- Border 1px gray-200
- Padding: title/footer 24px, body 24px (px-6 py-4)
- Titles: Nunito semibold, text-lg, gray-900
- Descriptions: Outfit, text-sm, gray-500

**Rules:**
- Usar card solo cuando el agrupamiento funcional lo justifique
- No anidar cards
- Si tiene acción principal, incluir botón en footer
- Para listas, considerar tabla o list items en lugar de stacked cards

### Input

**Structure:** label + input field + error/helperText

**Styling:**
- Rounded-lg (8px), px-3 py-2
- White background, outline none
- Ring: 1px gray-300 por defecto, focus viflomax-azul, error red-500
- Placeholder gris-400
- Disabled: bg-gray-50, text-gray-500

**Rules:**
- Label siempre presente (accessibility)
- Required field: asterisco rojo
- Error: mensaje debajo en rojo (role="alert")
- Helper text: bajo el input, gris-500
- Transition focus smooth (200ms)

### Badge

**Variants:** success, warning, error, info, default

**Sizes:** sm (12px text, 2px padding), md (14px text, 2.5px padding)

**Styling:**
- Rounded-full (9999px)
- Font: Outfit medium
- Colores semánticos (verde para success, etc.)

**Rules:**
- Para estados de pedido (nuevo, confirmado, en ruta, entregado, cancelado)
- Nunca como botón (usar Button component)
- Usar función helper `estadoPedidoBadge()` para consistencia

### Modal

**Philosophy:** Modal es último recurso. Usar inline / expandable / drawer primero.

**Styling:**
- Overlay dark (rgba(0,0,0,0.5))
- Modal card: white, rounded-xl, shadow-sm
- Padding: 24px (xl)
- Ancho máximo: 500px para móvil, 600px para desktop
- Título: h2, Nunito semibold
- Acciones: Button primary + secondary en footer

**Rules:**
- Modal solo para confirmaciones críticas (borrar pedido, cancelar entrega)
- Cerrar: X button, ESC key, overlay click (con confirmación)
- Focus trap en la modal
- Pequeño contenido (máximo 3 campos)

### Table

**Styling:**
- Header: bg-gray-50, border-b gray-200, Outfit bold
- Rows: border-b gray-100, padding 12px
- Hover: bg-gray-50
- Stripe: alternating white / gray-25 (opcional)

**Rules:**
- Responsive: stack en móvil (<640px) o scroll horizontal
- Números alineados a derecha
- Estados (success/error): colorear badge en columna, no toda la fila
- Acciones (editar/borrar): Button ghost sm al final

---

## Do's and Don'ts

### ✅ DO

- **Usa verde y azul deliberadamente.** Verde para acción confirma, azul para información/foco.
- **Contraste alto.** Prueba texto en campo bajo luz solar.
- **Espaciado respira.** Padding 24px en cards, gap 16px entre secciones.
- **Botones grandes (44px).** Tap-friendly en móvil.
- **Sombras sutiles.** shadow-sm solo para elevar cards y inputs.
- **Tipografía clara.** Nunito para números y cuerpo, Outfit para labels. Weights contrastados (400 vs 600).
- **Focusable elements con ring azul.** Inputs, botones, links siempre visibles.
- **Validación progresiva.** Errores debajo del input, no como modal.

### ❌ DON'T

- **No gradientes.** (Bans rule: banido)
- **No animaciones decorativas.** Solo feedback: hover color, focus ring, loading spinner.
- **No nested cards.** Si necesitas jerarquía, usa secciones con borde, no cards dentro de cards.
- **No color de fondo diferente por cada estado.** Verde claro → error rojo es confusión. Usa badges y colores semánticos.
- **No side-stripe borders.** (Bans rule: banido en cards/list items)
- **No texto gris muy claro.** Ilegible en campo. Mínimo gray-600 para body small.
- **No modales por defecto.** Inline o drawer primero.
- **No icono sin label en botones.** En formularios de trabajo, la claridad es crítica.
- **No múltiples niveles de sombra.** Maximum 1 sombra visible por componente.
