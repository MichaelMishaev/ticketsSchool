import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanup() {
  const email = '345287info@gmail.com'

  console.log('\n=== Cleaning Up Test Data ===\n')

  // Delete revoked/expired invitations for this email
  const deleted = await prisma.teamInvitation.deleteMany({
    where: {
      email: email.toLowerCase(),
      status: {
        in: ['REVOKED', 'EXPIRED']
      }
    }
  })

  console.log(`✓ Deleted ${deleted.count} revoked/expired invitation(s) for ${email}`)

  await prisma.$disconnect()
}

cleanup().catch(console.error)
