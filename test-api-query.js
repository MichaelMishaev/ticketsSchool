const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasourceUrl: 'postgresql://tickets_user:tickets_password@localhost:6000/tickets_school'
})

async function test() {
  try {
    console.log('Testing database queries...\n')

    // Test 1: Count all events
    const totalEvents = await prisma.event.count()
    console.log(`✓ Total events in database: ${totalEvents}`)

    // Test 2: Count events for default-school-id
    const schoolEvents = await prisma.event.count({
      where: { schoolId: 'default-school-id' }
    })
    console.log(`✓ Events for default-school-id: ${schoolEvents}`)

    // Test 3: Get events with school relationship
    const events = await prisma.event.findMany({
      where: { schoolId: 'default-school-id' },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    })

    console.log(`\n✓ Events fetched successfully:`)
    events.forEach(event => {
      console.log(`  - ${event.title} (${event.status}) - ${event.school?.name || 'No school'}`)
    })

    // Test 4: Check admin
    const admin = await prisma.admin.findUnique({
      where: { email: '345287@gmail.com' },
      include: {
        school: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    console.log(`\n✓ Admin found:`)
    console.log(`  - Email: ${admin.email}`)
    console.log(`  - School: ${admin.school?.name} (${admin.schoolId})`)
    console.log(`  - Onboarding completed: ${admin.onboardingCompleted}`)

    console.log('\n✅ All tests passed! Data is accessible.')

  } catch (error) {
    console.error('❌ Error:', error.message)
    if (error.code) console.error('Error code:', error.code)
  } finally {
    await prisma.$disconnect()
  }
}

test()
