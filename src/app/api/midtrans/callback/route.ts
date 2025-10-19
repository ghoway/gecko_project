import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTransactionStatus } from '@/lib/midtrans'
import type { ApiResponse, MidtransCallbackData } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body: MidtransCallbackData = await request.json()
    const { order_id, transaction_status, payment_type, transaction_id, fraud_status } = body

    console.log('Midtrans callback received:', body)

    // Find transaction by order_id
    const transaction = await prisma.transaction.findFirst({
      where: { midtrans_order_id: order_id },
      include: { user: true, plan: true }
    })

    if (!transaction) {
      console.error('Transaction not found for order_id:', order_id)
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Transaction not found'
      }, { status: 404 })
    }

    // Update transaction status
    let newStatus: 'pending' | 'success' | 'failed' | 'expired' = 'pending'

    switch (transaction_status) {
      case 'capture':
        if (fraud_status === 'accept') {
          newStatus = 'success'
        } else {
          newStatus = 'failed'
        }
        break
      case 'settlement':
        newStatus = 'success'
        break
      case 'deny':
      case 'cancel':
      case 'expire':
        newStatus = 'failed'
        break
      case 'pending':
        newStatus = 'pending'
        break
      default:
        newStatus = 'pending'
    }

    // Update transaction
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: newStatus,
        midtrans_transaction_id: transaction_id || body.transaction_id,
        payment_type,
        metadata: {
          callback_data: body,
          final_status: newStatus
        } as any
      }
    })

    // If payment successful, create/update subscription
    if (newStatus === 'success') {
      const subscriptionEndDate = new Date()
      subscriptionEndDate.setDate(subscriptionEndDate.getDate() + transaction.plan.duration_in_days)

      // Check if subscription exists
      const existingSubscription = await prisma.subscription.findUnique({
        where: { user_id: transaction.user_id }
      })

      if (existingSubscription) {
        // Update existing subscription
        await prisma.subscription.update({
          where: { id: existingSubscription.id },
          data: {
            status: 'active',
            starts_at: new Date(),
            ends_at: subscriptionEndDate,
            plan_id: transaction.plan_id
          }
        })
      } else {
        // Create new subscription
        await prisma.subscription.create({
          data: {
            user_id: transaction.user_id,
            plan_id: transaction.plan_id,
            status: 'active',
            starts_at: new Date(),
            ends_at: subscriptionEndDate
          }
        })
      }

      // Update user plan
      await prisma.user.update({
        where: { id: transaction.user_id },
        data: {
          current_plan_id: transaction.plan_id,
          subscription_ends_at: subscriptionEndDate
        }
      })
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Callback processed successfully'
    })

  } catch (error) {
    console.error('Midtrans callback error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Callback processing failed'
    }, { status: 500 })
  }
}

// For testing purposes, also allow GET to check transaction status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('order_id')

    if (!orderId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Order ID required'
      }, { status: 400 })
    }

    const status = await getTransactionStatus(orderId)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: status
    })

  } catch (error) {
    console.error('Get transaction status error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to get transaction status'
    }, { status: 500 })
  }
}