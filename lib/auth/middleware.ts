import { getToken } from 'next-auth/jwt'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  const rol = token?.role as string | undefined
  const { pathname } = request.nextUrl

  // Cambio de contraseña forzado (admin-generada) — corta el paso a cualquier
  // ruta que no sea el propio flujo de cambio, el login, o la API de sesión
  if (
    token?.mustChangePassword === true &&
    pathname !== '/cambiar-password' &&
    pathname !== '/login' &&
    !pathname.startsWith('/api')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/cambiar-password'
    return NextResponse.redirect(url)
  }

  // Proteger rutas /admin/* — 'admin' tiene acceso completo; 'visor' solo
  // puede ver el listado y detalle de pedidos (nunca /admin/pedidos/nuevo)
  if (pathname.startsWith('/admin')) {
    if (!token || !['admin', 'visor'].includes(rol ?? '')) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }

    if (rol === 'visor') {
      const esListado = pathname === '/admin/pedidos'
      const esDetalle = /^\/admin\/pedidos\/[^/]+$/.test(pathname) && !pathname.endsWith('/nuevo')
      if (!esListado && !esDetalle) {
        const url = request.nextUrl.clone()
        url.pathname = '/admin/pedidos'
        return NextResponse.redirect(url)
      }
    }
  }

  // Proteger rutas /chofer/* — rol 'chofer' o 'admin'
  if (pathname.startsWith('/chofer')) {
    if (!token || !['chofer', 'admin'].includes(rol ?? '')) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }

    // Chofer desvinculado con una sesión ya abierta — cortar el acceso
    // en su próximo request (token.choferActivo se revalida en cada uno)
    if (rol === 'chofer' && token.choferActivo === false) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}
