---
name: agregar-seccion-landing
description: Usar al agregar una sección nueva a la landing pública de Viflomax (app/(public)/page.tsx) — por ejemplo testimonios, preguntas frecuentes o una promoción. Fija la frontera Server/Client, el uso de tokens de color con contraste válido y la lluvia de gotas determinista. Disparadores típicos - "agregar una sección", "nueva sección en la home", "sumar testimonios a la landing".
---

# Agregar una sección a la landing

## Cuándo usarla

Cuando haya que sumar un bloque nuevo a `app/(public)/page.tsx`. No aplica a `/admin`, a `/chofer`
ni a páginas que no sean la home.

## Pasos

1. Crear `components/public/<NombreSeccion>.tsx`. **Sin `'use client'` salvo que la sección tenga
   estado, efectos o handlers.** La mayoría no los tiene.
2. Estructura: `<section id="<ancla>" className="py-16">` con un contenedor
   `max-w-6xl mx-auto px-6`, un `<h2 className="font-nunito text-3xl md:text-4xl font-bold">` y el
   contenido.
3. Colores solo con tokens. Si la sección lleva texto blanco sobre color, usar
   `bg-viflomax-verde-700` o `bg-viflomax-azul-700` / `-800`. **Nunca `bg-viflomax-verde` ni
   `bg-viflomax-azul` con texto blanco:** 2.65:1 y 2.98:1, ambos reprueban AA.
4. Si lleva lluvia de fondo: `const GOTAS_<SECCION> = generarGotas(<semilla>, <cantidad>, '<color>')`
   **a nivel de módulo, en la columna 0**, y pasarlo a `<LluviaDeGotas gotas={...} />`. Semilla
   distinta de las que ya se usan (7 en el catálogo, 23 en cobertura). Nunca `Math.random()`.
5. Iconos: `<svg>` inline con `aria-hidden="true"`. No instalar una librería de iconos.
6. Montarla en `app/(public)/page.tsx` en la posición que corresponda. Si va entre el catálogo y el
   formulario, va **dentro** de `<PedidoProvider>`, como child: sigue siendo Server Component.
7. Si es un destino de enlace, agregar `scroll-mt-24` para que el header sticky no tape el ancla.

## Verificar

```bash
grep -q 'use client' components/public/<NombreSeccion>.tsx; test $? -eq 1   # solo si es Server Component
npm run lint    # expect: exit 0
npm run build   # expect: exit 0
npx jest        # expect: exit 0, 0 failed, 0 skipped
```

## No hacer

- No agregar dependencias. Ni de iconos, ni de animación, ni de carrusel.
- No usar `Math.random()` ni `Date.now()` durante el render: la home es estática y se hidrata.
- No escribir un número de teléfono literal; usar `lib/contacto.ts`.
- No poner `'use client'` en la página ni en el layout para "que sea más fácil": arrastra toda la
  landing al bundle de cliente.
