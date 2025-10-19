import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import type { ApiResponse, RegisterRequest } from '@/types'

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

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'User registered successfully. Please login.',
      data: {
        user: {
          ...user,
          password: '' // Don't send password
        }
      }
    })

  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}