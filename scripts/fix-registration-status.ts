import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixRegistrationStatuses() {
  console.log('🔧 Starting registration status fix...')

  const events = await prisma.event.findMany({
    include: {
      registrations: {
        orderBy: { createdAt: 'asc' },
        where: { status: { not: 'CANCELLED' } }
      }
    }
  })

  for (const event of events) {
    console.log(`\n📅 Checking event: ${event.title} (capacity: ${event.capacity})`)

    let confirmedSpots = 0

    for (const registration of event.registrations) {
      const shouldBeConfirmed = confirmedSpots + registration.spotsCount <= event.capacity
      const currentStatus = registration.status
      const newStatus = shouldBeConfirmed ? 'CONFIRMED' : 'WAITLIST'

      if (currentStatus !== newStatus) {
        console.log(`  ✏️  Updating registration ${registration.confirmationCode}: ${currentStatus} → ${newStatus}`)

        await prisma.registration.update({
          where: { id: registration.id },
          data: { status: newStatus }
        })
      }

      if (newStatus === 'CONFIRMED') {
        confirmedSpots += registration.spotsCount
      }
    }

    console.log(`  ✅ Event updated: ${confirmedSpots}/${event.capacity} confirmed spots`)
  }

  console.log('\n✨ Registration status fix completed!')
}

fixRegistrationStatuses()
  .catch(console.error)
  .finally(() => prisma.$disconnect())