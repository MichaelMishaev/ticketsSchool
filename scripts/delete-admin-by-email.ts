import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function deleteAdminByEmail(email: string) {
  try {
    console.log(`🔍 Looking for admin with email: ${email}`)

    // Find the admin first
    const admin = await prisma.admin.findUnique({
      where: { email },
      include: {
        school: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    })

    if (!admin) {
      console.log(`❌ No admin found with email: ${email}`)
      return
    }

    console.log(`\n📋 Admin Details:`)
    console.log(`   ID: ${admin.id}`)
    console.log(`   Name: ${admin.name}`)
    console.log(`   Email: ${admin.email}`)
    console.log(`   Role: ${admin.role}`)
    console.log(`   School: ${admin.school?.name || 'None'}`)
    console.log(`   Created: ${admin.createdAt}`)

    // Delete the admin
    await prisma.admin.delete({
      where: { email }
    })

    console.log(`\n✅ Successfully deleted admin: ${email}`)
  } catch (error) {
    console.error('❌ Error deleting admin:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
const emailToDelete = process.argv[2] || 'yossibend55@gmail.com'

deleteAdminByEmail(emailToDelete)
  .then(() => {
    console.log('\n✨ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error)
    process.exit(1)
  })
