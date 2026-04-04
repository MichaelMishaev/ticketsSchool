/**
 * Payment calculation utilities for YaadPay integration
 *
 * CRITICAL: All amounts are in CENTS (agorot), not shekels
 * 1 ILS = 100 cents
 *
 * PRINCIPLE #1: Test-Driven Development (TDD)
 * PRINCIPLE #11: Negative Testing (Test Forbidden Paths)
 *
 * Business Rules (Israeli Shekel - ILS):
 * - Amounts stored in cents (1 ILS = 100 agorot/cents)
 * - Minimum payment: 1 agora (0.01 ILS = 1 cent)
 * - YaadPay processing fee: 2.5% + 1 ILS (100 cents) fixed fee
 * - Formula: subtotal = basePrice × quantity
 * - Formula: processingFee = (subtotal × 0.025) + 100 cents
 * - Formula: total = subtotal + processingFee
 */

/**
 * Calculate total payment amount in cents (agorot)
 *
 * @param basePrice - Price per participant in cents (e.g., 5000 = 50 ILS)
 * @param quantity - Number of participants (must be positive integer)
 * @param includeProcessingFee - Whether to include YaadPay processing fee (default: true)
 * @returns Total amount in cents
 * @throws Error if inputs are invalid (zero, negative, or non-integer)
 */
export function calculatePaymentAmount(
  basePrice: number,
  quantity: number,
  includeProcessingFee: boolean = true
): number {
  // Validate inputs (PRINCIPLE #11: Negative Testing)
  if (basePrice <= 0) {
    throw new Error('Base price must be positive')
  }
  if (quantity <= 0) {
    throw new Error('Quantity must be positive')
  }
  if (!Number.isInteger(basePrice)) {
    throw new Error('Base price must be an integer (in cents)')
  }
  if (!Number.isInteger(quantity)) {
    throw new Error('Quantity must be an integer')
  }

  // Calculate subtotal
  const subtotal = basePrice * quantity

  // Return subtotal if processing fee not requested
  if (!includeProcessingFee) {
    return subtotal
  }

  // YaadPay processing fee calculation
  // Fee: 2.5% + 100 cents (1 ILS) fixed fee
  const percentageFee = Math.round(subtotal * 0.025)
  const fixedFee = 100 // 1 ILS in cents
  const totalFee = percentageFee + fixedFee

  return subtotal + totalFee
}

/**
 * Convert cents to ILS display format (e.g., 15050 → "150.50")
 *
 * @param cents - Amount in cents
 * @returns Formatted string in ILS (e.g., "150.50")
 * @throws Error if cents is not an integer
 */
export function formatCentsToILS(cents: number): string {
  if (!Number.isInteger(cents)) {
    throw new Error('Cents must be an integer')
  }
  return (cents / 100).toFixed(2)
}

/**
 * Convert ILS to cents (e.g., 150.50 → 15050)
 *
 * @param ils - Amount in ILS (e.g., 150.50)
 * @returns Amount in cents (e.g., 15050)
 * @throws Error if ILS amount is negative
 */
export function convertILSToCents(ils: number): number {
  if (ils < 0) {
    throw new Error('ILS amount cannot be negative')
  }
  return Math.round(ils * 100)
}
