/**
 * List all admins in the database
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function listAdmins() {
  try {
    const admins = await prisma.admin.findMany({
      include: { school: true }
    })

    console.log(`\n📋 Found ${admins.length} admin(s):\n`)

    for (const admin of admins) {
      console.log(`───────────────────────────────────────`)
      console.log(`Email: ${admin.email}`)
      console.log(`Name: ${admin.name}`)
      console.log(`Google ID: ${admin.googleId || 'None'}`)
      console.log(`School: ${admin.school?.name || 'None'}`)
      console.log(`School ID: ${admin.schoolId || 'None'}`)
      console.log(`Onboarding: ${admin.onboardingCompleted}`)
      console.log(`Email Verified: ${admin.emailVerified}`)
      console.log(`Role: ${admin.role}`)
    }

    console.log(`───────────────────────────────────────\n`)

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

listAdmins()
