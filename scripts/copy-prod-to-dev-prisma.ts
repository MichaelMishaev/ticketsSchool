import { PrismaClient } from '@prisma/client'

const prodDb = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:fnkujYsPXAdmDWAbCxFTeQLtARLIDtZt@crossover.proxy.rlwy.net:41359/railway'
    }
  }
})

async function getDevDbUrl() {
  const { execSync } = await import('child_process')
  const output = execSync(
    'railway variables --json --environment development --service ticketsSchool',
    { encoding: 'utf-8' }
  )
  const data = JSON.parse(output)
  return data.DATABASE_URL
}

async function main() {
  console.log('🚀 Copying production data to development...\n')

  const devDbUrl = await getDevDbUrl()
  const devDb = new PrismaClient({
    datasources: { db: { url: devDbUrl } }
  })

  try {
    // Get data from production
    console.log('📥 Fetching production data...')
    const [schools, admins, events, tables, registrations] = await Promise.all([
      prodDb.school.findMany(),
      prodDb.admin.findMany(),
      prodDb.event.findMany(),
      prodDb.table.findMany(),
      prodDb.registration.findMany()
    ])

    console.log(`  Schools: ${schools.length}`)
    console.log(`  Admins: ${admins.length}`)
    console.log(`  Events: ${events.length}`)
    console.log(`  Tables: ${tables.length}`)
    console.log(`  Registrations: ${registrations.length}\n`)

    // Clear development database
    console.log('🗑️  Clearing development database...')
    await devDb.$executeRaw`TRUNCATE TABLE "Registration", "Table", "TableTemplate", "Event", "TeamInvitation", "UsageRecord", "OAuthState", "Feedback", "Log", "Admin", "School" CASCADE;`
    console.log('✅ Cleared\n')

    // Import to development
    console.log('📤 Importing to development...')
    
    console.log('  → Schools...')
    await devDb.school.createMany({ data: schools, skipDuplicates: true })
    
    console.log('  → Admins...')
    await devDb.admin.createMany({ data: admins, skipDuplicates: true })
    
    console.log('  → Events...')
    await devDb.event.createMany({ data: events, skipDuplicates: true })
    
    console.log('  → Tables...')
    await devDb.table.createMany({ data: tables, skipDuplicates: true })
    
    console.log('  → Registrations...')
    await devDb.registration.createMany({ data: registrations, skipDuplicates: true })

    // Verify
    console.log('\n🔍 Verifying import...')
    const [schoolCount, adminCount, eventCount] = await Promise.all([
      devDb.school.count(),
      devDb.admin.count(),
      devDb.event.count()
    ])

    console.log(`  Schools: ${schoolCount}`)
    console.log(`  Admins: ${adminCount}`)
    console.log(`  Events: ${eventCount}`)

    console.log('\n✅ Data copy completed successfully!')
    console.log('\n🎉 You can now access development at: https://dev.kartis.info')
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prodDb.$disconnect()
    await devDb.$disconnect()
  }
}

main()
