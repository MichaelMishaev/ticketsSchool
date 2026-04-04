#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient({
  datasourceUrl: 'postgresql://tickets_user:tickets_password@localhost:6000/tickets_school'
})

async function restore() {
  const backupDir = join(process.env.HOME!, 'Desktop/Projects/ticketsSchool/backups/restore-local')

  console.log('=========================================')
  console.log('Restoring production data to local database')
  console.log('=========================================')

  try {
    // Read backup files
    const schoolsData = JSON.parse(readFileSync(join(backupDir, 'schools.json'), 'utf-8').trim())
    const adminsData = JSON.parse(readFileSync(join(backupDir, 'admins.json'), 'utf-8').trim())
    const eventsData = JSON.parse(readFileSync(join(backupDir, 'events.json'), 'utf-8').trim())
    const registrationsData = JSON.parse(readFileSync(join(backupDir, 'registrations.json'), 'utf-8').trim())

    console.log(`\nFound:`)
    console.log(`- ${schoolsData.length} schools`)
    console.log(`- ${adminsData.length} admins`)
    console.log(`- ${eventsData.length} events`)
    console.log(`- ${registrationsData.length} registrations`)

    // Restore Schools
    console.log('\nRestoring Schools...')
    for (const school of schoolsData) {
      await prisma.school.create({
        data: {
          id: school.id,
          name: school.name,
          slug: school.slug,
          logo: school.logo,
          primaryColor: school.primaryColor,
          isActive: school.isActive,
          createdAt: new Date(school.createdAt),
          updatedAt: new Date(school.updatedAt),
          plan: school.plan,
          stripeCustomerId: school.stripeCustomerId,
          stripeSubscriptionId: school.stripeSubscriptionId,
          subscriptionStatus: school.subscriptionStatus,
          trialEndsAt: school.trialEndsAt ? new Date(school.trialEndsAt) : null,
          subscriptionEndsAt: school.subscriptionEndsAt ? new Date(school.subscriptionEndsAt) : null,
        }
      })
    }

    // Restore Admins
    console.log('Restoring Admins...')
    for (const admin of adminsData) {
      await prisma.admin.create({
        data: {
          id: admin.id,
          email: admin.email,
          passwordHash: admin.passwordHash,
          name: admin.name,
          role: admin.role,
          schoolId: admin.schoolId,
          emailVerified: admin.emailVerified,
          verificationToken: admin.verificationToken,
          resetToken: admin.resetToken,
          resetTokenExpiry: admin.resetTokenExpiry ? new Date(admin.resetTokenExpiry) : null,
          googleId: admin.googleId,
          isActive: admin.isActive,
          lastLoginAt: admin.lastLoginAt ? new Date(admin.lastLoginAt) : null,
          createdAt: new Date(admin.createdAt),
          updatedAt: new Date(admin.updatedAt),
          onboardingCompleted: admin.onboardingCompleted,
        }
      })
    }

    // Restore Events
    console.log('Restoring Events...')
    for (const event of eventsData) {
      const eventDate = new Date(event.eventDate)
      if (isNaN(eventDate.getTime())) {
        console.log(`Skipping event ${event.id} - invalid date: ${event.eventDate}`)
        continue
      }

      await prisma.event.create({
        data: {
          id: event.id,
          name: event.name || 'Untitled Event',
          description: event.description,
          location: event.location,
          eventDate: eventDate,
          capacity: event.capacity,
          spotsReserved: event.spotsReserved || 0,
          schoolId: event.schoolId,
          createdAt: new Date(event.createdAt),
          updatedAt: new Date(event.updatedAt),
          deletedAt: event.deletedAt ? new Date(event.deletedAt) : null,
          eventType: event.eventType || 'CAPACITY_BASED',
          minAttendees: event.minAttendees,
          maxAttendees: event.maxAttendees,
          closedManually: event.closedManually || false,
          closedAt: event.closedAt ? new Date(event.closedAt) : null,
          cancelReason: event.cancelReason,
          status: event.status || 'OPEN',
        }
      })
    }

    // Restore Registrations
    console.log('Restoring Registrations...')
    for (const registration of registrationsData) {
      await prisma.registration.create({
        data: {
          id: registration.id,
          eventId: registration.eventId,
          parentName: registration.parentName,
          parentPhone: registration.parentPhone,
          childName: registration.childName,
          childGrade: registration.childGrade,
          status: registration.status,
          createdAt: new Date(registration.createdAt),
          updatedAt: new Date(registration.updatedAt),
          spotsCount: registration.spotsCount,
          confirmationCode: registration.confirmationCode,
          deletedAt: registration.deletedAt ? new Date(registration.deletedAt) : null,
          schoolId: registration.schoolId,
        }
      })
    }

    console.log('\n=========================================')
    console.log('✅ Restoration complete!')
    console.log('=========================================\n')

    // Show summary
    const counts = await prisma.$queryRaw<any[]>`
      SELECT
        'Events' as table_name, COUNT(*) as count FROM "Event"
      UNION ALL SELECT 'Registrations', COUNT(*) FROM "Registration"
      UNION ALL SELECT 'Schools', COUNT(*) FROM "School"
      UNION ALL SELECT 'Admins', COUNT(*) FROM "Admin"
    `
    console.table(counts)

  } catch (error) {
    console.error('❌ Restoration failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

restore()
