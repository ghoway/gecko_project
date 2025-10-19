import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'
import type { ApiResponse, PlanWithServices } from '@/types'

// GET /api/admin/plans - List all plans (admin only)
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

    const plans = await prisma.plan.findMany({
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
        },
        _count: {
          select: {
            users: true,
            transactions: true
          }
        }
      },
      orderBy: { price: 'asc' }
    })

    // Transform to PlanWithServices type
    const transformedPlans: PlanWithServices[] = plans.map(plan => ({
      ...plan,
      plan_services: plan.plan_services.map(ps => ({
        service: ps.service
      }))
    }))

    return NextResponse.json<ApiResponse<PlanWithServices[]>>({
      success: true,
      data: transformedPlans
    })

  } catch (error) {
    console.error('Get admin plans error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to fetch plans'
    }, { status: 500 })
  }
}

// POST /api/admin/plans - Create new plan (admin only)
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

    // Check if name already exists
    const existing = await prisma.plan.findFirst({
      where: { name: name.trim() }
    })

    if (existing) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Plan with this name already exists'
      }, { status: 400 })
    }

    // Create plan
    const plan = await prisma.plan.create({
      data: {
        name: name.trim(),
        price,
        duration_in_days,
        features: features ? JSON.stringify(features) : JSON.stringify([]),
        is_popular: is_popular || false,
        is_active: is_active !== undefined ? is_active : true
      }
    })

    // Add services to plan if provided
    if (serviceIds && Array.isArray(serviceIds) && serviceIds.length > 0) {
      const planServices = serviceIds.map(serviceId => ({
        plan_id: plan.id,
        service_id: serviceId
      }))

      await prisma.planService.createMany({
        data: planServices,
        skipDuplicates: true
      })
    }

    // Fetch the complete plan with services
    const completePlan = await prisma.plan.findUnique({
      where: { id: plan.id },
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
      message: 'Plan created successfully'
    })

  } catch (error) {
    console.error('Create plan error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to create plan'
    }, { status: 500 })
  }
}