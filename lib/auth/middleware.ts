import { getToken } from 'next-auth/jwt'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  const rol = token?.role as string | undefined
  const { pathname } = request.nextUrl

  // Proteger rutas /admin/* — solo rol 'admin'
  if (pathname.startsWith('/admin')) {
    if (!token || rol !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
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
  }

  return NextResponse.next()
}
