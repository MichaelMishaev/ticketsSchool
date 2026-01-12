/**
 * Debug: Show what schoolId is in the admin's JWT session vs database
 */

import { PrismaClient } from '@prisma/client'
import * as jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

async function debugSession() {
  const email = process.argv[2]

  if (!email) {
    console.log('Usage: npx tsx scripts/debug-session.ts <email>')
    process.exit(1)
  }

  // Check database
  const admin = await prisma.admin.findUnique({
    where: { email },
    include: { school: true }
  })

  if (!admin) {
    console.log('❌ Admin not found in database')
    await prisma.$disconnect()
    return
  }

  console.log('\n📋 Database Record:')
  console.log(`  Email: ${admin.email}`)
  console.log(`  School ID: ${admin.schoolId}`)
  console.log(`  School Name: ${admin.school?.name || 'None'}`)
  console.log(`  Role: ${admin.role}`)

  console.log('\n💡 To fix session mismatch:')
  console.log('  1. Logout and login again')
  console.log('  2. Or update the schoolId in database to match what you want')

  await prisma.$disconnect()
}

debugSession()
