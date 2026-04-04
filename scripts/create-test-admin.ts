import { prisma } from '../lib/prisma'
import bcrypt from 'bcryptjs'

async function main() {
  // Find the "tests" school
  const school = await prisma.school.findUnique({
    where: { slug: 'tests' }
  })

  if (!school) {
    console.error('School "tests" not found')
    process.exit(1)
  }

  // Check if test admin already exists
  const existing = await prisma.admin.findUnique({
    where: { email: 'testadmin@test.com' }
  })

  if (existing) {
    console.log('✅ Test admin already exists: testadmin@test.com')
    console.log('Password: Test123!')
    console.log('School:', school.name)
    return
  }

  // Create test admin
  const hashedPassword = await bcrypt.hash('Test123!', 10)

  const admin = await prisma.admin.create({
    data: {
      email: 'testadmin@test.com',
      passwordHash: hashedPassword,
      name: 'Test Admin',
      role: 'ADMIN',
      emailVerified: true,
      school: {
        connect: { id: school.id }
      },
      onboardingCompleted: true
    }
  })

  console.log('✅ Created test admin successfully!')
  console.log('Email: testadmin@test.com')
  console.log('Password: Test123!')
  console.log('School:', school.name)
  console.log('School ID:', school.id)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
