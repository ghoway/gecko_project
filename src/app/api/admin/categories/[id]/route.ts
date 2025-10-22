import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'
import type { ApiResponse } from '@/types'

// PUT /api/admin/categories/[id] - Update service category (admin only)
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

    const categoryId = parseInt(id)
    if (isNaN(categoryId)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Invalid category ID'
      }, { status: 400 })
    }

    const { name, description, group_id, icon_url } = await request.json()

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Name is required'
      }, { status: 400 })
    }

    if (!group_id) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Group ID is required'
      }, { status: 400 })
    }

    const groupId = parseInt(group_id.toString())
    if (isNaN(groupId)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Invalid Group ID'
      }, { status: 400 })
    }

    // Check if group exists
    const group = await prisma.serviceGroup.findUnique({
      where: { id: groupId }
    })

    if (!group) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Service group not found'
      }, { status: 400 })
    }

    // Check if another category with this name exists in the same group
    const existing = await prisma.serviceCategory.findFirst({
      where: {
        name: name.trim(),
        group_id: groupId,
        id: { not: categoryId }
      }
    })

    if (existing) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Category with this name already exists in the selected group'
      }, { status: 400 })
    }

    const category = await prisma.serviceCategory.update({
      where: { id: categoryId },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        icon_url: icon_url?.trim() || null,
        group_id: groupId
      },
      include: {
        group: true,
        services: true,
        _count: {
          select: { services: true }
        }
      }
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: category,
      message: 'Service category updated successfully'
    })

  } catch (error) {
    console.error('Update category error:', error)
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Service category not found'
      }, { status: 404 })
    }
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to update category'
    }, { status: 500 })
  }
}

// DELETE /api/admin/categories/[id] - Delete service category (admin only)
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

    const categoryId = parseInt(id)
    if (isNaN(categoryId)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Invalid category ID'
      }, { status: 400 })
    }

    // Check if category has services
    const category = await prisma.serviceCategory.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: { services: true }
        }
      }
    })

    if (!category) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Service category not found'
      }, { status: 404 })
    }

    if (category._count.services > 0) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Cannot delete category with existing services. Please delete all services first.'
      }, { status: 400 })
    }

    await prisma.serviceCategory.delete({
      where: { id: categoryId }
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Service category deleted successfully'
    })

  } catch (error) {
    console.error('Delete category error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to delete category'
    }, { status: 500 })
  }
}