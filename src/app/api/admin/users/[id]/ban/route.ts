import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'
import type { ApiResponse } from '@/types'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const admin = await getUserFromToken(token)
    if (!admin || !admin.is_admin) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Admin access required'
      }, { status: 403 })
    }

    const userId = params.id
    const { banned } = await request.json()

    // Update user ban status
    const user = await prisma.user.update({
      where: { id: userId },
      data: { banned },
      select: {
        id: true,
        name: true,
        email: true,
        banned: true,
        updated_at: true
      }
    })

    // If banning user, invalidate all their sessions
    if (banned) {
      await prisma.session.deleteMany({
        where: { user_id: userId }
      })
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: user,
      message: `User ${banned ? 'banned' : 'unbanned'} successfully`
    })

  } catch (error) {
    console.error('Ban/unban user error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to update user status'
    }, { status: 500 })
  }
}