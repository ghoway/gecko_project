import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'
import type { ApiResponse } from '@/types'

// GET /api/admin/analytics - Get analytics data (admin only)
export async function GET(request: NextRequest) {
  try {
    // Check admin access
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

    // Get basic stats
    const [
      totalUsers,
      activeUsers,
      bannedUsers,
      totalTransactions,
      successfulTransactions,
      totalRevenue,
      monthlyRevenue,
      activeSubscriptions
    ] = await Promise.all([
      // Total users
      prisma.user.count(),

      // Active users (not banned)
      prisma.user.count({ where: { banned: false } }),

      // Banned users
      prisma.user.count({ where: { banned: true } }),

      // Total transactions
      prisma.transaction.count(),

      // Successful transactions
      prisma.transaction.count({ where: { status: 'success' } }),

      // Total revenue (from successful transactions)
      prisma.transaction.aggregate({
        where: { status: 'success' },
        _sum: { amount: true }
      }),

      // Monthly revenue (last 30 days)
      prisma.transaction.aggregate({
        where: {
          status: 'success',
          created_at: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        },
        _sum: { amount: true }
      }),

      // Active subscriptions
      prisma.subscription.count({
        where: {
          status: 'active',
          ends_at: { gt: new Date() }
        }
      })
    ])

    // Get plan distribution
    const planStats = await prisma.user.groupBy({
      by: ['current_plan_id'],
      where: {
        current_plan_id: { not: null },
        banned: false
      },
      _count: { current_plan_id: true }
    })

    // Get plan names for the stats
    const planIds = planStats.map(p => p.current_plan_id).filter((id): id is number => id !== null)
    const plans = await prisma.plan.findMany({
      where: { id: { in: planIds } },
      select: { id: true, name: true }
    })

    const planDistribution = planStats.map(stat => {
      const plan = plans.find(p => p.id === stat.current_plan_id)
      return {
        planName: plan?.name || 'Unknown',
        count: stat._count.current_plan_id
      }
    })

    // Recent transactions (last 10)
    const recentTransactions = await prisma.transaction.findMany({
      take: 10,
      orderBy: { created_at: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        plan: { select: { name: true } }
      }
    })

    const analytics = {
      overview: {
        totalUsers,
        activeUsers,
        bannedUsers,
        totalTransactions,
        successfulTransactions,
        totalRevenue: totalRevenue._sum.amount || 0,
        monthlyRevenue: monthlyRevenue._sum.amount || 0,
        activeSubscriptions
      },
      planDistribution,
      recentTransactions: recentTransactions.map(t => ({
        id: t.id,
        orderId: t.midtrans_order_id,
        userName: t.user.name,
        userEmail: t.user.email,
        planName: t.plan.name,
        amount: t.amount,
        status: t.status,
        createdAt: t.created_at
      }))
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: analytics
    })

  } catch (error) {
    console.error('Get admin analytics error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to fetch analytics'
    }, { status: 500 })
  }
}