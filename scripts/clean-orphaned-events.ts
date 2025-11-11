import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanOrphanedEvents() {
  try {
    console.log('🔍 Looking for orphaned events (events without valid schools)...\n')

    // Find events with null school relationship
    const orphanedEvents = await prisma.event.findMany({
      where: {
        school: null
      },
      select: {
        id: true,
        slug: true,
        title: true,
        schoolId: true,
        createdAt: true,
        _count: {
          select: {
            registrations: true
          }
        }
      }
    })

    if (orphanedEvents.length === 0) {
      console.log('✅ No orphaned events found. Database is clean!')
      return
    }

    console.log(`⚠️  Found ${orphanedEvents.length} orphaned events:\n`)

    orphanedEvents.forEach((event, index) => {
      console.log(`${index + 1}. Event: "${event.title}"`)
      console.log(`   ID: ${event.id}`)
      console.log(`   Slug: ${event.slug}`)
      console.log(`   School ID: ${event.schoolId} (INVALID - school deleted)`)
      console.log(`   Registrations: ${event._count.registrations}`)
      console.log(`   Created: ${event.createdAt}`)
      console.log('')
    })

    // Count total registrations that will be deleted
    const totalRegistrations = orphanedEvents.reduce(
      (sum, event) => sum + event._count.registrations,
      0
    )

    console.log(`⚠️  WARNING: This will delete ${orphanedEvents.length} events and ${totalRegistrations} associated registrations`)
    console.log('   These events belong to schools that no longer exist.')
    console.log('')

    // Delete orphaned events (cascade will delete registrations)
    const result = await prisma.event.deleteMany({
      where: {
        school: null
      }
    })

    console.log(`✅ Successfully deleted ${result.count} orphaned events`)
    console.log('   Associated registrations were also deleted (cascade)')

  } catch (error) {
    console.error('❌ Error cleaning orphaned events:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
cleanOrphanedEvents()
  .then(() => {
    console.log('\n✨ Cleanup completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Cleanup failed:', error)
    process.exit(1)
  })
