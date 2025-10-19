import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'
import type { ApiResponse } from '@/types'

// GET /api/admin/users - List all users (admin only)
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

    const users = await prisma.user.findMany({
      include: {
        plan: true,
        _count: {
          select: {
            transactions: true,
            sessions: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: users
    })

  } catch (error) {
    console.error('Get admin users error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to fetch users'
    }, { status: 500 })
  }
}