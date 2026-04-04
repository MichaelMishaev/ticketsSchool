const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

const client = new Client({
  host: 'localhost',
  port: 6000,
  user: 'tickets_user',
  password: 'tickets_password',
  database: 'tickets_school'
})

async function restore() {
  await client.connect()

  try {
    const backupDir = path.join(process.env.HOME, 'Desktop/Projects/ticketsSchool/backups/restore-local')

    console.log('========================================')
    console.log('Restoring production data to local database')
    console.log('========================================\n')

    // Read files
    const schools = JSON.parse(fs.readFileSync(path.join(backupDir, 'schools.json'), 'utf8').trim())
    const admins = JSON.parse(fs.readFileSync(path.join(backupDir, 'admins.json'), 'utf8').trim())
    const events = JSON.parse(fs.readFileSync(path.join(backupDir, 'events.json'), 'utf8').trim())
    const registrations = JSON.parse(fs.readFileSync(path.join(backupDir, 'registrations.json'), 'utf8').trim())

    console.log(`Found:`)
    console.log(`- ${schools.length} schools`)
    console.log(`- ${admins.length} admins`)
    console.log(`- ${events.length} events`)
    console.log(`- ${registrations.length} registrations\n`)

    // Restore Schools
    console.log('Restoring Schools...')
    for (const school of schools) {
      await client.query(`
        INSERT INTO "School" (id, name, slug, logo, "primaryColor", "isActive", "createdAt", "updatedAt", plan, "stripeCustomerId", "stripeSubscriptionId", "subscriptionStatus", "trialEndsAt", "subscriptionEndsAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::text::"SubscriptionPlan", $10, $11, $12::text::"SubscriptionStatus", $13, $14)
      `, [
        school.id,
        school.name,
        school.slug,
        school.logo,
        school.primaryColor || '#3b82f6',
        school.isActive ?? true,
        school.createdAt,
        school.updatedAt,
        school.plan || 'FREE',
        school.stripeCustomerId,
        school.stripeSubscriptionId,
        school.subscriptionStatus || 'TRIAL',
        school.trialEndsAt,
        school.subscriptionEndsAt
      ])
    }

    // Restore Admins
    console.log('Restoring Admins...')
    for (const admin of admins) {
      await client.query(`
        INSERT INTO "Admin" (id, email, "passwordHash", name, role, "schoolId", "emailVerified", "verificationToken", "resetToken", "resetTokenExpiry", "googleId", "isActive", "lastLoginAt", "createdAt", "updatedAt", "onboardingCompleted")
        VALUES ($1, $2, $3, $4, $5::text::"AdminRole", $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      `, [
        admin.id,
        admin.email,
        admin.passwordHash,
        admin.name,
        admin.role,
        admin.schoolId,
        admin.emailVerified ?? false,
        admin.verificationToken,
        admin.resetToken,
        admin.resetTokenExpiry,
        admin.googleId,
        admin.isActive ?? true,
        admin.lastLoginAt,
        admin.createdAt,
        admin.updatedAt,
        admin.onboardingCompleted ?? false
      ])
    }

    // Restore Events
    console.log('Restoring Events...')
    for (const event of events) {
      await client.query(`
        INSERT INTO "Event" (
          id, slug, "schoolId", title, description, "gameType", location,
          "startAt", "endAt", capacity, "spotsReserved", status, "maxSpotsPerPerson",
          "fieldsSchema", conditions, "requireAcceptance", "completionMessage",
          "eventType", "allowCancellation", "cancellationDeadlineHours",
          "requireCancellationReason", "createdAt", "updatedAt"
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::text::"EventStatus", $13,
          $14::jsonb, $15, $16, $17, $18::text::"EventType", $19, $20, $21, $22, $23
        )
      `, [
        event.id,
        event.slug,
        event.schoolId,
        event.title,
        event.description,
        event.gameType,
        event.location,
        event.startAt,
        event.endAt,
        event.capacity,
        event.spotsReserved || 0,
        event.status || 'OPEN',
        event.maxSpotsPerPerson || 1,
        JSON.stringify(event.fieldsSchema || []),
        event.conditions,
        event.requireAcceptance ?? false,
        event.completionMessage,
        event.eventType || 'CAPACITY_BASED',
        event.allowCancellation ?? true,
        event.cancellationDeadlineHours || 2,
        event.requireCancellationReason ?? false,
        event.createdAt,
        event.updatedAt
      ])
    }

    // Restore Registrations
    console.log('Restoring Registrations...')
    for (const registration of registrations) {
      await client.query(`
        INSERT INTO "Registration" (
          id, "eventId", "schoolId", data, "spotsCount", status,
          "confirmationCode", "phoneNumber", email, "createdAt", "updatedAt"
        )
        VALUES ($1, $2, $3, $4::jsonb, $5, $6::text::"RegistrationStatus", $7, $8, $9, $10, $11)
      `, [
        registration.id,
        registration.eventId,
        registration.schoolId,
        JSON.stringify(registration.data || {}),
        registration.spotsCount || 1,
        registration.status || 'CONFIRMED',
        registration.confirmationCode,
        registration.phoneNumber,
        registration.email,
        registration.createdAt,
        registration.updatedAt
      ])
    }

    console.log('\n=========================================')
    console.log('✅ Restoration complete!')
    console.log('=========================================\n')

    // Show summary
    const result = await client.query(`
      SELECT 'Events' as table_name, COUNT(*) as count FROM "Event"
      UNION ALL SELECT 'Registrations', COUNT(*) FROM "Registration"
      UNION ALL SELECT 'Schools', COUNT(*) FROM "School"
      UNION ALL SELECT 'Admins', COUNT(*) FROM "Admin"
    `)
    console.table(result.rows)

  } catch (error) {
    console.error('❌ Restoration failed:', error.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

restore()
