'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import type { UserWithPlan } from '@/types'

interface AuthContextType {
  user: UserWithPlan | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserWithPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      // Validate token and fetch user data
      validateToken(token)
    } else {
      setLoading(false)
    }
  }, [])

  const validateToken = async (token: string) => {
    try {
      // For now, just decode. In real app, call API to validate
      const payload = JSON.parse(atob(token.split('.')[1]))

      // Mock user data - in real app, fetch from /api/auth/me or similar
      setUser({
        id: payload.userId,
        name: 'User Name',
        email: payload.email,
        password: '',
        is_admin: payload.isAdmin,
        banned: false,
        email_verified_at: null,
        last_login_at: null,
        current_plan_id: null,
        subscription_ends_at: null,
        created_at: new Date(),
        updated_at: new Date(),
        plan: null
      })
    } catch (error) {
      localStorage.removeItem('token')
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    })

    const data = await response.json()

    if (data.success) {
      localStorage.setItem('token', data.data.token)
      setUser(data.data.user)

      // Sync token with extension
      window.postMessage({
        type: 'JWT_TOKEN_UPDATE',
        token: data.data.token,
        userId: data.data.user.id
      }, '*')

      router.push('/dashboard')
    } else {
      throw new Error(data.error || 'Login failed')
    }
  }

  const logout = async () => {
    const token = localStorage.getItem('token')
    if (token) {
      try {
        await fetch('/api/auth/signout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      } catch (error) {
        // Ignore logout API errors
      }
    }

    localStorage.removeItem('token')
    setUser(null)

    // Clear token from extension
    window.postMessage({
      type: 'JWT_TOKEN_UPDATE',
      token: null,
      userId: null
    }, '*')

    router.push('/auth/signin')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}