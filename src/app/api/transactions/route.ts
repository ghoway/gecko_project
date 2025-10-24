import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'
import type { ApiResponse } from '@/types'

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

    // Get user's transactions with invoice data
    const transactions = await prisma.transaction.findMany({
      where: {
        user_id: user.id
      },
      include: {
        invoice: true
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    // Transform response to hide sensitive data and use invoice snapshots
    const safeTransactions = transactions.map((transaction) => {
      const invoice = transaction.invoice
      if (!invoice) {
        // Fallback for transactions without invoices (shouldn't happen in normal flow)
        return {
          id: transaction.id,
          status: transaction.status,
          amount: transaction.amount,
          midtrans_order_id: transaction.midtrans_order_id,
          payment_type: transaction.payment_type,
          redirect_url: transaction.redirect_url, // Keep for emergency payment access
          created_at: transaction.created_at,
          updated_at: transaction.updated_at,
          plan: null // No invoice data available
        }
      }

      return {
        id: transaction.id,
        status: transaction.status,
        amount: invoice.final_amount,
        midtrans_order_id: transaction.midtrans_order_id,
        payment_type: invoice.payment_type,
        payment_method: invoice.payment_method,
        payment_gateway: invoice.payment_gateway,
        redirect_url: transaction.redirect_url, // Keep for emergency payment access
        created_at: transaction.created_at,
        updated_at: transaction.updated_at,
        // Use invoice snapshot data for historical accuracy
        plan: {
          name: invoice.plan_name,
          price: invoice.plan_price,
          duration_in_days: invoice.plan_duration_days
        },
        // Include financial details from invoice
        discount_amount: invoice.discount_amount,
        tax_amount: invoice.tax_amount,
        final_amount: invoice.final_amount,
        // User snapshot for audit trail
        user_snapshot: {
          name: invoice.user_name,
          email: invoice.user_email
        }
      }
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: safeTransactions
    })

  } catch (error) {
    console.error('Get transactions error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}