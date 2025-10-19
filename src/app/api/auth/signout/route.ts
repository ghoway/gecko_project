import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'
import type { ApiResponse } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'No token provided'
      }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const user = await getUserFromToken(token)

    if (!user) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Invalid token'
      }, { status: 401 })
    }

    // Delete the session
    await prisma.session.deleteMany({
      where: {
        user_id: user.id,
        token
      }
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Logged out successfully'
    })

  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}