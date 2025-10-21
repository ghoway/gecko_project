import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken, getAccessibleServices, canAccessService } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { ApiResponse, ServiceWithCategory } from '@/types'

type ServiceWithoutCookieData = Omit<ServiceWithCategory, 'cookie_data'>

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const user = await getUserFromToken(token)
    if (!user) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Invalid token'
      }, { status: 401 })
    }

    // Get accessible services based on user's plan
    const services = await getAccessibleServices(user)

    // Remove cookie_data from response for security
    const sanitizedServices = services.map(service => {
      const { cookie_data, ...serviceWithoutCookieData } = service
      return serviceWithoutCookieData
    })

    return NextResponse.json<ApiResponse<ServiceWithoutCookieData[]>>({
      success: true,
      data: sanitizedServices
    })

  } catch (error) {
    console.error('Get services error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to fetch services'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const user = await getUserFromToken(token)
    if (!user) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Invalid token'
      }, { status: 401 })
    }

    const { serviceCode } = await request.json()

    if (!serviceCode || typeof serviceCode !== 'string') {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Service code is required'
      }, { status: 400 })
    }

    // Check if user can access this service
    const canAccess = await canAccessService(user, serviceCode)
    if (!canAccess) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Service not accessible'
      }, { status: 403 })
    }

    // Get the service with cookie_data
    const service = await prisma.service.findUnique({
      where: { code: serviceCode, is_active: true }
    })

    if (!service) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Service not found'
      }, { status: 404 })
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        serviceCode: service.code,
        cookieData: service.cookie_data
      }
    })

  } catch (error) {
    console.error('Restore service cookies error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to restore cookies'
    }, { status: 500 })
  }
}