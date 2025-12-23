/**
 * Create Canary Admin Account
 *
 * Creates the dedicated canary admin account in production database
 * for automated health monitoring via Golden Path Canary workflow.
 *
 * Usage:
 *   railway run tsx scripts/create-canary-admin.ts
 *
 * Canary Account Details:
 *   - Email: 345287info@gmail.com
 *   - School: testcanary
 *   - Role: SUPER_ADMIN (for maximum canary coverage)
 */

import { prisma } from '../lib/prisma'
import * as bcrypt from 'bcryptjs'

const CANARY_EMAIL = '345287info@gmail.com'
const CANARY_PASSWORD = 'Jtbdtjtb6262'
const CANARY_SCHOOL_NAME = 'Test Canary'
const CANARY_SCHOOL_SLUG = 'testcanary'

async function main() {
  console.log('🐤 Creating Canary Admin Account...\n')

  // Check if canary admin already exists
  const existingAdmin = await prisma.admin.findUnique({
    where: { email: CANARY_EMAIL },
    include: { school: true }
  })

  if (existingAdmin) {
    console.log('✅ Canary admin already exists!')
    console.log('   Email:', existingAdmin.email)
    console.log('   Name:', existingAdmin.name)
    console.log('   Role:', existingAdmin.role)
    console.log('   School:', existingAdmin.school?.name || 'None')
    console.log('   Email Verified:', existingAdmin.emailVerified)

    // Update password if needed (in case it changed)
    const passwordHash = await bcrypt.hash(CANARY_PASSWORD, 10)
    await prisma.admin.update({
      where: { id: existingAdmin.id },
      data: { passwordHash }
    })
    console.log('\n✅ Password updated to match secrets')

    return
  }

  // Create canary school first
  let canarySchool = await prisma.school.findUnique({
    where: { slug: CANARY_SCHOOL_SLUG }
  })

  if (!canarySchool) {
    console.log('📚 Creating canary school...')
    canarySchool = await prisma.school.create({
      data: {
        name: CANARY_SCHOOL_NAME,
        slug: CANARY_SCHOOL_SLUG,
        plan: 'PRO' // Give PRO plan for full feature testing
      }
    })
    console.log('   ✅ School created:', canarySchool.name)
  } else {
    console.log('📚 Using existing canary school:', canarySchool.name)
  }

  // Hash password
  console.log('🔐 Hashing password...')
  const passwordHash = await bcrypt.hash(CANARY_PASSWORD, 10)

  // Create canary admin
  console.log('👤 Creating canary admin...')
  const canaryAdmin = await prisma.admin.create({
    data: {
      email: CANARY_EMAIL,
      name: 'Canary Monitor',
      passwordHash,
      role: 'SUPER_ADMIN', // SUPER_ADMIN for maximum test coverage
      schoolId: canarySchool.id,
      emailVerified: true // Auto-verify for testing
    }
  })

  console.log('\n✅ CANARY ADMIN CREATED SUCCESSFULLY!\n')
  console.log('📧 Email:', canaryAdmin.email)
  console.log('👤 Name:', canaryAdmin.name)
  console.log('🎭 Role:', canaryAdmin.role)
  console.log('🏫 School:', canarySchool.name)
  console.log('🔗 School Slug:', canarySchool.slug)
  console.log('✉️  Email Verified:', canaryAdmin.emailVerified)
  console.log('\n🧪 Test login at: https://kartis.info/admin/login')
  console.log('   Email:', CANARY_EMAIL)
  console.log('   Password: ********** (from GitHub secrets)')
}

main()
  .catch((error) => {
    console.error('❌ Error creating canary admin:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
