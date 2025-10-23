'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function BillingPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to profile page with billing tab
    router.replace('/profile?tab=billing')
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-red-50 to-blue-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to Profile...</p>
      </div>
    </div>
  )
}