import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, generateToken, createSession, invalidateUserSessions, recordFailedLogin, getFailedLoginCount } from '@/lib/auth'
import type { ApiResponse, LoginRequest, AuthResponse } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Email and password are required'
      }, { status: 400 })
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { plan: true }
    })

    if (!user || user.banned) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Invalid credentials'
      }, { status: 401 })
    }

    // Get IP for rate limiting
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                     request.headers.get('x-real-ip') ||
                     'unknown'

    // Check failed login attempts
    const failedCount = await getFailedLoginCount(user.id)
    if (failedCount >= 5) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Account temporarily locked due to too many failed attempts'
      }, { status: 429 })
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password)
    if (!isValidPassword) {
      await recordFailedLogin(user.id, ipAddress)
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Invalid credentials'
      }, { status: 401 })
    }

    // Single login policy: invalidate other sessions
    await invalidateUserSessions(user.id)

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      isAdmin: user.is_admin
    })

    // Create session
    await createSession(user.id, token, ipAddress, {
      userAgent: request.headers.get('user-agent')
    })

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { last_login_at: new Date() }
    })

    const response: AuthResponse = {
      user: {
        ...user,
        password: '' // Don't send password
      },
      token
    }

    const nextResponse = NextResponse.json<ApiResponse<AuthResponse>>({
      success: true,
      data: response
    })

    // Set token in cookie for extension access
    nextResponse.cookies.set('token', token, {
      httpOnly: false, // Allow client-side access for extension
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    // Also set in header for additional access
    nextResponse.headers.set('X-JWT-Token', token)

    return nextResponse

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}