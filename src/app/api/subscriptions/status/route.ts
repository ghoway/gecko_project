import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'
import type { ApiResponse } from '@/types'

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Authentication required'
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

    // Get user's subscription
    const subscription = await prisma.subscription.findUnique({
      where: { user_id: user.id },
      include: { plan: true }
    })

    if (!subscription) {
      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          hasActiveSubscription: false,
          subscription: null
        }
      })
    }

    const now = new Date()
    const isActive = subscription.status === 'active' && subscription.ends_at > now

    // If subscription expired, update status
    if (subscription.status === 'active' && subscription.ends_at <= now) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'expired' }
      })

      await prisma.user.update({
        where: { id: user.id },
        data: {
          current_plan_id: null,
          subscription_ends_at: null
        }
      })

      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          hasActiveSubscription: false,
          subscription: {
            ...subscription,
            status: 'expired'
          }
        }
      })
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        hasActiveSubscription: isActive,
        subscription: subscription
      }
    })

  } catch (error) {
    console.error('Get subscription status error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to get subscription status'
    }, { status: 500 })
  }
}

// POST endpoint to manually check and update expired subscriptions (admin only)
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const user = await getUserFromToken(token)
    if (!user || !user.is_admin) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Admin access required'
      }, { status: 403 })
    }

    const now = new Date()

    // Find all expired active subscriptions
    const expiredSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'active',
        ends_at: { lte: now }
      }
    })

    // Update expired subscriptions
    for (const sub of expiredSubscriptions) {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'expired' }
      })

      await prisma.user.update({
        where: { id: sub.user_id },
        data: {
          current_plan_id: null,
          subscription_ends_at: null
        }
      })
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        expiredCount: expiredSubscriptions.length
      },
      message: `Updated ${expiredSubscriptions.length} expired subscriptions`
    })

  } catch (error) {
    console.error('Update expired subscriptions error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to update expired subscriptions'
    }, { status: 500 })
  }
}