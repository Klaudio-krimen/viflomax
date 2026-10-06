---
id: VFX-013
titulo: Sacar el SessionProvider de NextAuth del layout raíz para que la landing no lo cargue
estado: lista
prioridad: p2
asignado:
revisor: claude
area: landing
depende_de: []
blueprint:
rama:
archivos: [app/layout.tsx, app/admin/layout.tsx, app/chofer/layout.tsx, app/login/**, app/cambiar-password/**]
bloqueo:
creado: 2026-10-05
actualizado: 2026-10-05
---

## Contexto

`app/layout.tsx` envuelve **todo** el sitio en `<SessionProvider>` (cliente). La landing pública no
usa sesión (`useSession` solo aparece en `app/admin/pedidos/nuevo`, `app/login`,
`components/admin/Sidebar.tsx` y `components/chofer/CerrarSesionBtn.tsx`), pero igual descarga el
JS de `next-auth/react` y hace `GET /api/auth/session` en cada visita: peor LCP/INP para el
visitante y una llamada a la base (callback `jwt`) por cada visita anónima.

## Criterios de aceptación

- [ ] CUANDO se carga `/` sin sesión EL SISTEMA DEBERÁ no hacer ninguna request a
      `/api/auth/session` (verificar en la pestaña Network).
- [ ] CUANDO se usan `/admin`, `/chofer`, `/login` y `/cambiar-password` EL SISTEMA DEBERÁ
      funcionar igual (login, cerrar sesión, sidebar).
- [ ] CUANDO se compara la salida de `npm run build` EL SISTEMA DEBERÁ mostrar un *First Load JS*
      de `/` menor que antes; anotar ambos valores en la bitácora.
- [ ] `npm run lint && npx jest && npm run build` sale con código 0.

## Bitácora

### 2026-10-05 · claude · → lista
- Hallazgo L5 de la auditoría.

## Revisión
