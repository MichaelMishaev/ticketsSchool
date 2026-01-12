import { PrismaClient } from '@prisma/client'
import { encryptPhone, encryptEmail } from '../lib/encryption'

const prisma = new PrismaClient()

interface MigrationStats {
  paymentsEncrypted: number
  adminsEncrypted: number
  registrationsEncrypted: number
  bansEncrypted: number
  errors: number
}

async function encryptExistingData(dryRun = false) {
  console.log('[Data Encryption Migration] Starting...')
  console.log('[Data Encryption Migration] Timestamp:', new Date().toISOString())
  console.log('[Data Encryption Migration] Mode:', dryRun ? 'DRY RUN (no changes)' : 'LIVE RUN')

  const stats: MigrationStats = {
    paymentsEncrypted: 0,
    adminsEncrypted: 0,
    registrationsEncrypted: 0,
    bansEncrypted: 0,
    errors: 0,
  }

  try {
    // 1. Encrypt Payment payer data
    console.log('\n[1/4] Encrypting payment records...')
    const payments = await prisma.payment.findMany({
      where: {
        OR: [
          {
            AND: [
              { payerPhone: { not: null } },
              // Only encrypt if not already encrypted (base64 check)
              {
                payerPhone: {
                  not: {
                    // Encrypted strings are base64 (alphanumeric + / + =)
                    // Plain Israeli phones start with 0 or +
                    contains: '0',
                  },
                },
              },
            ],
          },
          {
            AND: [
              { payerEmail: { not: null } },
              // Email detection: contains @ = plaintext
              { payerEmail: { contains: '@' } },
            ],
          },
        ],
      },
      select: {
        id: true,
        payerPhone: true,
        payerEmail: true,
      },
    })

    console.log(`[1/4] Found ${payments.length} payment records to encrypt`)

    for (const payment of payments) {
      try {
        const updateData: any = {}

        if (payment.payerPhone && payment.payerPhone.includes('0')) {
          // Phone is plaintext (contains digit 0)
          updateData.payerPhone = encryptPhone(payment.payerPhone)
        }

        if (payment.payerEmail && payment.payerEmail.includes('@')) {
          // Email is plaintext (contains @)
          updateData.payerEmail = encryptEmail(payment.payerEmail)
        }

        if (Object.keys(updateData).length > 0) {
          if (!dryRun) {
            await prisma.payment.update({
              where: { id: payment.id },
              data: updateData,
            })
          }

          stats.paymentsEncrypted++

          if (stats.paymentsEncrypted % 100 === 0) {
            console.log(`[1/4] Progress: ${stats.paymentsEncrypted}/${payments.length}`)
          }
        }
      } catch (error) {
        console.error(`[1/4] Error encrypting payment ${payment.id}:`, error)
        stats.errors++
      }
    }

    console.log(`[1/4] Completed: ${stats.paymentsEncrypted} payments encrypted`)

    // 2. Encrypt Admin emails (if needed for compliance)
    console.log('\n[2/4] Checking admin records...')
    // Note: We don't encrypt admin emails as they're used for login
    // This is intentional - only encrypt PII in secondary storage
    console.log('[2/4] Admin emails kept plaintext for authentication (intentional)')

    // 3. Encrypt Registration data
    console.log('\n[3/4] Encrypting registration records...')
    const registrations = await prisma.registration.findMany({
      where: {
        OR: [
          {
            AND: [
              { phoneNumber: { not: null } },
              // Phone contains digit 0 = plaintext
              { phoneNumber: { contains: '0' } },
            ],
          },
          {
            AND: [
              { email: { not: null } },
              // Email contains @ = plaintext
              { email: { contains: '@' } },
            ],
          },
        ],
      },
      select: {
        id: true,
        phoneNumber: true,
        email: true,
      },
    })

    console.log(`[3/4] Found ${registrations.length} registration records to encrypt`)

    for (const registration of registrations) {
      try {
        const updateData: any = {}

        if (registration.phoneNumber && registration.phoneNumber.includes('0')) {
          // Phone is plaintext
          updateData.phoneNumber = encryptPhone(registration.phoneNumber)
        }

        if (registration.email && registration.email.includes('@')) {
          // Email is plaintext
          updateData.email = encryptEmail(registration.email)
        }

        if (Object.keys(updateData).length > 0) {
          if (!dryRun) {
            await prisma.registration.update({
              where: { id: registration.id },
              data: updateData,
            })
          }

          stats.registrationsEncrypted++

          if (stats.registrationsEncrypted % 100 === 0) {
            console.log(`[3/4] Progress: ${stats.registrationsEncrypted}/${registrations.length}`)
          }
        }
      } catch (error) {
        console.error(`[3/4] Error encrypting registration ${registration.id}:`, error)
        stats.errors++
      }
    }

    console.log(`[3/4] Completed: ${stats.registrationsEncrypted} registrations encrypted`)

    // 4. Encrypt UserBan data
    console.log('\n[4/4] Encrypting user ban records...')
    const bans = await prisma.userBan.findMany({
      where: {
        OR: [
          {
            // Phone contains digit 0 = plaintext (not encrypted)
            phoneNumber: { contains: '0' },
          },
          {
            AND: [
              // Email contains @ = plaintext (but skip anonymous)
              { email: { contains: '@' } },
              { NOT: { email: 'anonymous@banned.local' } },
            ],
          },
        ],
      },
      select: {
        id: true,
        phoneNumber: true,
        email: true,
      },
    })

    console.log(`[4/4] Found ${bans.length} ban records to encrypt`)

    for (const ban of bans) {
      try {
        const updateData: any = {}

        if (ban.phoneNumber && ban.phoneNumber.includes('0')) {
          // Phone is plaintext
          updateData.phoneNumber = encryptPhone(ban.phoneNumber)
        }

        if (ban.email && ban.email.includes('@') && ban.email !== 'anonymous@banned.local') {
          // Email is plaintext and not anonymous
          updateData.email = encryptEmail(ban.email)
        }

        if (Object.keys(updateData).length > 0) {
          if (!dryRun) {
            await prisma.userBan.update({
              where: { id: ban.id },
              data: updateData,
            })
          }

          stats.bansEncrypted++
        }
      } catch (error) {
        console.error(`[4/4] Error encrypting ban ${ban.id}:`, error)
        stats.errors++
      }
    }

    console.log(`[4/4] Completed: ${stats.bansEncrypted} bans encrypted`)

    // Print final summary
    console.log('\n' + '='.repeat(60))
    console.log('MIGRATION SUMMARY')
    console.log('='.repeat(60))
    console.log(`Mode: ${dryRun ? 'DRY RUN (no changes made)' : 'LIVE RUN'}`)
    console.log(`Payment records encrypted: ${stats.paymentsEncrypted}`)
    console.log(`Admin records encrypted: ${stats.adminsEncrypted}`)
    console.log(`Registration records encrypted: ${stats.registrationsEncrypted}`)
    console.log(`Ban records encrypted: ${stats.bansEncrypted}`)
    console.log(`Total errors: ${stats.errors}`)
    console.log('='.repeat(60))
    console.log(`Completed at: ${new Date().toISOString()}`)

    if (stats.errors > 0) {
      console.warn('\n⚠️  Some records failed to encrypt. Check logs above.')
      process.exit(1)
    } else {
      if (dryRun) {
        console.log('\n✅ Dry run completed successfully!')
        console.log('Run without --dry-run to perform actual encryption.')
      } else {
        console.log('\n✅ All records encrypted successfully!')
      }
    }
  } catch (error) {
    console.error('\n❌ FATAL ERROR during migration:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Rollback function (decrypt data back to plaintext)
async function rollbackEncryption() {
  console.log('[ROLLBACK] Encryption rollback requested')
  console.log('[ROLLBACK] This would decrypt all encrypted data')
  console.log('[ROLLBACK] Not implemented for security - manual recovery only')
  console.log('[ROLLBACK] To rollback: restore database from backup taken before migration')
  console.log('[ROLLBACK] Contact security team if rollback needed')
  console.log('\n❌ Rollback not available. Use database backup instead.')
  process.exit(1)
}

// Run if called directly
if (require.main === module) {
  const args = process.argv.slice(2)

  if (args.includes('--rollback')) {
    rollbackEncryption()
      .then(() => process.exit(0))
      .catch(() => process.exit(1))
  } else if (args.includes('--dry-run')) {
    encryptExistingData(true)
      .then(() => process.exit(0))
      .catch(() => process.exit(1))
  } else {
    // Require explicit confirmation for live run
    console.log('⚠️  WARNING: This will encrypt data in the database!')
    console.log('Run with --dry-run first to preview changes.')
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...')

    setTimeout(() => {
      encryptExistingData(false)
        .then(() => process.exit(0))
        .catch(() => process.exit(1))
    }, 5000)
  }
}

export { encryptExistingData, rollbackEncryption }
