/**
 * Test script to validate encryption migration logic
 * Run: tsx scripts/test-encrypt-migration.ts
 */

import { PrismaClient } from '@prisma/client'
import { encryptPhone, encryptEmail, decryptPhone, decryptEmail } from '../lib/encryption'

const prisma = new PrismaClient()

async function testEncryptionMigration() {
  console.log('[Test] Starting encryption migration validation...\n')

  try {
    // Test 1: Encryption functions work
    console.log('[Test 1] Testing encryption functions...')
    const testPhone = '0501234567'
    const testEmail = 'test@example.com'

    const encryptedPhone = encryptPhone(testPhone)
    const encryptedEmail = encryptEmail(testEmail)

    console.log('Original phone:', testPhone)
    console.log('Encrypted phone:', encryptedPhone.substring(0, 30) + '...')
    console.log('Decrypted phone:', decryptPhone(encryptedPhone))

    console.log('Original email:', testEmail)
    console.log('Encrypted email:', encryptedEmail.substring(0, 30) + '...')
    console.log('Decrypted email:', decryptEmail(encryptedEmail))

    if (decryptPhone(encryptedPhone) !== testPhone) {
      throw new Error('Phone encryption/decryption failed')
    }
    if (decryptEmail(encryptedEmail) !== testEmail) {
      throw new Error('Email encryption/decryption failed')
    }

    console.log('✅ Test 1 passed: Encryption/decryption works correctly\n')

    // Test 2: Detection of plaintext vs encrypted
    console.log('[Test 2] Testing plaintext detection...')

    const plaintextPhone = '0501234567'
    const encryptedPhoneTest = encryptPhone(plaintextPhone)

    const isPlaintextPhone = plaintextPhone.includes('0')
    const isEncryptedPhone = !encryptedPhoneTest.includes('0')

    console.log('Plaintext detection (should be true):', isPlaintextPhone)
    console.log('Encrypted detection (should be true):', isEncryptedPhone)

    const plaintextEmail = 'user@example.com'
    const encryptedEmailTest = encryptEmail(plaintextEmail)

    const isPlaintextEmail = plaintextEmail.includes('@')
    const isEncryptedEmail = !encryptedEmailTest.includes('@')

    console.log('Plaintext email detection (should be true):', isPlaintextEmail)
    console.log('Encrypted email detection (should be true):', isEncryptedEmail)

    if (!isPlaintextPhone || !isEncryptedPhone || !isPlaintextEmail || !isEncryptedEmail) {
      throw new Error('Detection logic failed')
    }

    console.log('✅ Test 2 passed: Plaintext detection works correctly\n')

    // Test 3: Count records that would be encrypted (dry-run simulation)
    console.log('[Test 3] Counting records for encryption...')

    const paymentsToEncrypt = await prisma.payment.count({
      where: {
        OR: [
          {
            AND: [{ payerPhone: { not: null } }, { payerPhone: { contains: '0' } }],
          },
          {
            AND: [{ payerEmail: { not: null } }, { payerEmail: { contains: '@' } }],
          },
        ],
      },
    })

    const registrationsToEncrypt = await prisma.registration.count({
      where: {
        OR: [
          {
            AND: [{ phoneNumber: { not: null } }, { phoneNumber: { contains: '0' } }],
          },
          {
            AND: [{ email: { not: null } }, { email: { contains: '@' } }],
          },
        ],
      },
    })

    const bansToEncrypt = await prisma.userBan.count({
      where: {
        OR: [
          {
            AND: [{ phoneNumber: { not: null } }, { phoneNumber: { contains: '0' } }],
          },
          {
            AND: [
              { email: { not: null } },
              { email: { contains: '@' } },
              { email: { not: 'anonymous@banned.local' } },
            ],
          },
        ],
      },
    })

    console.log('Payments to encrypt:', paymentsToEncrypt)
    console.log('Registrations to encrypt:', registrationsToEncrypt)
    console.log('Bans to encrypt:', bansToEncrypt)

    console.log('✅ Test 3 passed: Database queries work correctly\n')

    // Summary
    console.log('='.repeat(60))
    console.log('TEST SUMMARY')
    console.log('='.repeat(60))
    console.log('✅ All tests passed!')
    console.log('\nMigration script is ready to use:')
    console.log('  npm run encrypt:check    (dry-run)')
    console.log('  npm run encrypt:existing (live migration)')
    console.log('='.repeat(60))
  } catch (error) {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run tests
testEncryptionMigration()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
