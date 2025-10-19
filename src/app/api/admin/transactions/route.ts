import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'
import type { ApiResponse } from '@/types'

// GET /api/admin/transactions - List all transactions (admin only)
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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: Record<string, unknown> = {}
    if (status && status !== 'all') {
      where.status = status
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        plan: true
      },
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: offset
    })

    const total = await prisma.transaction.count({ where })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        transactions,
        total,
        limit,
        offset
      }
    })

  } catch (error) {
    console.error('Get admin transactions error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to fetch transactions'
    }, { status: 500 })
  }
}