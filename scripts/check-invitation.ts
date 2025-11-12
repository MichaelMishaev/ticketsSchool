import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkInvitation() {
  const email = '345287info@gmail.com'

  console.log('\n=== Checking Invitation Status ===\n')

  // Check if admin exists
  const admin = await prisma.admin.findUnique({
    where: { email: email.toLowerCase() }
  })

  if (admin) {
    console.log('✓ Admin EXISTS:')
    console.log({
      id: admin.adminId,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      schoolId: admin.schoolId,
      createdAt: admin.createdAt
    })
  } else {
    console.log('✗ Admin does NOT exist')
  }

  console.log('\n')

  // Check invitations
  const invitations = await prisma.teamInvitation.findMany({
    where: { email: email.toLowerCase() },
    include: {
      school: { select: { name: true } }
    },
    orderBy: { createdAt: 'desc' }
  })

  if (invitations.length > 0) {
    console.log(`✓ Found ${invitations.length} invitation(s):`)
    invitations.forEach((inv, idx) => {
      console.log(`\n  Invitation ${idx + 1}:`)
      console.log({
        id: inv.id,
        status: inv.status,
        role: inv.role,
        school: inv.school.name,
        createdAt: inv.createdAt,
        expiresAt: inv.expiresAt
      })
    })
  } else {
    console.log('✗ No invitations found')
  }

  await prisma.$disconnect()
}

checkInvitation().catch(console.error)
