import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'
import type { ApiResponse } from '@/types'

// PUT /api/admin/service-groups/[id] - Update service group (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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

    const groupId = parseInt(id)
    if (isNaN(groupId)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Invalid group ID'
      }, { status: 400 })
    }

    const { name } = await request.json()

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Name is required'
      }, { status: 400 })
    }

    // Check if another group with this name exists
    const existing = await prisma.serviceGroup.findFirst({
      where: {
        name: name.trim(),
        id: { not: groupId }
      }
    })

    if (existing) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Service group with this name already exists'
      }, { status: 400 })
    }

    const serviceGroup = await prisma.serviceGroup.update({
      where: { id: groupId },
      data: { name: name.trim() },
      include: {
        categories: {
          include: {
            services: true,
            _count: {
              select: { services: true }
            }
          }
        },
        _count: {
          select: { categories: true }
        }
      }
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: serviceGroup,
      message: 'Service group updated successfully'
    })

  } catch (error) {
    console.error('Update service group error:', error)
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Service group not found'
      }, { status: 404 })
    }
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to update service group'
    }, { status: 500 })
  }
}

// DELETE /api/admin/service-groups/[id] - Delete service group (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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

    const groupId = parseInt(id)
    if (isNaN(groupId)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Invalid group ID'
      }, { status: 400 })
    }

    // Check if group has categories
    const group = await prisma.serviceGroup.findUnique({
      where: { id: groupId },
      include: {
        _count: {
          select: { categories: true }
        }
      }
    })

    if (!group) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Service group not found'
      }, { status: 404 })
    }

    if (group._count.categories > 0) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Cannot delete service group with existing categories. Please delete all categories first.'
      }, { status: 400 })
    }

    await prisma.serviceGroup.delete({
      where: { id: groupId }
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Service group deleted successfully'
    })

  } catch (error) {
    console.error('Delete service group error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to delete service group'
    }, { status: 500 })
  }
}