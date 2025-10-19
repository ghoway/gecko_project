import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create service groups
  const basicGroup = await prisma.serviceGroup.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Basic Services',
      is_active: true
    }
  })

  const premiumGroup = await prisma.serviceGroup.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: 'Premium Services',
      is_active: true
    }
  })

  // Create categories
  const socialMediaCategory = await prisma.serviceCategory.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Social Media',
      description: 'Facebook, Instagram, Twitter cookies',
      group_id: basicGroup.id,
      is_active: true
    }
  })

  const streamingCategory = await prisma.serviceCategory.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: 'Streaming',
      description: 'Netflix, Spotify, YouTube Premium',
      group_id: premiumGroup.id,
      is_active: true
    }
  })

  // Create services
  const facebookService = await prisma.service.upsert({
    where: { code: 'facebook-basic' },
    update: {},
    create: {
      code: 'facebook-basic',
      name: 'Facebook Basic',
      cookie_data: { type: 'basic', accounts: 1 },
      category_id: socialMediaCategory.id,
      is_active: true
    }
  })

  const netflixService = await prisma.service.upsert({
    where: { code: 'netflix-premium' },
    update: {},
    create: {
      code: 'netflix-premium',
      name: 'Netflix Premium',
      cookie_data: { type: 'premium', quality: '4K' },
      category_id: streamingCategory.id,
      is_active: true
    }
  })

  // Create plans
  const basicPlan = await prisma.plan.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Basic',
      price: 250000, // Rp 250,000 (before tax)
      duration_in_days: 30,
      features: JSON.stringify(['Access to basic social media services', '1 account per service', 'Email support']),
      is_popular: false,
      is_active: true
    }
  })

  const proPlan = await prisma.plan.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: 'Pro',
      price: 500000, // Rp 500,000 (before tax)
      duration_in_days: 30,
      features: JSON.stringify(['Access to all basic services', 'Premium streaming services', '5 accounts per service', 'Priority support']),
      is_popular: true,
      is_active: true
    }
  })

  const premiumPlan = await prisma.plan.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      name: 'Premium',
      price: 1000000, // Rp 1,000,000 (before tax)
      duration_in_days: 30,
      features: JSON.stringify(['All Pro features', 'Unlimited accounts', '24/7 support', 'Custom cookie requests']),
      is_popular: false,
      is_active: true
    }
  })

  // Create plan-service relationships
  await prisma.planService.upsert({
    where: { plan_id_service_id: { plan_id: basicPlan.id, service_id: facebookService.id } },
    update: {},
    create: {
      plan_id: basicPlan.id,
      service_id: facebookService.id
    }
  })

  await prisma.planService.upsert({
    where: { plan_id_service_id: { plan_id: proPlan.id, service_id: facebookService.id } },
    update: {},
    create: {
      plan_id: proPlan.id,
      service_id: facebookService.id
    }
  })

  await prisma.planService.upsert({
    where: { plan_id_service_id: { plan_id: proPlan.id, service_id: netflixService.id } },
    update: {},
    create: {
      plan_id: proPlan.id,
      service_id: netflixService.id
    }
  })

  await prisma.planService.upsert({
    where: { plan_id_service_id: { plan_id: premiumPlan.id, service_id: facebookService.id } },
    update: {},
    create: {
      plan_id: premiumPlan.id,
      service_id: facebookService.id
    }
  })

  await prisma.planService.upsert({
    where: { plan_id_service_id: { plan_id: premiumPlan.id, service_id: netflixService.id } },
    update: {},
    create: {
      plan_id: premiumPlan.id,
      service_id: netflixService.id
    }
  })

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })