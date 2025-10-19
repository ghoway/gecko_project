import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'
import type { ApiResponse, ServiceWithCategory } from '@/types'

// GET /api/admin/services - List all services (admin only)
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

    const services = await prisma.service.findMany({
      include: {
        category: {
          include: {
            group: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    })

    return NextResponse.json<ApiResponse<ServiceWithCategory[]>>({
      success: true,
      data: services
    })

  } catch (error) {
    console.error('Get admin services error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to fetch services'
    }, { status: 500 })
  }
}

// POST /api/admin/services - Create new service (admin only)
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

    const body = await request.json()
    const { code, name, category_id, cookie_data, is_active = true } = body

    if (!code || !name || !category_id) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Code, name, and category_id are required'
      }, { status: 400 })
    }

    // Check if service code already exists
    const existingService = await prisma.service.findUnique({
      where: { code }
    })

    if (existingService) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Service code already exists'
      }, { status: 409 })
    }

    const service = await prisma.service.create({
      data: {
        code,
        name,
        category_id: parseInt(category_id),
        cookie_data: cookie_data || {},
        is_active
      },
      include: {
        category: {
          include: {
            group: true
          }
        }
      }
    })

    return NextResponse.json<ApiResponse<ServiceWithCategory>>({
      success: true,
      data: service,
      message: 'Service created successfully'
    })

  } catch (error) {
    console.error('Create service error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to create service'
    }, { status: 500 })
  }
}