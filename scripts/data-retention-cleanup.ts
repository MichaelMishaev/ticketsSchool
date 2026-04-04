import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const RETENTION_PERIODS = {
  // Completed events older than 3 years
  EVENT_DATA: 3 * 365,

  // Cancelled registrations after 1 year
  CANCELLED_REGISTRATIONS: 365,

  // Payment records - 7 years (Israeli tax law requirement)
  PAYMENT_RECORDS: 7 * 365,

  // Expired invitations after 30 days
  EXPIRED_INVITATIONS: 30,

  // OAuth states older than 1 day
  OAUTH_STATES: 1,
}

async function cleanupOldData() {
  console.log('[Data Retention] Starting cleanup job...')
  console.log('[Data Retention] Started at:', new Date().toISOString())

  const now = new Date()
  let totalDeleted = 0
  let totalAnonymized = 0

  try {
    // 1. Delete old completed events
    const eventCutoff = new Date(now.getTime() - RETENTION_PERIODS.EVENT_DATA * 24 * 60 * 60 * 1000)
    const deletedEvents = await prisma.event.deleteMany({
      where: {
        eventDate: { lt: eventCutoff },
        status: 'COMPLETED',
      },
    })
    console.log(`[Data Retention] Deleted ${deletedEvents.count} events older than 3 years`)
    totalDeleted += deletedEvents.count

    // 2. Anonymize old cancelled registrations (keep for analytics, remove PII)
    const regCutoff = new Date(
      now.getTime() - RETENTION_PERIODS.CANCELLED_REGISTRATIONS * 24 * 60 * 60 * 1000
    )
    const anonymized = await prisma.registration.updateMany({
      where: {
        status: 'CANCELLED',
        createdAt: { lt: regCutoff },
      },
      data: {
        name: 'ANONYMIZED',
        email: 'deleted@anonymized.local',
        phone: '0000000000',
        customFields: '{}',
      },
    })
    console.log(
      `[Data Retention] Anonymized ${anonymized.count} cancelled registrations older than 1 year`
    )
    totalAnonymized += anonymized.count

    // 3. Check payment records (DO NOT DELETE - tax law requires 7 years)
    const paymentCutoff = new Date(
      now.getTime() - RETENTION_PERIODS.PAYMENT_RECORDS * 24 * 60 * 60 * 1000
    )
    const oldPayments = await prisma.payment.count({
      where: {
        createdAt: { lt: paymentCutoff },
      },
    })
    console.log(
      `[Data Retention] Found ${oldPayments} payment records older than 7 years (KEPT for tax compliance)`
    )

    // 4. Delete expired invitations
    const inviteCutoff = new Date(
      now.getTime() - RETENTION_PERIODS.EXPIRED_INVITATIONS * 24 * 60 * 60 * 1000
    )
    const deletedInvites = await prisma.teamInvitation.deleteMany({
      where: {
        expiresAt: { lt: inviteCutoff },
        status: 'PENDING',
      },
    })
    console.log(
      `[Data Retention] Deleted ${deletedInvites.count} expired invitations older than 30 days`
    )
    totalDeleted += deletedInvites.count

    // 5. Delete old OAuth states
    const oauthCutoff = new Date(
      now.getTime() - RETENTION_PERIODS.OAUTH_STATES * 24 * 60 * 60 * 1000
    )
    const deletedOAuth = await prisma.oAuthState.deleteMany({
      where: {
        expiresAt: { lt: oauthCutoff },
      },
    })
    console.log(
      `[Data Retention] Deleted ${deletedOAuth.count} expired OAuth states older than 1 day`
    )
    totalDeleted += deletedOAuth.count

    console.log('\n[Data Retention] ===== SUMMARY =====')
    console.log(`[Data Retention] Total records deleted: ${totalDeleted}`)
    console.log(`[Data Retention] Total records anonymized: ${totalAnonymized}`)
    console.log(`[Data Retention] Completed at: ${new Date().toISOString()}`)
    console.log('[Data Retention] ====== END ======\n')
  } catch (error) {
    console.error('[Data Retention] ERROR during cleanup:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run if called directly
if (require.main === module) {
  cleanupOldData()
    .then(() => {
      console.log('[Data Retention] Job completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('[Data Retention] Job failed:', error)
      process.exit(1)
    })
}

export { cleanupOldData }
