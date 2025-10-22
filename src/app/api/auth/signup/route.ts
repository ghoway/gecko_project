import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateToken, createSession } from '@/lib/auth'
import type { ApiResponse, RegisterRequest, AuthResponse } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body: RegisterRequest = await request.json()
    const { name, email, password } = body

    if (!name || !email || !password) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Name, email, and password are required'
      }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Password must be at least 8 characters long'
      }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'User with this email already exists'
      }, { status: 409 })
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword
      },
      include: { plan: true }
    })

    // For now, skip email verification

    // Auto-login after registration
    const token = generateToken({
      userId: user.id,
      email: user.email,
      isAdmin: user.is_admin
    })

    // Get IP for session
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                      request.headers.get('x-real-ip') ||
                      'unknown'

    // Create session
    await createSession(user.id, token, ipAddress, {
      userAgent: request.headers.get('user-agent')
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
      message: 'User registered successfully.',
      data: response
    })

    // Set token in cookie for extension access
    nextResponse.cookies.set('token', token, {
      httpOnly: false, // Allow client-side access for extension
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    // Also set in header
    nextResponse.headers.set('X-JWT-Token', token)

    return nextResponse

  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}