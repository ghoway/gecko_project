import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getUserFromToken } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Handle auth page redirects
  if (pathname === '/auth' || pathname === '/auth/') {
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }

  // Check if user is authenticated (has valid token)
  const authHeader = request.headers.get('authorization')
  const cookieToken = request.cookies.get('token')?.value
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : cookieToken
  let user = null

  if (token) {
    user = await getUserFromToken(token)
  }

  // If user is authenticated and trying to access auth pages, redirect based on subscription status
  if (user && pathname.startsWith('/auth/')) {
    // Check if user has active subscription
    const hasActiveSubscription = user.subscription_ends_at && user.subscription_ends_at > new Date()
    if (hasActiveSubscription) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } else {
      return NextResponse.redirect(new URL('/subscribe', request.url))
    }
  }

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/auth/signin', '/auth/signup', '/api/auth/signin', '/api/auth/signup', '/api/plans']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Protected routes (require authentication AND active subscription for most APIs)
  const protectedRoutes = ['/dashboard', '/admin', '/api/services', '/api/subscriptions']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  if (isProtectedRoute) {
    if (!token || !user) {
      // For API routes, return 401
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        )
      }
      // For pages, redirect to login
      return NextResponse.redirect(new URL('/auth/signin', request.url))
    }

    // Check subscription for API routes (except admin routes)
    if (pathname.startsWith('/api/') && !pathname.startsWith('/api/admin/') && !user.is_admin) {
      // Check if user has active subscription
      const hasActiveSubscription = user.subscription_ends_at && user.subscription_ends_at > new Date()
      if (!hasActiveSubscription) {
        return NextResponse.json(
          {
            success: false,
            error: 'Active subscription required',
            redirect: '/dashboard'
          },
          { status: 403 }
        )
      }
    }

    // Admin routes check
    if (pathname.startsWith('/admin') && !user.is_admin) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { success: false, error: 'Admin access required' },
          { status: 403 }
        )
      }
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Add user to headers for API routes
    const response = NextResponse.next()
    response.headers.set('x-user-id', user.id)
    response.headers.set('x-user-email', user.email)
    response.headers.set('x-user-admin', user.is_admin.toString())

    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}