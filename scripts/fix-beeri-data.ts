import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Fixing Beeri school data...')

  // Find or create Beeri school
  let beeriSchool = await prisma.school.findUnique({
    where: { slug: 'beeri' }
  })

  if (!beeriSchool) {
    console.log('📝 Creating Beeri school...')
    beeriSchool = await prisma.school.create({
      data: {
        name: 'בארי',
        slug: 'beeri',
        plan: 'FREE',
        subscriptionStatus: 'ACTIVE'
      }
    })
    console.log('✅ Beeri school created:', beeriSchool.id)
  } else {
    console.log('✅ Beeri school found:', beeriSchool.id)
  }

  // Get all events
  const allEvents = await prisma.event.findMany({
    select: {
      id: true,
      title: true,
      schoolId: true
    }
  })

  console.log(`📊 Found ${allEvents.length} total events`)

  // Find events not belonging to Beeri or belonging to default school
  const eventsToReassign = allEvents.filter(e =>
    e.schoolId !== beeriSchool.id &&
    (e.schoolId === 'default-school-id' || !e.schoolId.startsWith('cmh'))
  )

  console.log(`📊 Found ${eventsToReassign.length} events to assign to Beeri`)

  if (eventsToReassign.length > 0) {
    for (const event of eventsToReassign) {
      await prisma.event.update({
        where: { id: event.id },
        data: { schoolId: beeriSchool.id }
      })
      console.log(`   ✓ Assigned "${event.title}" to Beeri`)
    }
    console.log(`✅ Assigned ${eventsToReassign.length} events to Beeri school`)
  }

  // Find admin@beeri.com and make them SUPER_ADMIN of Beeri school
  const beeriAdmin = await prisma.admin.findUnique({
    where: { email: 'admin@beeri.com' }
  })

  if (beeriAdmin) {
    if (beeriAdmin.role !== 'SUPER_ADMIN' || beeriAdmin.schoolId !== beeriSchool.id) {
      await prisma.admin.update({
        where: { id: beeriAdmin.id },
        data: {
          role: 'SUPER_ADMIN',
          schoolId: beeriSchool.id
        }
      })
      console.log('✅ Updated admin@beeri.com to SUPER_ADMIN of Beeri school')
    } else {
      console.log('✅ admin@beeri.com is already SUPER_ADMIN')
    }
  }

  // Summary
  const schools = await prisma.school.findMany()
  const admins = await prisma.admin.findMany()
  const events = await prisma.event.findMany()

  console.log('\n📊 Database Summary:')
  console.log(`   Schools: ${schools.length}`)
  console.log(`   Admins: ${admins.length}`)
  console.log(`   Events: ${events.length}`)
  console.log('\n🏫 Schools:')
  for (const school of schools) {
    const eventCount = await prisma.event.count({ where: { schoolId: school.id } })
    const adminCount = await prisma.admin.count({ where: { schoolId: school.id } })
    console.log(`   - ${school.name} (${school.slug}): ${eventCount} events, ${adminCount} admins`)
  }

  console.log('\n✅ Data migration complete!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
