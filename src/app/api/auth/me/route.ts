import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'
import type { ApiResponse, UserWithSubscription } from '@/types'

export async function GET(request: NextRequest) {
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

    // Get active subscription (most recent)
    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        user_id: user.id,
        status: 'active',
        ends_at: {
          gt: new Date()
        }
      },
      include: {
        plan: true
      },
      orderBy: {
        ends_at: 'desc'
      }
    })

    // Get user sessions
    const userSessions = await prisma.session.findMany({
      where: {
        user_id: user.id,
        expires_at: {
          gt: new Date()
        }
      },
      orderBy: {
        last_activity_at: 'desc'
      }
    })

    // Return user with subscription and sessions data
    const userResponse: UserWithSubscription = {
      ...user,
      password: '',
      subscription: activeSubscription || null,
      sessions: userSessions
    }

    return NextResponse.json<ApiResponse<UserWithSubscription>>({
      success: true,
      data: userResponse
    })

  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}