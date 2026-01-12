#!/usr/bin/env tsx
/**
 * Backup Production Database
 *
 * Creates a JSON export of critical production data
 * Run with: railway run npx tsx scripts/backup-production.ts
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function backupProduction() {
  try {
    console.log('🔄 Starting production database backup...')

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupDir = path.join(process.cwd(), 'backups')

    // Ensure backups directory exists
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }

    // Fetch all data
    console.log('📊 Fetching data from all tables...')

    const [schools, admins, events, registrations, tables, teamInvitations, usageRecords, feedback, tableTemplates, logs] = await Promise.all([
      prisma.school.findMany(),
      prisma.admin.findMany(),
      prisma.event.findMany(),
      prisma.registration.findMany(),
      prisma.table.findMany(),
      prisma.teamInvitation.findMany(),
      prisma.usageRecord.findMany(),
      prisma.feedback.findMany(),
      prisma.tableTemplate.findMany(),
      prisma.log.findMany()
    ])

    const backup = {
      timestamp: new Date().toISOString(),
      counts: {
        schools: schools.length,
        admins: admins.length,
        events: events.length,
        registrations: registrations.length,
        tables: tables.length,
        teamInvitations: teamInvitations.length,
        usageRecords: usageRecords.length,
        feedback: feedback.length,
        tableTemplates: tableTemplates.length,
        logs: logs.length
      },
      data: {
        schools,
        admins,
        events,
        registrations,
        tables,
        teamInvitations,
        usageRecords,
        feedback,
        tableTemplates,
        logs
      }
    }

    const filename = `prod_backup_${timestamp}.json`
    const filepath = path.join(backupDir, filename)

    fs.writeFileSync(filepath, JSON.stringify(backup, null, 2))

    console.log('\n✅ Backup completed successfully!')
    console.log(`📁 File: ${filepath}`)
    console.log(`📊 Summary:`)
    console.log(`   - Schools: ${backup.counts.schools}`)
    console.log(`   - Admins: ${backup.counts.admins}`)
    console.log(`   - Events: ${backup.counts.events}`)
    console.log(`   - Registrations: ${backup.counts.registrations}`)
    console.log(`   - Tables: ${backup.counts.tables}`)
    console.log(`   - Table Templates: ${backup.counts.tableTemplates}`)
    console.log(`   - Team Invitations: ${backup.counts.teamInvitations}`)
    console.log(`   - Usage Records: ${backup.counts.usageRecords}`)
    console.log(`   - Logs: ${backup.counts.logs}`)
    console.log(`   - Feedback: ${backup.counts.feedback}`)

    const sizeInMB = (fs.statSync(filepath).size / (1024 * 1024)).toFixed(2)
    console.log(`   - Backup size: ${sizeInMB} MB`)

  } catch (error) {
    console.error('❌ Backup failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

backupProduction()
