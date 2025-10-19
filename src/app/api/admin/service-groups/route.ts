import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'
import type { ApiResponse } from '@/types'

// GET /api/admin/service-groups - List all service groups (admin only)
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

    const serviceGroups = await prisma.serviceGroup.findMany({
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
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: serviceGroups
    })

  } catch (error) {
    console.error('Get admin service groups error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to fetch service groups'
    }, { status: 500 })
  }
}

// POST /api/admin/service-groups - Create new service group (admin only)
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

    const { name } = await request.json()

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Name is required'
      }, { status: 400 })
    }

    // Check if name already exists
    const existing = await prisma.serviceGroup.findFirst({
      where: { name: name.trim() }
    })

    if (existing) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Service group with this name already exists'
      }, { status: 400 })
    }

    const serviceGroup = await prisma.serviceGroup.create({
      data: {
        name: name.trim()
      }
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: serviceGroup,
      message: 'Service group created successfully'
    })

  } catch (error) {
    console.error('Create service group error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to create service group'
    }, { status: 500 })
  }
}