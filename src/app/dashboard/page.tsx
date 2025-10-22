'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Crown, User, Mail, Calendar, CreditCard, Menu, X } from 'lucide-react'
import type { UserWithSubscription } from '@/types'

export default function DashboardPage() {
  const [user, setUser] = useState<UserWithSubscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/signin')
      return
    }

    // Fetch user data from API
    fetchUserData(token)
  }, [router])

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
        // Allow access to dashboard regardless of subscription status
      } else {
        localStorage.removeItem('token')
        router.push('/auth/signin')
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error)
      localStorage.removeItem('token')
      router.push('/auth/signin')
    } finally {
      setLoading(false)
    }
  }



  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const getDaysUntilExpiry = (dateString?: string | Date | null) => {
    if (!dateString) return 0
    const today = new Date()
    const expiryDate = new Date(dateString)
    const diffTime = expiryDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  const getPlanColor = (planName?: string) => {
    if (!planName) return 'text-gray-600 bg-gray-100'
    switch (planName.toLowerCase()) {
      case 'starter': return 'text-orange-600 bg-orange-100'
      case 'pro': return 'text-red-600 bg-red-100'
      case 'premium': return 'text-blue-600 bg-blue-100'
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
          <p className="text-gray-600">Loading dashboard...</p>
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
              <Link href="/dashboard" className="text-orange-600 hover:text-orange-700 transition-colors font-medium">
                Dashboard
              </Link>
              <Link href="/subscribe" className="text-gray-700 hover:text-orange-600 transition-colors">
                Subscribe
              </Link>
              <Link href="/billing" className="text-gray-700 hover:text-orange-600 transition-colors">
                Billing
              </Link>
              <Button className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white border-0" onClick={handleLogout}>
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
                <Link href="/dashboard" className="text-orange-600 hover:text-orange-700 transition-colors font-medium" onClick={() => setIsMenuOpen(false)}>
                  Dashboard
                </Link>
                <Link href="/subscribe" className="text-gray-700 hover:text-orange-600 transition-colors" onClick={() => setIsMenuOpen(false)}>
                  Subscribe
                </Link>
                <Link href="/billing" className="text-gray-700 hover:text-orange-600 transition-colors" onClick={() => setIsMenuOpen(false)}>
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

      {/* Dashboard Content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
          Dashboard
        </h1>

        {/* User Profile & Subscription Card */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
          {/* User Profile Card */}
          <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-800">
                <User className="w-5 h-5 mr-2" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{user?.name || 'User'}</p>
                  <p className="text-sm text-gray-600">{user?.subscription?.plan?.name || 'No Plan'} Member</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center text-gray-700">
                  <Mail className="w-4 h-4 mr-3 text-orange-500" />
                  <span>{user?.email || 'N/A'}</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <Calendar className="w-4 h-4 mr-3 text-red-500" />
                  <span>Member since: {user?.created_at ? formatDate(new Date(user.created_at).toISOString()) : 'N/A'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Card */}
          <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-800">
                <CreditCard className="w-5 h-5 mr-2" />
                Subscription Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="flex items-center justify-between">
                 <span className="text-gray-700">Current Plan:</span>
                 <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getPlanColor(user?.subscription?.plan?.name)}`}>
                   {user?.subscription?.plan?.name || 'No Plan'}
                 </span>
               </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Status:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    user?.subscription?.status === 'active'
                      ? 'text-green-600 bg-green-100'
                      : 'text-red-600 bg-red-100'
                  }`}>
                    {user?.subscription?.status === 'active' ? 'Active' : 'No Active Plan'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Expires:</span>
                  <span className="text-gray-800 font-medium">
                    {user?.subscription?.ends_at ? formatDate(new Date(user.subscription.ends_at).toISOString()) : 'N/A'}
                  </span>
                </div>

              <div className="pt-4 border-t border-white/20">
                <div className="text-center">
                   <p className="text-2xl font-bold text-gray-800">
                     {getDaysUntilExpiry(user?.subscription?.ends_at)}
                   </p>
                  <p className="text-sm text-gray-600">days remaining</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subscription Renewal Prompt */}
        {(!user?.subscription || getDaysUntilExpiry(user?.subscription?.ends_at) <= 7) && (
          <div className="max-w-4xl mx-auto mb-8">
            <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                      {!user?.subscription ? 'No Active Subscription' : 'Subscription Expiring Soon'}
                    </h3>
                    <p className="text-yellow-700">
                      {!user?.subscription
                        ? 'Subscribe to access premium services and accounts.'
                        : `Your subscription expires in ${getDaysUntilExpiry(user?.subscription?.ends_at)} days. Renew now to maintain access.`
                      }
                    </p>
                  </div>
                  <Link href="/subscribe">
                    <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white">
                      {!user?.subscription ? 'Subscribe Now' : 'Renew Subscription'}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Services Access Section */}
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            Your Services
          </h2>
          <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
            <CardContent className="p-8">
              <p className="text-center text-gray-600">
                Service access information will be displayed here. Use the extension to access your premium accounts.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>


    </div>
  )
}

