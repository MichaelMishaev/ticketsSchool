import { PrismaClient } from '@prisma/client'
import bcryptjs from 'bcryptjs'

const prisma = new PrismaClient()

async function checkTestUser() {
  const testEmail = 'nav-test@test.com'

  const admin = await prisma.admin.findUnique({
    where: { email: testEmail },
    include: { school: true }
  })

  if (admin) {
    console.log('✅ Test user exists:')
    console.log('   Email:', admin.email)
    console.log('   School:', admin.school?.name || 'None')
    console.log('   School ID:', admin.schoolId || 'None')
  } else {
    console.log('❌ Test user not found')
    console.log('\nCreating test user...')

    const hashedPassword = await bcryptjs.hash('TestPassword123!', 10)

    const school = await prisma.school.create({
      data: {
        name: 'Navigation Test School',
        slug: 'nav-test-school-' + Date.now(),
        plan: 'FREE'
      }
    })

    const newAdmin = await prisma.admin.create({
      data: {
        email: testEmail,
        passwordHash: hashedPassword,
        name: 'Navigation Test User',
        schoolId: school.id,
        emailVerified: true,
        onboardingCompleted: true,
        role: 'ADMIN'
      }
    })

    console.log('✅ Test user created successfully!')
    console.log('   Email:', testEmail)
    console.log('   Password: TestPassword123!')
    console.log('   School:', school.name)
  }

  await prisma.$disconnect()
}

checkTestUser().catch(console.error)
