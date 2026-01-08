import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect admin routes
  // Note: We can't check localStorage in middleware (server-side only)
  // So we'll let the client-side components handle auth checks
  // This middleware just allows the request through
  if (pathname.startsWith('/admin')) {
    // Client-side components will handle authentication checks
    // Middleware can't access localStorage, so we skip token check here
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
  ],
}

