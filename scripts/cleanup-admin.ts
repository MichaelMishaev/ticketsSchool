/**
 * Cleanup Script: Delete admin by Google ID and reset for fresh onboarding
 *
 * Usage:
 *   npx tsx scripts/cleanup-admin.ts <googleId>
 *
 * Example:
 *   npx tsx scripts/cleanup-admin.ts 110955798718535241874
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanupAdmin(googleId: string) {
  try {
    console.log(`\n🔍 Looking for admin with Google ID: ${googleId}`)

    // Find admin
    const admin = await prisma.admin.findUnique({
      where: { googleId },
      include: { school: true }
    })

    if (!admin) {
      console.log('❌ Admin not found')
      return
    }

    console.log(`\n📋 Found admin:`)
    console.log(`   - Email: ${admin.email}`)
    console.log(`   - Name: ${admin.name}`)
    console.log(`   - School: ${admin.school?.name || 'None'}`)
    console.log(`   - Onboarding Completed: ${admin.onboardingCompleted}`)

    // Delete admin
    console.log(`\n🗑️  Deleting admin...`)
    await prisma.admin.delete({
      where: { id: admin.id }
    })

    console.log(`✅ Admin deleted successfully!`)
    console.log(`\n💡 You can now login with Google and go through onboarding again.`)

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Get googleId from command line
const googleId = process.argv[2]

if (!googleId) {
  console.error('❌ Usage: npx tsx scripts/cleanup-admin.ts <googleId>')
  console.error('Example: npx tsx scripts/cleanup-admin.ts 110955798718535241874')
  process.exit(1)
}

cleanupAdmin(googleId)
