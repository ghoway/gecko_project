import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken, getAccessibleServices } from '@/lib/auth'
import type { ApiResponse, ServiceWithCategory } from '@/types'

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

    return NextResponse.json<ApiResponse<ServiceWithCategory[]>>({
      success: true,
      data: services
    })

  } catch (error) {
    console.error('Get services error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to fetch services'
    }, { status: 500 })
  }
}