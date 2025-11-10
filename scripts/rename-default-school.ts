import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function renameDefaultSchool() {
  try {
    // Find the Default School
    const defaultSchool = await prisma.school.findFirst({
      where: {
        OR: [
          { name: 'Default School' },
          { slug: 'default-school' }
        ]
      }
    })

    if (!defaultSchool) {
      console.log('❌ Default School not found')
      await prisma.$disconnect()
      return
    }

    console.log('\n📋 Current School:')
    console.log(`  Name: ${defaultSchool.name}`)
    console.log(`  Slug: ${defaultSchool.slug}`)
    console.log(`  ID: ${defaultSchool.id}`)

    // Update the school name to בארי
    const updatedSchool = await prisma.school.update({
      where: { id: defaultSchool.id },
      data: {
        name: 'בארי'
      }
    })

    console.log('\n✅ School renamed successfully!')
    console.log(`  New Name: ${updatedSchool.name}`)
    console.log(`  Slug: ${updatedSchool.slug} (unchanged)`)

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

renameDefaultSchool()
