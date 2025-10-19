'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { UserWithPlan, PlanWithServices } from '@/types'

export default function DashboardPage() {
  const [user, setUser] = useState<UserWithPlan | null>(null)
  const [plans, setPlans] = useState<PlanWithServices[]>([])
  const [loading, setLoading] = useState(true)
  const [plansLoading, setPlansLoading] = useState(false)
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

  useEffect(() => {
    fetchPlans()
  }, [])

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

    setPlansLoading(true)
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
        // Redirect to Midtrans payment page
        window.location.href = data.data.paymentUrl
      } else {
        alert(data.error || 'Failed to create subscription')
      }
    } catch (error) {
      console.error('Subscription error:', error)
      alert('Failed to create subscription')
    } finally {
      setPlansLoading(false)
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-gray-800">Gecko Store</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user.name}</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/50 backdrop-blur-sm rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Subscription Status</h3>
                <p className="text-gray-600">
                  {user.plan ? `Active: ${user.plan.name}` : 'No active subscription'}
                </p>
                {user.subscription_ends_at && (
                  <p className="text-sm text-gray-500 mt-1">
                    Expires: {new Date(user.subscription_ends_at).toLocaleDateString()}
                  </p>
                )}
              </div>

              <div className="bg-white/50 backdrop-blur-sm rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Account Type</h3>
                <p className="text-gray-600">
                  {user.is_admin ? 'Administrator' : 'Regular User'}
                </p>
              </div>

              <div className="bg-white/50 backdrop-blur-sm rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Email</h3>
                <p className="text-gray-600">{user.email}</p>
              </div>
            </div>



            <div className="mt-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Choose Your Plan</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`bg-white/50 backdrop-blur-sm rounded-lg p-6 border-2 ${
                      plan.is_popular ? 'border-blue-500' : 'border-gray-200'
                    }`}
                  >
                    {plan.is_popular && (
                      <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full inline-block mb-2">
                        Most Popular
                      </div>
                    )}
                    <h4 className="text-xl font-bold text-gray-800 mb-2">{plan.name}</h4>
                    <div className="mb-4">
                      <div className="text-3xl font-bold text-blue-600">
                        Rp {(plan.price * 1.11).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        Includes 11% tax • {plan.duration_in_days} days
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Rp {plan.price.toLocaleString()} + Rp {(plan.price * 0.11).toLocaleString()} tax
                      </div>
                    </div>
                    <p className="text-gray-600 mb-4">{plan.features ? JSON.parse(plan.features as string).join(', ') : 'Access to basic services'}</p>
                    <button
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={plansLoading || user.current_plan_id === plan.id}
                      className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors duration-200 ${
                        user.current_plan_id === plan.id
                          ? 'bg-green-500 text-white cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-400'
                      }`}
                    >
                      {user.current_plan_id === plan.id
                        ? 'Current Plan'
                        : plansLoading
                        ? 'Processing...'
                        : 'Subscribe Now'
                      }
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

