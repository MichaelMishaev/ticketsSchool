import { prisma } from '@/lib/prisma'

/**
 * Check if a user is banned for a specific school
 * Returns active ban details if banned, null otherwise
 */
export async function checkUserBanned(phoneNumber: string, schoolId: string) {
  const bans = await prisma.userBan.findMany({
    where: {
      phoneNumber,
      schoolId,
      active: true
    }
  })

  // Find first active ban (date-based OR game-based with remaining games)
  const activeBan = bans.find(ban => {
    // Date-based ban (not expired)
    if (ban.expiresAt && ban.expiresAt >= new Date()) {
      return true
    }
    // Game-based ban (no expiration date AND still has games to block)
    if (!ban.expiresAt && ban.eventsBlocked < ban.bannedGamesCount) {
      return true
    }
    return false
  })

  return activeBan || null
}

/**
 * Increment ban counters for all active game-based bans for a school
 * Call this after an event ends to count it towards game-based bans
 *
 * @param eventId - The event that just ended
 */
export async function incrementBanCountersForEvent(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, schoolId: true, endAt: true }
  })

  if (!event) {
    console.error(`Event ${eventId} not found`)
    return
  }

  // Only process events that have ended
  if (event.endAt && event.endAt > new Date()) {
    console.log(`Event ${eventId} has not ended yet`)
    return
  }

  // Get all active game-based bans for this school
  const allBans = await prisma.userBan.findMany({
    where: {
      schoolId: event.schoolId,
      active: true,
      expiresAt: null // Game-based only
    }
  })

  // Filter to bans that still have games remaining
  const activeBans = allBans.filter(ban => ban.eventsBlocked < ban.bannedGamesCount)

  console.log(`Processing ${activeBans.length} game-based bans for school ${event.schoolId}`)

  // Update each ban
  for (const ban of activeBans) {
    const newCount = ban.eventsBlocked + 1

    if (newCount >= ban.bannedGamesCount) {
      // Ban completed - deactivate
      await prisma.userBan.update({
        where: { id: ban.id },
        data: {
          eventsBlocked: newCount,
          active: false
        }
      })
      console.log(`Ban ${ban.id} completed (${newCount}/${ban.bannedGamesCount} games)`)
    } else {
      // Increment counter
      await prisma.userBan.update({
        where: { id: ban.id },
        data: { eventsBlocked: newCount }
      })
      console.log(`Ban ${ban.id} incremented (${newCount}/${ban.bannedGamesCount} games)`)
    }
  }
}

/**
 * Auto-deactivate expired date-based bans
 * Call this periodically (e.g., daily cron job)
 */
export async function deactivateExpiredBans() {
  const result = await prisma.userBan.updateMany({
    where: {
      active: true,
      expiresAt: { lt: new Date() }
    },
    data: {
      active: false
    }
  })

  console.log(`Deactivated ${result.count} expired bans`)
  return result.count
}

/**
 * Get ban statistics for a school
 */
export async function getBanStats(schoolId: string) {
  const allBans = await prisma.userBan.findMany({
    where: { schoolId },
    select: {
      active: true,
      expiresAt: true,
      eventsBlocked: true,
      bannedGamesCount: true
    }
  })

  const now = new Date()

  // Count active bans (date-based not expired OR game-based with remaining games)
  const activeBans = allBans.filter(ban => {
    if (!ban.active) return false
    // Date-based ban (not expired)
    if (ban.expiresAt && ban.expiresAt >= now) return true
    // Game-based ban (no expiration AND has remaining games)
    if (!ban.expiresAt && ban.eventsBlocked < ban.bannedGamesCount) return true
    return false
  }).length

  // Count expired bans
  const expiredBans = allBans.filter(ban => {
    if (!ban.active) return true
    if (ban.expiresAt && ban.expiresAt < now) return true
    return false
  }).length

  return {
    active: activeBans,
    expired: expiredBans,
    total: allBans.length
  }
}
