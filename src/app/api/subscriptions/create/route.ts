import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'
import { createTransaction, calculateTax } from '@/lib/midtrans'
import type { ApiResponse } from '@/types'

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

    const body = await request.json()
    const { planId } = body

    if (!planId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Plan ID is required'
      }, { status: 400 })
    }

    // Get plan details
    const plan = await prisma.plan.findUnique({
      where: { id: parseInt(planId) }
    })

    if (!plan || !plan.is_active) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Plan not found or inactive'
      }, { status: 404 })
    }

    // Check if user already has a subscription
    const existingSubscription = await prisma.subscription.findUnique({
      where: { user_id: user.id }
    })

    if (existingSubscription) {
      // Check if subscription is still active and not expiring soon
      const now = new Date()
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      const isActiveAndNotExpiringSoon = existingSubscription.status === 'active' && existingSubscription.ends_at > sevenDaysFromNow

      if (isActiveAndNotExpiringSoon) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'You already have an active subscription'
        }, { status: 400 })
      }

      // If subscription is expired or expiring within 7 days, allow renewal
    }

    // Calculate tax
    const taxAmount = calculateTax(plan.price)
    const totalAmount = plan.price + taxAmount

    // Generate order ID (Midtrans limit: 50 chars, alphanumeric + dash/underscore/period)
    const orderId = `SUB-${Date.now()}-${user.id.slice(0, 8)}`

    // Validate order_id length
    if (orderId.length > 50) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Order ID generation failed'
      }, { status: 500 })
    }

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        user_id: user.id,
        plan_id: plan.id,
        amount: totalAmount,
        midtrans_order_id: orderId,
        status: 'pending',
        metadata: {
          subtotal: plan.price,
          tax_amount: taxAmount,
          plan_name: plan.name
        } as any
      }
    })

    // Create Midtrans transaction using Snap
    let midtransResponse
  try {
    console.log('Creating subscription for user:', user.id, 'plan:', planId)
      midtransResponse = await createTransaction({
        orderId,
        amount: plan.price,
        taxAmount,
        customerDetails: {
          first_name: user.name.split(' ')[0] || 'User',
          last_name: user.name.split(' ').slice(1).join(' ') || '',
          email: user.email,
          phone: '' // Optional
        },
        itemDetails: [{
          id: plan.id.toString(),
          price: plan.price,
          quantity: 1,
          name: plan.name
        }]
      })
    } catch (error) {
      console.error('Midtrans transaction creation failed:', error)
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Payment gateway error. Please try again.'
      }, { status: 500 })
    }

    console.log('Midtrans response:', midtransResponse)

    // Update transaction with Midtrans data
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        metadata: {
          snap_token: midtransResponse.token,
          redirect_url: midtransResponse.redirect_url,
          subtotal: plan.price,
          tax_amount: taxAmount,
          plan_name: plan.name
        } as any
      }
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        orderId,
        paymentUrl: midtransResponse.redirect_url,
        snapToken: midtransResponse.token,
        transactionId: transaction.id,
        subtotal: plan.price,
        taxAmount: taxAmount,
        totalAmount: totalAmount
      },
      message: 'Payment initiated successfully'
    })

  } catch (error) {
    console.error('Create subscription error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to create subscription'
    }, { status: 500 })
  }
}