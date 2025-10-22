import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { ApiResponse } from '@/types'
import type { Plan } from '@prisma/client'

export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      where: { is_active: true },
      orderBy: { price: 'asc' }
    })

    return NextResponse.json<ApiResponse<Plan[]>>({
      success: true,
      data: plans
    })

  } catch (error) {
    console.error('Get plans error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to fetch plans'
    }, { status: 500 })
  }
}