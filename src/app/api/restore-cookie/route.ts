import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken, canAccessService } from '@/lib/auth'
import type { ApiResponse, CookieRestoreRequest, CookieRestoreResponse, CookieData } from '@/types'

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

    const body: CookieRestoreRequest = await request.json()
    const { serviceCode } = body

    if (!serviceCode) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Service code is required'
      }, { status: 400 })
    }

    // Check if user can access this service
    const hasAccess = await canAccessService(user, serviceCode)
    if (!hasAccess) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Access denied to this service'
      }, { status: 403 })
    }

    // Get service data
    const service = await prisma.service.findUnique({
      where: { code: serviceCode },
      include: {
        category: {
          include: {
            group: true
          }
        }
      }
    })

    if (!service || !service.is_active) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Service not found or inactive'
      }, { status: 404 })
    }

    // Log the restore activity for audit
    await prisma.failedLoginAttempt.create({
      data: {
        user_id: user.id,
        ip_address: request.headers.get('x-forwarded-for')?.split(',')[0] ||
                   request.headers.get('x-real-ip') ||
                   'unknown',
        attempted_at: new Date()
      }
    })

    // Note: In a real app, you'd want a separate audit log table
    // For now, we're using failed_login_attempt as a proxy for activity logging

    const response: CookieRestoreResponse = {
      success: true,
      cookies: service.cookie_data as unknown as CookieData[]
    }

    return NextResponse.json<ApiResponse<CookieRestoreResponse>>({
      success: true,
      data: response
    })

  } catch (error) {
    console.error('Cookie restore error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to restore cookies'
    }, { status: 500 })
  }
}