import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'
import type { ApiResponse, PlanWithServices } from '@/types'

// PUT /api/admin/plans/[id] - Update plan (admin only)
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

    const planId = parseInt(params.id)
    if (isNaN(planId)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Invalid plan ID'
      }, { status: 400 })
    }

    const { name, price, duration_in_days, features, is_popular, is_active, serviceIds } = await request.json()

    if (!name || !price || !duration_in_days) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Name, price, and duration are required'
      }, { status: 400 })
    }

    if (typeof price !== 'number' || price <= 0) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Price must be a positive number'
      }, { status: 400 })
    }

    if (typeof duration_in_days !== 'number' || duration_in_days <= 0) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Duration must be a positive number'
      }, { status: 400 })
    }

    // Check if another plan with this name exists
    const existing = await prisma.plan.findFirst({
      where: {
        name: name.trim(),
        id: { not: planId }
      }
    })

    if (existing) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Plan with this name already exists'
      }, { status: 400 })
    }

    // Update plan
    const plan = await prisma.plan.update({
      where: { id: planId },
      data: {
        name: name.trim(),
        price,
        duration_in_days,
        features: features ? JSON.stringify(features) : undefined,
        is_popular: is_popular !== undefined ? is_popular : undefined,
        is_active: is_active !== undefined ? is_active : undefined
      }
    })

    // Update services if provided
    if (serviceIds !== undefined && Array.isArray(serviceIds)) {
      // Remove existing plan services
      await prisma.planService.deleteMany({
        where: { plan_id: planId }
      })

      // Add new services
      if (serviceIds.length > 0) {
        const planServices = serviceIds.map(serviceId => ({
          plan_id: planId,
          service_id: serviceId
        }))

        await prisma.planService.createMany({
          data: planServices,
          skipDuplicates: true
        })
      }
    }

    // Fetch the complete plan with services
    const completePlan = await prisma.plan.findUnique({
      where: { id: planId },
      include: {
        plan_services: {
          include: {
            service: {
              include: {
                category: {
                  include: {
                    group: true
                  }
                }
              }
            }
          }
        }
      }
    })

    // Transform to PlanWithServices type
    const transformedPlan: PlanWithServices = {
      ...completePlan!,
      plan_services: completePlan!.plan_services.map(ps => ({
        service: ps.service
      }))
    }

    return NextResponse.json<ApiResponse<PlanWithServices>>({
      success: true,
      data: transformedPlan,
      message: 'Plan updated successfully'
    })

  } catch (error) {
    console.error('Update plan error:', error)
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Plan not found'
      }, { status: 404 })
    }
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to update plan'
    }, { status: 500 })
  }
}

// DELETE /api/admin/plans/[id] - Delete plan (admin only)
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

    const planId = parseInt(params.id)
    if (isNaN(planId)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Invalid plan ID'
      }, { status: 400 })
    }

    // Check if plan has active users
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
      include: {
        users: {
          where: {
            subscription_ends_at: {
              gt: new Date()
            }
          }
        },
        transactions: {
          where: {
            status: 'success'
          }
        }
      }
    })

    if (!plan) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Plan not found'
      }, { status: 404 })
    }

    if (plan.users.length > 0) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Cannot delete plan with active subscribers. Please wait for subscriptions to expire or migrate users first.'
      }, { status: 400 })
    }

    // Delete plan services first (cascade delete should handle this, but let's be explicit)
    await prisma.planService.deleteMany({
      where: { plan_id: planId }
    })

    // Delete plan
    await prisma.plan.delete({
      where: { id: planId }
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Plan deleted successfully'
    })

  } catch (error) {
    console.error('Delete plan error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to delete plan'
    }, { status: 500 })
  }
}