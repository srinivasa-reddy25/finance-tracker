import { NextResponse, type NextRequest } from 'next/server'

import { AUTH_COOKIE_NAME } from '@/constants/cookies'

const AUTH_ROUTES = ['/login', '/signup']
const PROTECTED_ROUTES = ['/home']

export const proxy = (request: NextRequest) => {
  const { pathname } = request.nextUrl
  const hasAuth = request.cookies.get(AUTH_COOKIE_NAME)?.value === '1'

  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route))
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  )

  if (isProtectedRoute && !hasAuth) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthRoute && hasAuth) {
    const homeUrl = new URL('/home', request.url)
    return NextResponse.redirect(homeUrl)
  }

  if (pathname === '/') {
    if (hasAuth) return NextResponse.redirect(new URL('/home', request.url))
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}
