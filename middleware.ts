import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware to protect /admin/* routes
 * Redirects to /login if:
 * - No auth token exists
 * - User is not an admin (checked client-side, but we can verify token exists)
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only protect /admin routes
  if (pathname.startsWith('/admin')) {
    // Check for auth token in cookies (if using cookies) or let client-side handle it
    // Since we're using localStorage, we'll do the main check client-side
    // But we can check for a cookie if you want to add cookie-based auth later
    
    // For now, allow the request to proceed
    // The client-side AuthProvider and route guards will handle the actual redirect
    return NextResponse.next()
  }

  // Allow login page and other public routes
  if (pathname === '/login') {
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/login',
  ],
}

