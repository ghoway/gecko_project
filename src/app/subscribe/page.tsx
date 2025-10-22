'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Crown, Check, Star, Sparkles, Menu, X } from 'lucide-react'
import type { UserWithPlan } from '@/types'
import type { Plan } from '@prisma/client'

export default function SubscribePage() {
  const [user, setUser] = useState<UserWithPlan | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [plansLoading, setPlansLoading] = useState<string | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isRenewal, setIsRenewal] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/signin')
      return
    }

    fetchUserData(token)
    fetchPlans()
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
        // Check if this is a renewal (user has existing subscription)
        const hasExistingSubscription = data.data.subscription && (
          data.data.subscription.status === 'active' ||
          new Date(data.data.subscription.ends_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Within last 7 days
        )
        setIsRenewal(hasExistingSubscription)
        // Allow access to subscribe page regardless of subscription status
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

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/plans')
      const data = await response.json()
      if (data.success) {
        setPlans(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error)
    }
  }

  const handleSubscribe = async (planId: number) => {
    const token = localStorage.getItem('token')
    if (!token) return

    setPlansLoading(planId.toString())
    try {
      const response = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ planId })
      })

      const data = await response.json()
      if (data.success) {
        window.location.href = data.data.paymentUrl
      } else {
        alert(data.error || 'Failed to create subscription')
      }
    } catch (error) {
      console.error('Subscription error:', error)
      alert('Failed to create subscription')
    } finally {
      setPlansLoading(null)
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const formatDuration = (days: number) => {
    if (days >= 30) {
      const months = Math.floor(days / 30)
      return `${months} month`
    }
    return `${days} days`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-red-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading subscription page...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-red-50 to-blue-100 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-orange-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-red-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-40 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <header className="relative z-10 bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                {process.env.APP_NAME || "Gecko Store"}
              </span>
            </Link>

            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/dashboard" className="text-gray-700 hover:text-orange-600 transition-colors">
                Dashboard
              </Link>
              <Link href="/subscribe" className="text-orange-600 hover:text-orange-700 transition-colors font-medium">
                Subscribe
              </Link>
              <Link href="/billing" className="text-gray-700 hover:text-orange-600 transition-colors">
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
                <Link href="/subscribe" className="text-orange-600 hover:text-orange-700 transition-colors font-medium" onClick={() => setIsMenuOpen(false)}>
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

      <div className="relative z-10 container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
          {isRenewal ? 'Renew Your Subscription' : 'Choose Your Plan'}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((plan, index) => {
            const isPopular = plan.is_popular
            const isFirst = index === 0
            const isLast = index === plans.length - 1

            return (
              <Card
                key={plan.id}
                className={`group relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:scale-105 ${
                  isPopular
                    ? 'bg-gradient-to-br from-red-50 to-blue-50 via-white/20 backdrop-blur-lg border-2 border-red-400/50 hover:border-red-400/80 transform hover:-translate-y-3 scale-105'
                    : 'bg-white/10 backdrop-blur-lg border border-white/20 hover:bg-white/25 hover:border-white/40 transform hover:-translate-y-2'
                }`}
              >
                {isPopular && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-red-500 to-blue-500 text-white text-center py-2 text-sm font-semibold">
                    <div className="flex items-center justify-center gap-1">
                      <Star className="w-4 h-4 fill-current" />
                      Most Popular
                    </div>
                  </div>
                )}

                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                  isPopular
                    ? 'bg-gradient-to-br from-red-500/20 to-blue-500/20'
                    : isFirst
                    ? 'bg-gradient-to-br from-orange-500/10 to-red-500/10'
                    : isLast
                    ? 'bg-gradient-to-br from-blue-500/10 to-orange-500/10'
                    : 'bg-gradient-to-br from-orange-500/10 to-red-500/10'
                }`}></div>

                <CardHeader className={`text-center relative z-10 ${isPopular ? 'pt-12' : ''}`}>
                  <CardTitle className={`text-2xl transition-colors duration-300 ${
                    isPopular
                      ? 'text-gray-800 group-hover:text-red-700'
                      : isFirst
                      ? 'text-gray-800 group-hover:text-orange-700'
                      : isLast
                      ? 'text-gray-800 group-hover:text-blue-700'
                      : 'text-gray-800 group-hover:text-orange-700'
                  }`}>
                    {plan.name}
                  </CardTitle>
                  <div className={`text-4xl font-bold transition-colors duration-300 ${
                    isPopular
                      ? 'text-red-600 group-hover:text-red-700'
                      : isFirst
                      ? 'text-orange-600 group-hover:text-orange-700'
                      : isLast
                      ? 'text-blue-600 group-hover:text-blue-700'
                      : 'text-orange-600 group-hover:text-orange-700'
                  }`}>
                    {formatPrice(plan.price)}
                  </div>
                  <CardDescription className="text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                    {formatDuration(plan.duration_in_days)} Access
                  </CardDescription>
                </CardHeader>

                <CardContent className="relative z-10">
                  <div className="space-y-3 mb-6">
                    {plan.features && Array.isArray(plan.features) && (plan.features as string[]).map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700 group-hover:text-gray-800 transition-colors duration-300">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={plansLoading === plan.id.toString()}
                    className={`w-full py-6 text-lg font-semibold transition-all transform hover:scale-105 hover:shadow-lg ${
                      isPopular
                        ? 'bg-gradient-to-r from-red-500 to-blue-500 hover:from-red-600 hover:to-blue-600'
                        : isFirst
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'
                        : isLast
                        ? 'bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600'
                        : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'
                    }`}
                  >
                    {plansLoading === plan.id.toString() ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Memproses...
                      </div>
                    ) : (
                      <>
                        {isPopular && <Sparkles className="w-5 h-5 mr-2" />}
                        {isRenewal ? `Renew with ${plan.name}` : `Select ${plan.name}`}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>


    </div>
  )
}