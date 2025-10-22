'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Crown, CreditCard, Calendar, DollarSign, Menu, X } from 'lucide-react'

interface Transaction {
  id: number
  status: 'pending' | 'success' | 'failed' | 'expired'
  amount: number
  midtrans_order_id: string
  midtrans_transaction_id?: string
  payment_type?: string
  created_at: string
  plan: {
    name: string
    price: number
  }
}

export default function BillingPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/signin')
      return
    }

    fetchTransactions(token)
  }, [router])

  const fetchTransactions = async (token: string) => {
    try {
      const response = await fetch('/api/transactions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.success) {
        setTransactions(data.data)
      } else {
        console.error('Failed to fetch transactions:', data.error)
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'failed': return 'text-red-600 bg-red-100'
      case 'expired': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const handleLogout = async () => {
    const token = localStorage.getItem('token')
    if (token) {
      await fetch('/api/auth/signout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
    }
    localStorage.removeItem('token')
    router.push('/auth/signin')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-red-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading billing history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-red-50 to-blue-100 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-orange-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-red-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-40 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Gecko Store
              </span>
            </Link>

            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/dashboard" className="text-gray-700 hover:text-orange-600 transition-colors">
                Dashboard
              </Link>
              <Link href="/subscribe" className="text-gray-700 hover:text-orange-600 transition-colors">
                Subscribe
              </Link>
              <Link href="/billing" className="text-orange-600 hover:text-orange-700 transition-colors font-medium">
                Billing
              </Link>
              <Button className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-red-600 text-white border-0" onClick={handleLogout}>
                Sign Out
              </Button>
            </nav>

            <button
              className="md:hidden text-gray-700"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>

          {/* Mobile menu */}
          {isMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-white/20 pt-4">
              <nav className="flex flex-col space-y-4">
                <Link href="/dashboard" className="text-gray-700 hover:text-orange-600 transition-colors" onClick={() => setIsMenuOpen(false)}>
                  Dashboard
                </Link>
                <Link href="/subscribe" className="text-gray-700 hover:text-orange-600 transition-colors" onClick={() => setIsMenuOpen(false)}>
                  Subscribe
                </Link>
                <Link href="/billing" className="text-orange-600 hover:text-orange-700 transition-colors font-medium" onClick={() => setIsMenuOpen(false)}>
                  Billing
                </Link>
                <Button className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-red-600 text-white border-0 w-full" onClick={handleLogout}>
                  Sign Out
                </Button>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Billing Content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
          Billing History
        </h1>

        {transactions.length === 0 ? (
          <Card className="bg-white/10 backdrop-blur-lg border border-white/20 max-w-4xl mx-auto">
            <CardContent className="p-8 text-center">
              <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Transactions Yet</h3>
              <p className="text-gray-500 mb-6">You haven&apos;t made any payments yet. Subscribe to get started!</p>
              <Link href="/subscribe">
                <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white">
                  Subscribe Now
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6 max-w-6xl mx-auto">
            {transactions.map((transaction) => (
              <Card key={transaction.id} className="bg-white/10 backdrop-blur-lg border border-white/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center text-gray-800">
                      <DollarSign className="w-5 h-5 mr-2 text-green-500" />
                      {formatCurrency(transaction.amount)}
                    </CardTitle>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(transaction.status)}`}>
                      {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center text-gray-700">
                        <CreditCard className="w-4 h-4 mr-3 text-orange-500" />
                        <span>Plan: {transaction.plan.name}</span>
                      </div>
                      <div className="flex items-center text-gray-700">
                        <Calendar className="w-4 h-4 mr-3 text-red-500" />
                        <span>Date: {formatDate(transaction.created_at)}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-gray-600">
                        <strong>Order ID:</strong> {transaction.midtrans_order_id}
                      </div>
                      {transaction.midtrans_transaction_id && (
                        <div className="text-sm text-gray-600">
                          <strong>Transaction ID:</strong> {transaction.midtrans_transaction_id}
                        </div>
                      )}
                      {transaction.payment_type && (
                        <div className="text-sm text-gray-600">
                          <strong>Payment Method:</strong> {transaction.payment_type}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}