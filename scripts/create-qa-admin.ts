import { prisma } from '../lib/prisma'
import bcrypt from 'bcryptjs'

async function main() {
  const email = 'qa@local.dev'
  const passwordHash = await bcrypt.hash('QaLocal#2026!', 10)

  const admin = await prisma.admin.upsert({
    where: { email },
    update: { passwordHash, emailVerified: true, isActive: true, onboardingCompleted: true },
    create: {
      email,
      name: 'QA Automation',
      passwordHash,
      role: 'SUPER_ADMIN',
      schoolId: null,
      emailVerified: true,
      isActive: true,
      onboardingCompleted: true,
    },
  })

  console.log('✅ QA admin ready:', admin.email, admin.role)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
