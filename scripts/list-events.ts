import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function listEvents() {
  const events = await prisma.event.findMany({
    select: {
      id: true,
      title: true,
      schoolId: true,
      school: { select: { name: true, slug: true } },
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  })

  console.log(`\n📅 All Events (${events.length} total):\n`)

  events.forEach(e => {
    console.log(`"${e.title}"`)
    console.log(`  School: ${e.school.name} (slug: ${e.school.slug})`)
    console.log(`  School ID: ${e.schoolId}`)
    console.log(`  Created: ${e.createdAt.toLocaleString()}`)
    console.log(`───────────────────────────────────────`)
  })

  await prisma.$disconnect()
}

listEvents()
