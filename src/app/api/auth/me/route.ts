import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'
import type { ApiResponse, UserWithPlan } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'No token provided'
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

    // Return user without password
    const userResponse: UserWithPlan = {
      ...user,
      password: ''
    }

    return NextResponse.json<ApiResponse<UserWithPlan>>({
      success: true,
      data: userResponse
    })

  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}