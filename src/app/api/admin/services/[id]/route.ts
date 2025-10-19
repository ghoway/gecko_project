import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'
import type { ApiResponse, ServiceWithCategory } from '@/types'

// PUT /api/admin/services/[id] - Update service (admin only)
export async function PUT(
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
    const user = await getUserFromToken(token)
    if (!user || !user.is_admin) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Admin access required'
      }, { status: 403 })
    }

    const serviceId = parseInt(params.id)
    if (isNaN(serviceId)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Invalid service ID'
      }, { status: 400 })
    }

    const body = await request.json()
    const { code, name, category_id, cookie_data, is_active } = body

    if (!code || !name || !category_id) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Code, name, and category_id are required'
      }, { status: 400 })
    }

    // Check if category exists
    const category = await prisma.serviceCategory.findUnique({
      where: { id: parseInt(category_id) }
    })

    if (!category) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Service category not found'
      }, { status: 400 })
    }

    // Check if another service with this code exists
    const existingService = await prisma.service.findFirst({
      where: {
        code,
        id: { not: serviceId }
      }
    })

    if (existingService) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Service code already exists'
      }, { status: 409 })
    }

    const service = await prisma.service.update({
      where: { id: serviceId },
      data: {
        code,
        name,
        category_id: parseInt(category_id),
        cookie_data: cookie_data || {},
        is_active: is_active !== undefined ? is_active : true
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
      message: 'Service updated successfully'
    })

  } catch (error) {
    console.error('Update service error:', error)
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Service not found'
      }, { status: 404 })
    }
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to update service'
    }, { status: 500 })
  }
}

// DELETE /api/admin/services/[id] - Delete service (admin only)
export async function DELETE(
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
    const user = await getUserFromToken(token)
    if (!user || !user.is_admin) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Admin access required'
      }, { status: 403 })
    }

    const serviceId = parseInt(params.id)
    if (isNaN(serviceId)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Invalid service ID'
      }, { status: 400 })
    }

    // Check if service is used in any plans
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        plan_services: true
      }
    })

    if (!service) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Service not found'
      }, { status: 404 })
    }

    if (service.plan_services.length > 0) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Cannot delete service that is included in plans. Please remove it from all plans first.'
      }, { status: 400 })
    }

    await prisma.service.delete({
      where: { id: serviceId }
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Service deleted successfully'
    })

  } catch (error) {
    console.error('Delete service error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to delete service'
    }, { status: 500 })
  }
}