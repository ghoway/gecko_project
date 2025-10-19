import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { ApiResponse, PlanWithServices } from '@/types'

export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      where: { is_active: true },
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
    console.error('Get plans error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to fetch plans'
    }, { status: 500 })
  }
}