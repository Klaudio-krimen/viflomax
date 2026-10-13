---
description: Convenciones de autenticación, sesión y contraseña forzada
paths:
  - "lib/auth.ts"
  - "lib/auth/**"
  - "app/cambiar-password/**"
  - "types/next-auth.d.ts"
  - "app/admin/choferes/actions.ts"
  - "app/admin/usuarios/actions.ts"
---

# Autenticación y contraseña forzada

- Sesión JWT (NextAuth v4), 30 días. Un solo `auth()` en `lib/auth.ts`, úsalo en todos lados — nunca
  una segunda fuente de verdad de sesión.
- `lib/auth.ts` `jwt()` revalida contra la BD **en cada request**, no solo en el login: hoy lo hace
  para `Chofer.activo` (solo rol chofer) y para `User.mustChangePassword` (cualquier rol). Si agregas
  un tercer flag de este tipo, sigue el mismo patrón — no inventes un mecanismo de refresco distinto.
- `mustChangePassword` se enciende en el momento en que se genera una contraseña que el usuario no
  eligió: `crearChofer`, `resetPasswordChofer`, `crearUsuarioVisor`. Se apaga solo en
  `app/cambiar-password/actions.ts`, al guardar una contraseña propia. Ninguna otra ruta lo toca.
- `lib/auth/middleware.ts` es **todo inline** — sin funciones puras extraídas, a propósito, para
  seguir el estilo ya establecido en ese archivo. La guarda de `mustChangePassword` corre antes que
  las de `/admin` y `/chofer`, y excluye `/login` y todo lo que empiece con `/api` (si no lo excluye,
  el propio `fetch('/api/auth/session')` de `app/login/page.tsx` queda atrapado en el redirect).
- Contraseña mínima: 6 caracteres, igual en todos los formularios (`crearChofer`,
  `resetPasswordChofer`, `crearUsuarioVisor`, `cambiarPassword`). No lo relajes ni lo endurezcas en
  uno solo de los cuatro.
- Validación de estas acciones va **inline en el Server Action**, no en `lib/`: es la convención ya
  establecida en `crearChofer`/`resetPasswordChofer`/`crearUsuarioVisor`. Extráela a `lib/` recién
  cuando un tercer consumidor real necesite la misma regla.
- Todo campo de contraseña que el usuario **tipea** (no los generados por el admin, que siguen en
  texto plano en `CampoPasswordGenerada`) usa `components/ui/PasswordInput.tsx`, nunca un
  `<input type="password">` crudo.
- bcrypt cost 12, igual en todos los `bcrypt.hash` de este proyecto — no lo cambies en un solo lugar.
