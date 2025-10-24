'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Mail, Calendar, CreditCard } from 'lucide-react'
import type { UserWithSubscription, GroupedServices } from '@/types'

function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null
  return null
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserWithSubscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [services, setServices] = useState<GroupedServices[]>([])
  const [servicesLoading, setServicesLoading] = useState(false)
  const router = useRouter()

  const fetchServices = useCallback(async (token: string) => {
    try {
      setServicesLoading(true)
      const response = await fetch('/api/services', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.success) {
        setServices(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch services:', error)
    } finally {
      setServicesLoading(false)
    }
  }, [])

  const fetchUserData = useCallback(async (token: string) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.success) {
        setUser(data.data)
        // Fetch services if user has active subscription
        if (data.data.subscription?.status === 'active') {
          await fetchServices(token)
        }
        // Allow access to dashboard regardless of subscription status
      } else {
        deleteCookie('token')
        router.push('/auth/signin')
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error)
      deleteCookie('token')
      router.push('/auth/signin')
    } finally {
      setLoading(false)
    }
  }, [fetchServices, router])

  useEffect(() => {
    const token = getCookie('token')
    if (!token) {
      router.push('/auth/signin')
      return
    }

    // Fetch user data from API
    fetchUserData(token)
  }, [router, fetchUserData])



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

      <Navigation />

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
              {user?.subscription?.status === 'active' ? (
                servicesLoading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your services...</p>
                  </div>
                ) : services.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-16 gap-8">
                     {services.flatMap(group =>
                      group.categories.map(category => (
                        <div key={category.id} className="text-center p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
                          {category.icon_url && (
                            <div className="w-12 h-12 mx-auto mb-3 rounded-lg shadow-sm overflow-hidden">
                              <Image
                                src={category.icon_url}
                                alt={category.name}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                            </div>
                          )}
                          <h3 className="font-semibold text-gray-800 text-sm mb-1">{category.name}</h3>
                          
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <p className="text-center text-gray-600">
                    No services available for your current plan.
                  </p>
                )
              ) : (
                <div className="text-center">
                  <p className="text-gray-600 mb-4">
                    Subscribe to access premium services and accounts.
                  </p>
                  <Link href="/subscribe">
                    <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white">
                      Subscribe Now
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>


    </div>
  )
}

