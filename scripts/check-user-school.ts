import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkUser() {
  const email = process.argv[2] || '345287@gmail.com'

  const admin = await prisma.admin.findUnique({
    where: { email },
    include: { school: true }
  })

  if (!admin) {
    console.log('❌ Admin not found')
    await prisma.$disconnect()
    return
  }

  console.log('\n📋 Admin Details:\n')
  console.log(`Email: ${admin.email}`)
  console.log(`Name: ${admin.name}`)
  console.log(`Role: ${admin.role}`)
  console.log(`School ID: ${admin.schoolId}`)
  console.log(`School Name: ${admin.school?.name || 'None'}`)
  console.log(`Onboarding Completed: ${admin.onboardingCompleted}`)

  // Check events for both schools
  const defaultEvents = await prisma.event.count({
    where: { schoolId: 'default-school-id' }
  })

  const beeriEvents = await prisma.event.count({
    where: { schoolId: 'cmhsz4h4h0000ou01k7nr7lvn' }
  })

  console.log(`\n📅 Event Counts:`)
  console.log(`  Default School: ${defaultEvents} events`)
  console.log(`  בארי School: ${beeriEvents} events`)

  await prisma.$disconnect()
}

checkUser()
