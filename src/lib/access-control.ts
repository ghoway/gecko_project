import { prisma } from './prisma'
import type { User } from '@prisma/client'

export const hasActiveSubscription = (user: User): boolean => {
  if (!user.subscription_ends_at) return false
  return user.subscription_ends_at > new Date()
}

export const canAccessService = async (user: User, serviceCode: string): Promise<boolean> => {
  if (user.is_admin) return true

  if (!hasActiveSubscription(user)) return false

  const service = await prisma.service.findUnique({
    where: { code: serviceCode },
    include: {
      plan_services: {
        where: { plan_id: user.current_plan_id! }
      }
    }
  })

  if (!service) return false

  return service.plan_services.length > 0
}

export const getAccessibleServices = async (user: User) => {
  if (user.is_admin) {
    return prisma.service.findMany({
      where: { is_active: true },
      include: {
        category: {
          include: {
            group: true
          }
        }
      }
    })
  }

  if (!hasActiveSubscription(user)) return []

  return prisma.service.findMany({
    where: {
      is_active: true,
      plan_services: {
        some: {
          plan_id: user.current_plan_id!
        }
      }
    },
    include: {
      category: {
        include: {
          group: true
        }
      }
    }
  })
}

export const getServiceGroupsWithCategories = async (user: User) => {
  const services = await getAccessibleServices(user)

  const groupsMap = new Map()

  for (const service of services) {
    const groupId = service.category.group_id
    const group = service.category.group

    if (!groupsMap.has(groupId)) {
      groupsMap.set(groupId, {
        ...group,
        categories: new Map()
      })
    }

    const groupData = groupsMap.get(groupId)
    const categoryId = service.category.id

    if (!groupData.categories.has(categoryId)) {
      groupData.categories.set(categoryId, {
        ...service.category,
        services: []
      })
    }

    groupData.categories.get(categoryId).services.push(service)
  }

  return Array.from(groupsMap.values()).map(group => ({
    ...group,
    categories: Array.from(group.categories.values())
  }))
}