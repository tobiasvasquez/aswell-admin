import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const AUTH_COOKIE = 'sm_auth'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Permitir rutas públicas
  const isPublic =
    pathname === '/login' ||
    pathname.startsWith('/api/login') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/health') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/assets')

  if (isPublic) return NextResponse.next()

  const cookie = request.cookies.get(AUTH_COOKIE)?.value
  const expected = process.env.ADMIN_PASSWORD

  if (!expected) {
    // Si no hay password configurada, bloquear todo por seguridad
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('reason', 'setup')
    return NextResponse.redirect(url)
  }

  if (!cookie || cookie !== expected) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('from', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}


