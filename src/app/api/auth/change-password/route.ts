import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, hashPassword, getUserFromToken } from '@/lib/auth'
import type { ApiResponse } from '@/types'

interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Verify token and get user
    const user = await getUserFromToken(token)
    if (!user) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Invalid or expired token'
      }, { status: 401 })
    }

    const body: ChangePasswordRequest = await request.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Current password and new password are required'
      }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'New password must be at least 8 characters long'
      }, { status: 400 })
    }

    // Verify current password
    const isValidCurrentPassword = await verifyPassword(currentPassword, user.password)
    if (!isValidCurrentPassword) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Current password is incorrect'
      }, { status: 400 })
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword)

    // Update password in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedNewPassword,
        updated_at: new Date()
      }
    })

    // Invalidate all other sessions for security
    await prisma.session.deleteMany({
      where: {
        user_id: user.id,
        NOT: { token }
      }
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Password changed successfully'
    })

  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}