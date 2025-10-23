'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Navigation from '@/components/Navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Crown, CreditCard, DollarSign, User, Settings } from 'lucide-react'
import type { UserWithSubscription } from '@/types'

interface Transaction {
  id: number
  status: 'pending' | 'success' | 'failed' | 'expired'
  amount: number
  midtrans_order_id: string
  midtrans_transaction_id?: string
  payment_type?: string
  created_at: string
  plan_id: number
  redirect_url?: string
  metadata?: Record<string, unknown>
  plan: {
    name: string
    price: number
  }
}

interface ChangePasswordFormData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'billing' | 'settings'>('billing')
  const [user, setUser] = useState<UserWithSubscription | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState<ChangePasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/signin')
      return
    }

    fetchUserData(token)
    fetchTransactions(token)

    // Check for tab query parameter
    const tab = searchParams.get('tab')
    if (tab === 'settings') {
      setActiveTab('settings')
    } else {
      setActiveTab('billing')
    }
  }, [router, searchParams])

  const fetchUserData = async (token: string) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.success) {
        setUser(data.data)
      } else {
        localStorage.removeItem('token')
        router.push('/auth/signin')
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error)
      localStorage.removeItem('token')
      router.push('/auth/signin')
    }
  }

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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match')
      setSubmitting(false)
      return
    }

    if (formData.newPassword.length < 8) {
      setError('New password must be at least 8 characters long')
      setSubmitting(false)
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Password changed successfully!')
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      } else {
        setError(data.error || 'Failed to change password')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
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

  const handlePayNow = (transaction: Transaction) => {
    if (transaction.redirect_url) {
      window.location.href = transaction.redirect_url
    } else {
      alert('Payment link not available. Please contact support.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-red-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
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

      <Navigation />

      <div className="relative z-10 container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
          Profile
        </h1>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-1 border border-white/20">
            <button
              onClick={() => setActiveTab('billing')}
              className={`px-6 py-2 rounded-md font-medium transition-all duration-200 ${
                activeTab === 'billing'
                  ? 'bg-orange-500 text-white shadow-lg'
                  : 'text-gray-700 hover:text-orange-600'
              }`}
            >
              <CreditCard className="w-4 h-4 inline mr-2" />
              Billing
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-6 py-2 rounded-md font-medium transition-all duration-200 ${
                activeTab === 'settings'
                  ? 'bg-orange-500 text-white shadow-lg'
                  : 'text-gray-700 hover:text-orange-600'
              }`}
            >
              <Settings className="w-4 h-4 inline mr-2" />
              Settings
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'billing' && (
          <div className="max-w-6xl mx-auto">
            <Card className="bg-white/10 backdrop-blur-lg border border-white/20 mb-8">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-800">
                  <User className="w-5 h-5 mr-2" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Name</p>
                    <p className="font-semibold text-gray-800">{user?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Email</p>
                    <p className="font-semibold text-gray-800">{user?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Current Plan</p>
                    <p className="font-semibold text-gray-800">{user?.subscription?.plan?.name || 'No Plan'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Member Since</p>
                    <p className="font-semibold text-gray-800">
                      {user?.created_at ? formatDate(new Date(user.created_at).toISOString()) : 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-800">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Transaction History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">No transactions found</p>
                ) : (
                  <div className="space-y-4">
                    {transactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 bg-white/20 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                            <Crown className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">{transaction.plan.name}</p>
                            <p className="text-sm text-gray-600">{formatDate(transaction.created_at)}</p>
                            <p className="text-sm text-gray-600">Order ID: {transaction.midtrans_order_id}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-800">{formatCurrency(transaction.amount)}</p>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(transaction.status)}`}>
                            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                          </span>
                          {transaction.status === 'pending' && transaction.redirect_url && (
                            <div className="mt-2">
                              <Button
                                size="sm"
                                onClick={() => handlePayNow(transaction)}
                                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0"
                              >
                                Pay Now
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-md mx-auto">
            <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-800">
                  <Settings className="w-5 h-5 mr-2" />
                  Change Password
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                      {success}
                    </div>
                  )}

                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      id="currentPassword"
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm placeholder-gray-500 text-gray-900"
                      placeholder="Enter your current password"
                    />
                  </div>

                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      required
                      minLength={8}
                      className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm placeholder-gray-500 text-gray-900"
                      placeholder="Enter new password (min 8 characters)"
                    />
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm placeholder-gray-500 text-gray-900"
                      placeholder="Confirm your new password"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-orange-400 disabled:to-red-400 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transform hover:scale-105"
                  >
                    {submitting ? 'Changing Password...' : 'Change Password'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}