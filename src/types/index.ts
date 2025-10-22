import type { User, Plan, Service, ServiceGroup, ServiceCategory, Transaction, Subscription } from '@prisma/client'

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Auth types
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
}

export interface AuthResponse {
  user: UserWithPlan
  token: string
}

// User types
export type UserWithPlan = User & {
  plan?: Plan | null
}

// Service types
export type ServiceWithCategory = Service & {
  category: ServiceCategory & {
    group: ServiceGroup
  }
}

export type ServiceWithoutCookieData = Omit<Service, 'cookie_data'>

export interface GroupedServices {
  id: number
  name: string
  categories: {
    id: number
    name: string
    description: string | null
    icon_url: string | null
    services: ServiceWithoutCookieData[]
  }[]
}

export type ServiceGroupWithCategories = ServiceGroup & {
  categories: (ServiceCategory & {
    services: Service[]
  })[]
}

// Plan types
export interface PlanWithServices extends Plan {
  plan_services: {
    service: ServiceWithCategory
  }[]
}

// Transaction types
export type TransactionWithDetails = Transaction & {
  user: User
  plan: Plan
}

// Subscription types
export type SubscriptionWithDetails = Subscription & {
  user: User
  plan: Plan
}

// Dashboard types
export interface DashboardStats {
  totalUsers: number
  activeSubscriptions: number
  totalTransactions: number
  monthlyRevenue: number
}

// Cookie restore types
export interface CookieData {
  name: string
  value: string
  domain: string
  path?: string
  secure?: boolean
  httpOnly?: boolean
  sameSite?: 'strict' | 'lax' | 'none'
  expirationDate?: number
}

export interface CookieRestoreRequest {
  serviceCode: string
  data: Record<string, unknown>
}

export interface CookieRestoreResponse {
  success: boolean
  cookies: CookieData[]
  message?: string
}

// Midtrans types
export interface MidtransCallbackData {
  order_id: string
  transaction_status: string
  payment_type: string
  transaction_id?: string
  fraud_status?: string
  [key: string]: unknown
}

export interface SubscriptionCreateResponse {
  orderId: string
  paymentUrl: string
  snapToken: string
  transactionId: number
  subtotal: number
  taxAmount: number
  totalAmount: number
}

// Form types
export interface LoginFormData {
  email: string
  password: string
}

export interface RegisterFormData {
  name: string
  email: string
  password: string
  confirmPassword: string
}

// Error types
export interface ValidationError {
  field: string
  message: string
}

export interface ApiError {
  code: string
  message: string
  details?: ValidationError[]
}