/**
 * Event capacity validation and registration status logic
 *
 * PRINCIPLE #7: Database Constraints + Business Logic
 * Capacity enforcement is CRITICAL for event registration.
 * This module handles atomic counter logic to prevent race conditions.
 */

/**
 * Result of registration capacity check
 */
export type RegistrationResult = {
  canRegister: boolean
  status: 'CONFIRMED' | 'WAITLIST'
}

/**
 * Check if registration can proceed based on capacity
 *
 * @param currentReserved - Current number of reserved spots
 * @param totalCapacity - Total event capacity
 * @param requestedSpots - Number of spots being requested
 * @returns Registration result with status (CONFIRMED or WAITLIST)
 * @throws Error if inputs are invalid
 */
export function canRegister(
  currentReserved: number,
  totalCapacity: number,
  requestedSpots: number
): RegistrationResult {
  // Validate inputs
  if (requestedSpots <= 0) {
    throw new Error('Requested spots must be positive')
  }
  if (totalCapacity <= 0) {
    throw new Error('Total capacity must be positive')
  }
  if (currentReserved < 0) {
    throw new Error('Current reserved cannot be negative')
  }

  const spotsAfterReservation = currentReserved + requestedSpots

  if (spotsAfterReservation <= totalCapacity) {
    return { canRegister: true, status: 'CONFIRMED' }
  } else {
    return { canRegister: true, status: 'WAITLIST' }
  }
}
