import { PrismaClient } from '@prisma/client'

// Local database
const localDb = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://tickets_user:tickets_password@localhost:6000/tickets_school?schema=public'
    }
  }
})

// Get dev DB URL from Railway
async function getDevUrl() {
  const { execSync } = await import('child_process')
  const result = execSync(
    'railway variables --json --environment development --service ticketsSchool',
    { encoding: 'utf-8' }
  )
  return JSON.parse(result).DATABASE_URL
}

async function main() {
  console.log('🚀 Copying local database to development...\n')
  
  const devUrl = await getDevUrl()
  const devDb = new PrismaClient({
    datasources: { db: { url: devUrl } }
  })

  try {
    // Fetch from local
    console.log('📥 Fetching from local database...')
    const [schools, admins, events, tables, registrations, teamInvites, usage] = await Promise.all([
      localDb.school.findMany(),
      localDb.admin.findMany(),
      localDb.event.findMany(),
      localDb.table.findMany(),
      localDb.registration.findMany(),
      localDb.teamInvitation.findMany(),
      localDb.usageRecord.findMany()
    ])

    console.log(`  Schools: ${schools.length}`)
    console.log(`  Admins: ${admins.length}`)
    console.log(`  Events: ${events.length}`)
    console.log(`  Tables: ${tables.length}`)
    console.log(`  Registrations: ${registrations.length}\n`)

    // Clear development
    console.log('🗑️  Clearing development database...')
    await devDb.$executeRaw`TRUNCATE TABLE "Registration", "Table", "TableTemplate", "Event", "TeamInvitation", "UsageRecord", "OAuthState", "Feedback", "Log", "Admin", "School" CASCADE;`
    console.log('✅ Cleared\n')

    // Import to development
    console.log('📤 Importing to development...')
    
    await devDb.school.createMany({ data: schools })
    console.log(`  ✅ Schools: ${schools.length}`)
    
    await devDb.admin.createMany({ data: admins })
    console.log(`  ✅ Admins: ${admins.length}`)
    
    await devDb.event.createMany({ data: events })
    console.log(`  ✅ Events: ${events.length}`)
    
    await devDb.table.createMany({ data: tables })
    console.log(`  ✅ Tables: ${tables.length}`)
    
    await devDb.registration.createMany({ data: registrations })
    console.log(`  ✅ Registrations: ${registrations.length}`)
    
    if (teamInvites.length > 0) {
      await devDb.teamInvitation.createMany({ data: teamInvites })
      console.log(`  ✅ TeamInvitations: ${teamInvites.length}`)
    }
    
    if (usage.length > 0) {
      await devDb.usageRecord.createMany({ data: usage })
      console.log(`  ✅ UsageRecords: ${usage.length}`)
    }

    console.log('\n✅ Copy completed successfully!')
    console.log('🎉 You can now access development at: https://dev.kartis.info')
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await localDb.$disconnect()
    await devDb.$disconnect()
  }
}

main()
