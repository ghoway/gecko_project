import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken, getAccessibleServices, canAccessService } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { ApiResponse, GroupedServices, ServiceWithoutCookieData } from '@/types'

interface GroupedServicesMap {
  [groupId: number]: {
    id: number
    name: string
    categories: {
      [categoryId: number]: {
        id: number
        name: string
        description: string | null
        icon_url: string | null
        services: ServiceWithoutCookieData[]
      }
    }
  }
}

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

    // Group services by group -> category -> services
    // Only include active groups and categories
    const groupedServices = services
      .filter(service => service.category.is_active && service.category.group.is_active)
      .reduce((groups, service) => {
      const groupId = service.category.group.id
      const categoryId = service.category.id

      if (!groups[groupId]) {
        groups[groupId] = {
          id: service.category.group.id,
          name: service.category.group.name,
          categories: {}
        }
      }

      if (!groups[groupId].categories[categoryId]) {
        groups[groupId].categories[categoryId] = {
          id: service.category.id,
          name: service.category.name,
          description: service.category.description,
          icon_url: service.category.icon_url,
          services: []
        }
      }

      // Remove cookie_data and category from response for security and lighter payload
      const { cookie_data, category, ...serviceWithoutCookieData } = service
      groups[groupId].categories[categoryId].services.push(serviceWithoutCookieData)

      return groups
    }, {} as GroupedServicesMap)

    // Convert to array
    const result = Object.values(groupedServices).map((group) => ({
      ...group,
      categories: Object.values(group.categories)
    })) as GroupedServices[]

    return NextResponse.json<ApiResponse<GroupedServices[]>>({
      success: true,
      data: result
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
      where: { code: serviceCode, is_active: true },
      select: { code: true, cookie_data: true }
    })

    if (!service) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Service not found'
      }, { status: 404 })
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: service.cookie_data
    })

  } catch (error) {
    console.error('Restore service cookies error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to restore cookies'
    }, { status: 500 })
  }
}