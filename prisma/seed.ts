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
  });

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
  });

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
  });


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