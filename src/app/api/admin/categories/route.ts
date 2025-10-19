import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'
import type { ApiResponse } from '@/types'

// GET /api/admin/categories - List all service categories (admin only)
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

    const categories = await prisma.serviceCategory.findMany({
      include: {
        group: true,
        services: true,
        _count: {
          select: { services: true }
        }
      },
      orderBy: [
        { group: { name: 'asc' } },
        { name: 'asc' }
      ]
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: categories
    })

  } catch (error) {
    console.error('Get admin categories error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to fetch categories'
    }, { status: 500 })
  }
}

// POST /api/admin/categories - Create new service category (admin only)
export async function POST(request: NextRequest) {
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

    // Check if name already exists in this group
    const existing = await prisma.serviceCategory.findFirst({
      where: {
        name: name.trim(),
        group_id: groupId
      }
    })

    if (existing) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Category with this name already exists in the selected group'
      }, { status: 400 })
    }

    const category = await prisma.serviceCategory.create({
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
      message: 'Service category created successfully'
    })

  } catch (error) {
    console.error('Create category error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to create category'
    }, { status: 500 })
  }
}