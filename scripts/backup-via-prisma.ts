#!/usr/bin/env tsx

/**
 * Backup QA database using Prisma
 * This works through Railway's internal network
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function backup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + new Date().toISOString().split('T')[1].split('.')[0].replace(/:/g, '')
  const backupDir = path.join(process.cwd(), 'backups', 'qa')

  // Create backup directory
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }

  const backupFile = path.join(backupDir, `backup_${timestamp}.json`)

  console.log('🗄️  Prisma Database Backup')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')
  console.log(`📁 Backup directory: ${backupDir}`)
  console.log(`🕒 Timestamp: ${timestamp}`)
  console.log('')

  try {
    console.log('📦 Fetching all data...')

    // Fetch all data from database
    const [schools, admins, events, registrations, teamInvitations, usageRecords, feedback] = await Promise.all([
      prisma.school.findMany({ include: { events: false, admins: false } }),
      prisma.admin.findMany(),
      prisma.event.findMany(),
      prisma.registration.findMany(),
      prisma.teamInvitation.findMany(),
      prisma.usageRecord.findMany(),
      prisma.feedback.findMany(),
    ])

    const backup = {
      timestamp: new Date().toISOString(),
      database: 'QA (postgres-copy)',
      stats: {
        schools: schools.length,
        admins: admins.length,
        events: events.length,
        registrations: registrations.length,
        teamInvitations: teamInvitations.length,
        usageRecords: usageRecords.length,
        feedback: feedback.length,
      },
      data: {
        schools,
        admins,
        events,
        registrations,
        teamInvitations,
        usageRecords,
        feedback,
      },
    }

    console.log('  ✅ Data fetched')
    console.log('')
    console.log('📊 Database statistics:')
    console.log(`  Schools: ${schools.length}`)
    console.log(`  Admins: ${admins.length}`)
    console.log(`  Events: ${events.length}`)
    console.log(`  Registrations: ${registrations.length}`)
    console.log(`  Team Invitations: ${teamInvitations.length}`)
    console.log(`  Usage Records: ${usageRecords.length}`)
    console.log(`  Feedback: ${feedback.length}`)
    console.log('')

    // Write backup file
    console.log('💾 Writing backup file...')
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2))
    console.log(`  ✅ Backup saved: ${backupFile}`)

    // Create README
    const readmeFile = path.join(backupDir, `backup_${timestamp}_README.md`)
    const readme = `# QA Database Backup (Prisma)

**Backup Date:** ${new Date().toISOString()}
**Database:** QA (postgres-copy)
**Method:** Prisma Client

## Files

- \`backup_${timestamp}.json\` (${(fs.statSync(backupFile).size / 1024).toFixed(2)} KB)

## Statistics

\`\`\`
Schools: ${schools.length}
Admins: ${admins.length}
Events: ${events.length}
Registrations: ${registrations.length}
Team Invitations: ${teamInvitations.length}
Usage Records: ${usageRecords.length}
Feedback: ${feedback.length}
\`\`\`

## Restore

This is a JSON backup. To restore:

1. Parse the JSON file
2. Use Prisma to insert data back into database
3. Or use the restore script:

\`\`\`bash
railway run tsx scripts/restore-via-prisma.ts backup_${timestamp}.json
\`\`\`

## Note

This backup includes all data but NOT the database schema.
To backup schema, use: \`npx prisma db pull\`

Backup created by: Prisma Backup Script
`
    fs.writeFileSync(readmeFile, readme)
    console.log(`  ✅ README saved: ${readmeFile}`)
    console.log('')

    const fileSize = (fs.statSync(backupFile).size / 1024).toFixed(2)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ Backup completed successfully!')
    console.log('')
    console.log(`📦 File: backup_${timestamp}.json (${fileSize} KB)`)
    console.log(`📁 Location: ${backupDir}/`)
    console.log('')
    console.log('✨ Done!')

  } catch (error) {
    console.error('❌ Backup failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

backup()
