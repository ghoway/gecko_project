// @ts-expect-error - midtrans-client types are not available
import Midtrans from 'midtrans-client'

const serverKey = process.env.MIDTRANS_SERVER_KEY!
const clientKey = process.env.MIDTRANS_CLIENT_KEY!

// Core API
export const coreApi = new Midtrans.CoreApi({
  isProduction: false,
  serverKey,
  clientKey
})

// Snap API
export const snap = new Midtrans.Snap({
  isProduction: false,
  serverKey,
  clientKey
})

export interface CreateTransactionParams {
  orderId: string
  amount: number
  taxAmount?: number
  customerDetails: {
    first_name: string
    last_name: string
    email: string
    phone?: string
  }
  itemDetails: Array<{
    id: string
    price: number
    quantity: number
    name: string
  }>
}

export const calculateTax = (amount: number): number => {
  const taxRate = parseFloat(process.env.MIDTRANS_TAX_FEES || '0') / 100
  return Math.round(amount * taxRate)
}

export const createTransaction = async (params: CreateTransactionParams) => {
  const taxAmount = params.taxAmount || calculateTax(params.amount)
  const grossAmount = params.amount + taxAmount

  const transaction = {
    transaction_details: {
      order_id: params.orderId,
      gross_amount: grossAmount
    },
    customer_details: params.customerDetails,
    item_details: [
      ...params.itemDetails,
      ...(taxAmount > 0 ? [{
        id: 'tax',
        price: taxAmount,
        quantity: 1,
        name: 'Tax'
      }] : [])
    ],
    credit_card: {
      secure: true
    }
  }

  try {
    const result = await snap.createTransaction(transaction)
    console.log('Midtrans Snap response:', result)
    return {
      token: result.token,
      redirect_url: result.redirect_url,
      tax_amount: taxAmount,
      subtotal: params.amount,
      total: grossAmount
    }
  } catch (error) {
    console.error('Midtrans Snap error:', error)
    throw new Error(`Midtrans payment creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export const getTransactionStatus = async (orderId: string) => {
  return coreApi.transaction.status(orderId)
}

export const cancelTransaction = async (orderId: string) => {
  return coreApi.transaction.cancel(orderId)
}

export const expireTransaction = async (orderId: string) => {
  return coreApi.transaction.expire(orderId)
}