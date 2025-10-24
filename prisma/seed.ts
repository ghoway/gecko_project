import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  
  // Create plans
  const basicPlan = await prisma.plan.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Basic',
      price: 1,
      duration_in_days: 7,
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
      price: 2,
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
      price: 3,
      duration_in_days: 30,
      features: JSON.stringify(['All Pro features', 'Unlimited accounts', '24/7 support', 'Custom cookie requests']),
      is_popular: false,
      is_active: true
    }
  })

  // Create service groups
  const socialMediaGroup = await prisma.serviceGroup.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Social Media',
      is_active: true
    }
  })

  const streamingGroup = await prisma.serviceGroup.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: 'Streaming',
      is_active: true
    }
  })

  // Create categories
  const socialCategory = await prisma.serviceCategory.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Social Platforms',
      description: 'Popular social media platforms',
      icon_url: null,
      group_id: 1,
      is_active: true
    }
  })

  const streamingCategory = await prisma.serviceCategory.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: 'Video Streaming',
      description: 'Premium video streaming services',
      icon_url: null,
      group_id: 2,
      is_active: true
    }
  })

  // Create services
  const netflixService = await prisma.service.upsert({
    where: { code: 'netflix' },
    update: {},
    create: {
      code: 'netflix',
      name: 'Netflix Premium',
      description: 'Access Netflix with premium account',
      category_id: 2,
      cookie_data: JSON.stringify([
        {
          name: 'NetflixId',
          value: 'sample_value',
          domain: '.netflix.com',
          path: '/',
          secure: true,
          httpOnly: false
        }
      ]),
      is_active: true,
      is_maintenance: false
    }
  })

  const instagramService = await prisma.service.upsert({
    where: { code: 'instagram' },
    update: {},
    create: {
      code: 'instagram',
      name: 'Instagram Business',
      description: 'Instagram business account access',
      category_id: 1,
      cookie_data: JSON.stringify([
        {
          name: 'sessionid',
          value: 'sample_session',
          domain: '.instagram.com',
          path: '/',
          secure: true,
          httpOnly: false
        }
      ]),
      is_active: true,
      is_maintenance: false
    }
  })

  const youtubeService = await prisma.service.upsert({
    where: { code: 'youtube' },
    update: {},
    create: {
      code: 'youtube',
      name: 'YouTube Premium',
      description: 'YouTube premium account access',
      category_id: 1,
      cookie_data: JSON.stringify([
        {
          name: 'YSC',
          value: 'sample_ysc',
          domain: '.youtube.com',
          path: '/',
          secure: true,
          httpOnly: false
        }
      ]),
      is_active: true,
      is_maintenance: false
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