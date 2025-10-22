import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getUserFromToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (user && pathname.startsWith('/auth/')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/auth/signin', '/auth/signup', '/api/auth/signin', '/api/auth/signup', '/api/plans']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Protected routes (require authentication, subscription only for specific APIs)
  const protectedRoutes = ['/dashboard', '/subscribe', '/admin']
  const subscriptionRequiredAPIs = ['/api/services', '/api/subscriptions']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const requiresSubscription = subscriptionRequiredAPIs.some(route => pathname.startsWith(route))

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

    // Check subscription for specific API routes
    if (requiresSubscription && !user.is_admin) {
      // Check if user has active subscription from subscriptions table
      // Get the most recent active subscription
      const activeSubscription = await prisma.subscription.findFirst({
        where: {
          user_id: user.id,
          status: 'active',
          ends_at: {
            gt: new Date()
          }
        },
        orderBy: {
          ends_at: 'desc'
        }
      })

      if (!activeSubscription) {
        return NextResponse.json(
          {
            success: false,
            error: 'Active subscription required',
            redirect: '/subscribe'
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