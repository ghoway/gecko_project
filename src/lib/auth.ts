import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
export { getAccessibleServices, canAccessService, hasActiveSubscription } from './access-control'

const JWT_SECRET: string = process.env.JWT_SECRET || 'your-super-secret-jwt-key-here'
const JWT_EXPIRES_IN = process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || '15m'

export interface JWTPayload {
  userId: string
  email: string
  isAdmin: boolean
}

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12)
}

export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword)
}

export const generateToken = (payload: JWTPayload): string => {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured')
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions)
}

export const verifyToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}

export const getUserFromToken = async (token: string) => {
  const payload = verifyToken(token)
  if (!payload) return null

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: {
      plan: true,
      sessions: {
        where: { token },
        orderBy: { last_activity_at: 'desc' },
        take: 1
      }
    }
  })

  if (!user || user.sessions.length === 0) return null

  const session = user.sessions[0]
  if (session.expires_at <= new Date()) return null

  // Update last activity
  await prisma.session.update({
    where: { id: session.id },
    data: { last_activity_at: new Date() }
  })

  return user
}

export const createSession = async (userId: string, token: string, ipAddress: string, deviceInfo?: any) => {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

  return prisma.session.create({
    data: {
      user_id: userId,
      token,
      ip_address: ipAddress,
      device_info: deviceInfo,
      expires_at: expiresAt,
      last_activity_at: new Date()
    }
  })
}

export const invalidateUserSessions = async (userId: string, exceptToken?: string) => {
  await prisma.session.deleteMany({
    where: {
      user_id: userId,
      ...(exceptToken && { NOT: { token: exceptToken } })
    }
  })
}

export const recordFailedLogin = async (userId: string, ipAddress: string) => {
  await prisma.failedLoginAttempt.create({
    data: {
      user_id: userId,
      ip_address: ipAddress
    }
  })
}

export const getFailedLoginCount = async (userId: string, minutesAgo: number = 15): Promise<number> => {
  const since = new Date()
  since.setMinutes(since.getMinutes() - minutesAgo)

  return prisma.failedLoginAttempt.count({
    where: {
      user_id: userId,
      attempted_at: { gte: since }
    }
  })
}