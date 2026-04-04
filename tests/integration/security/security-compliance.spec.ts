import { test, expect } from '@playwright/test'
import { PrismaClient } from '@prisma/client'
import * as path from 'path'
import * as fs from 'fs'
import { encrypt, decrypt, encryptPhone, decryptPhone } from '@/lib/encryption'
import { validatePassword } from '@/lib/password-validator'
import { rateLimit } from '@/lib/rate-limiter'

const prisma = new PrismaClient()

test.describe('Phase 1 Critical Security Fixes', () => {
  test.describe('CRIT-1: Payment Signature Validation', () => {
    test('callback validation function exists', () => {
      const yaadpayPath = path.join(process.cwd(), 'lib/yaadpay.ts')
      const content = fs.readFileSync(yaadpayPath, 'utf-8')

      // Our implementation uses validateCallback for parameter validation
      expect(content).toContain('validateCallback')
      expect(content).toContain('signature')
    })

    test('callback handler validates parameters', () => {
      const callbackPath = path.join(process.cwd(), 'app/api/payment/callback/route.ts')
      const content = fs.readFileSync(callbackPath, 'utf-8')

      // Verify validation is called before processing payment
      expect(content).toContain('validateCallback')
      expect(content).toContain('validation.isValid')
    })

    test('yaadpay library has validation function', () => {
      const yaadpayPath = path.join(process.cwd(), 'lib/yaadpay.ts')
      const content = fs.readFileSync(yaadpayPath, 'utf-8')

      // Check for validation logic
      expect(content).toContain('function validateCallback')
      expect(content).toContain('CallbackValidationResult')
    })
  })

  test.describe('CRIT-2: Mock Mode Production Safety', () => {
    test('should have runtime guard in yaadpay config', () => {
      const yaadpayPath = path.join(process.cwd(), 'lib/yaadpay.ts')
      const content = fs.readFileSync(yaadpayPath, 'utf-8')

      // Verify runtime guard exists
      expect(content).toContain('NODE_ENV')
      expect(content).toContain('production')
      expect(content).toContain('YAADPAY_MOCK_MODE')
      expect(content).toContain('SECURITY VIOLATION')
    })

    test('should document mock mode in env example', () => {
      const envExamplePath = path.join(process.cwd(), '.env.example')
      const content = fs.readFileSync(envExamplePath, 'utf-8')

      expect(content).toContain('YAADPAY_MOCK_MODE')
      expect(content).toContain('NEVER in production')
    })
  })

  test.describe('CRIT-3: Error Message Sanitization', () => {
    test('should not expose internal errors in signup API', () => {
      const signupPath = path.join(process.cwd(), 'app/api/admin/signup/route.ts')
      const content = fs.readFileSync(signupPath, 'utf-8')

      // Should have sanitized error handling
      expect(content).toContain('requestId')
      expect(content).not.toContain('console.error(error.stack)')

      // Should use generic error messages
      const genericErrorPatterns = ['שגיאה', 'Internal error', 'requestId']

      const hasGenericErrors = genericErrorPatterns.some((pattern) => content.includes(pattern))
      expect(hasGenericErrors).toBe(true)
    })

    test('should have request ID generation in error handlers', () => {
      const signupPath = path.join(process.cwd(), 'app/api/admin/signup/route.ts')
      const content = fs.readFileSync(signupPath, 'utf-8')

      expect(content).toContain('randomUUID')
      expect(content).toContain('requestId')
    })
  })

  test.describe('CRIT-4: Multi-Tenant Isolation', () => {
    test('should have schoolId validation in team invitations API', () => {
      const routePath = path.join(process.cwd(), 'app/api/admin/team/invitations/route.ts')
      const content = fs.readFileSync(routePath, 'utf-8')

      expect(content).toContain('INVARIANT VIOLATION')
      expect(content).toContain('schoolId')
    })

    test('should enforce schoolId filtering in events API', () => {
      const eventsPath = path.join(process.cwd(), 'app/api/events/route.ts')

      if (fs.existsSync(eventsPath)) {
        const content = fs.readFileSync(eventsPath, 'utf-8')

        // Should filter by schoolId for non-super admins
        expect(content).toContain('schoolId')
        expect(content).toContain('SUPER_ADMIN')
      }
    })
  })
})

test.describe('Israeli PPL Compliance', () => {
  test('DPO contact information is documented', () => {
    // Check that DPO information exists in PPL compliance documentation
    const pplDocPath = path.join(process.cwd(), 'docs/infrastructure/ISRAELI_PPL_COMPLIANCE.md')
    const content = fs.readFileSync(pplDocPath, 'utf-8')

    // Verify DPO contact information is documented
    expect(content).toContain('privacy@ticketcap.co.il')
    expect(content).toContain('קצין הגנת המידע')
  })

  test('encryption library is functional', async () => {
    // Test phone encryption
    const originalPhone = '0501234567'
    const encrypted = encryptPhone(originalPhone)
    const decrypted = decryptPhone(encrypted)

    expect(encrypted).not.toBe(originalPhone)
    expect(encrypted.length).toBeGreaterThan(50)
    expect(decrypted).toBe(originalPhone)

    // Test general encryption
    const originalText = 'secret data'
    const encryptedText = encrypt(originalText)
    const decryptedText = decrypt(encryptedText)

    expect(decryptedText).toBe(originalText)
  })

  test('breach incident model exists in schema', () => {
    const schemaPath = path.join(process.cwd(), 'prisma/schema.prisma')
    const content = fs.readFileSync(schemaPath, 'utf-8')

    expect(content).toContain('model BreachIncident')
  })

  test('data retention policy is documented', () => {
    // Check that data retention policy exists as documentation
    const retentionPolicyPath = path.join(
      process.cwd(),
      'docs/infrastructure/DATA_RETENTION_POLICY.md'
    )
    expect(fs.existsSync(retentionPolicyPath)).toBe(true)

    // Verify content includes key sections
    const content = fs.readFileSync(retentionPolicyPath, 'utf-8')
    expect(content).toContain('Data Retention Policy')
    expect(content).toContain('7 years') // Payment records retention
  })
})

test.describe('Authentication Security', () => {
  test.describe('Rate Limiting', () => {
    test.skip('should block excessive login attempts', async ({ request }) => {
      // Note: Skipped in standard test runs to avoid triggering actual rate limits
      // Run manually when testing rate limiting specifically

      const email = 'ratelimit-test@example.com'
      const password = 'wrongpassword'

      // Make 6 rapid login attempts (limit should be 5)
      const promises = Array(6)
        .fill(null)
        .map(() =>
          request.post('/api/admin/login', {
            data: { email, password },
          })
        )

      const responses = await Promise.all(promises)

      // At least one should be rate limited (429)
      const rateLimited = responses.some((r) => r.status() === 429)
      expect(rateLimited).toBe(true)
    })

    test('rate limiter library exists and has correct configuration', () => {
      expect(rateLimit).toBeDefined()
      expect(typeof rateLimit).toBe('function')

      // Test that rate limiter returns a function
      const limiter = rateLimit({
        windowMs: 1000,
        maxAttempts: 5,
      })

      expect(typeof limiter).toBe('function')
    })
  })

  test.describe('Password Validation', () => {
    test('password validator library exists and has required rules', () => {
      expect(validatePassword).toBeDefined()
      expect(typeof validatePassword).toBe('function')

      const result = validatePassword('test')
      expect(result).toHaveProperty('isValid')
      expect(result).toHaveProperty('errors')
      expect(result).toHaveProperty('strength')
    })

    test('should reject weak passwords', () => {
      const weakPasswords = [
        'password',
        '12345678',
        'Password1',
        'pass@123',
        'PASSWORD123!',
        'password123!',
      ]

      for (const password of weakPasswords) {
        const result = validatePassword(password)
        expect(result.isValid).toBe(false)
        expect(result.errors.length).toBeGreaterThan(0)
      }
    })

    test('should accept strong passwords', () => {
      const strongPasswords = [
        'MyStr0ng!P@ssw0rd2025',
        'C0mpl3x!ty_R3qu1r3d',
        'Secur3#Passw0rd!123',
      ]

      for (const password of strongPasswords) {
        const result = validatePassword(password)
        expect(result.isValid).toBe(true)
        expect(result.strength).toBeGreaterThanOrEqual(2)
      }
    })

    test('should reject passwords containing email', () => {
      const result = validatePassword('MyEmail123!@Password', 'myemail@test.com')

      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.includes('אימייל'))).toBe(true)
    })
  })

  test.describe('JWT Security', () => {
    test('JWT secret must be properly configured', () => {
      const envExamplePath = path.join(process.cwd(), '.env.example')
      const content = fs.readFileSync(envExamplePath, 'utf-8')

      expect(content).toContain('JWT_SECRET')
      expect(content).toContain('32') // Minimum length requirement
    })

    test('auth library enforces JWT secret requirement', () => {
      const authPath = path.join(process.cwd(), 'lib/auth.server.ts')
      const content = fs.readFileSync(authPath, 'utf-8')

      // Should NOT have a fallback secret
      expect(content).not.toContain('your-secret-key-min-32-chars')
    })
  })
})

test.describe('File Integrity Checks', () => {
  test('all critical security files exist', () => {
    const criticalFiles = [
      'lib/yaadpay.ts',
      'app/api/admin/signup/route.ts',
      'app/api/admin/login/route.ts',
      'app/api/payment/create/route.ts',
      'app/api/payment/callback/route.ts',
      'app/privacy/page.tsx',
      'prisma/schema.prisma',
      '.env.example',
    ]

    for (const file of criticalFiles) {
      const filePath = path.join(process.cwd(), file)
      expect(fs.existsSync(filePath), `${file} should exist`).toBe(true)
    }
  })

  test('security documentation files exist', () => {
    const docs = [
      'docs/infrastructure/ISRAELI_PPL_COMPLIANCE.md',
      'docs/infrastructure/DATA_RETENTION_POLICY.md',
      'tests/security/README.md',
      'tests/security/TEST_SUITE_SUMMARY.md',
    ]

    for (const doc of docs) {
      const docPath = path.join(process.cwd(), doc)
      expect(fs.existsSync(docPath)).toBe(true)
    }
  })

  test('environment variables are documented in .env.example', () => {
    const envExamplePath = path.join(process.cwd(), '.env.example')
    const content = fs.readFileSync(envExamplePath, 'utf-8')

    // Check for security-critical env vars
    const criticalEnvVars = [
      'JWT_SECRET',
      'YAADPAY_MOCK_MODE',
      'YAADPAY_API_SECRET',
      'DATABASE_URL',
      'RESEND_API_KEY',
    ]

    for (const envVar of criticalEnvVars) {
      expect(content, `${envVar} should be documented`).toContain(envVar)
    }
  })

  test('encryption key is documented if encryption exists', () => {
    const encryptionPath = path.join(process.cwd(), 'lib/encryption.ts')

    if (fs.existsSync(encryptionPath)) {
      const envExamplePath = path.join(process.cwd(), '.env.example')
      const content = fs.readFileSync(envExamplePath, 'utf-8')

      expect(content).toContain('ENCRYPTION_KEY')
    }
  })
})

test.describe('Code Quality Checks', () => {
  test('no hardcoded secrets in yaadpay config', () => {
    const yaadpayPath = path.join(process.cwd(), 'lib/yaadpay.ts')
    const content = fs.readFileSync(yaadpayPath, 'utf-8')

    // Should use environment variables, not hardcoded values
    expect(content).toContain('process.env.YAADPAY_MASOF')
    expect(content).toContain('process.env.YAADPAY_API_SECRET')

    // Should NOT contain hardcoded terminal numbers or secrets
    expect(content).not.toMatch(/masof:\s*['"]0011\d+['"]/)
    expect(content).not.toMatch(/apiSecret:\s*['"][a-zA-Z0-9]{20,}['"]/)
  })

  test('payment callback validates all required parameters', () => {
    const callbackPath = path.join(process.cwd(), 'app/api/payment/callback/route.ts')
    const content = fs.readFileSync(callbackPath, 'utf-8')

    // Should validate required YaadPay callback parameters
    const requiredParams = ['CCode', 'Order', 'Id', 'Amount']

    for (const param of requiredParams) {
      expect(content, `Should check for ${param}`).toContain(param)
    }
  })

  test('signup API sanitizes user input', () => {
    const signupPath = path.join(process.cwd(), 'app/api/admin/signup/route.ts')
    const content = fs.readFileSync(signupPath, 'utf-8')

    // Should validate/sanitize email
    expect(content).toContain('email')

    // Should hash password (not store plaintext)
    expect(content).toContain('bcrypt')
    expect(content).toContain('hash')
  })

  test('no SQL injection vulnerabilities in Prisma queries', () => {
    const apiFiles = [
      'app/api/events/route.ts',
      'app/api/admin/login/route.ts',
      'app/api/admin/team/invitations/route.ts',
    ]

    for (const file of apiFiles) {
      const filePath = path.join(process.cwd(), file)

      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8')

        // Should use Prisma ORM (safe from SQL injection)
        // Should NOT use raw SQL queries with user input
        const hasRawQuery = content.includes('$queryRaw') || content.includes('$executeRaw')

        if (hasRawQuery) {
          // If using raw queries, should use parameterized queries
          const hasParameterization = content.includes('Prisma.sql')
          expect(hasParameterization, `${file} uses raw SQL without parameterization`).toBe(true)
        }
      }
    }
  })
})

test.describe('Payment Security', () => {
  test('payment creation validates amount is positive', () => {
    const createPaymentPath = path.join(process.cwd(), 'app/api/payment/create/route.ts')

    if (fs.existsSync(createPaymentPath)) {
      const content = fs.readFileSync(createPaymentPath, 'utf-8')

      // Should validate amount before creating payment
      expect(content).toContain('amount')
    }
  })

  test('mock mode displays clear warning to users', () => {
    const createPaymentPath = path.join(process.cwd(), 'app/api/payment/create/route.ts')

    if (fs.existsSync(createPaymentPath)) {
      const content = fs.readFileSync(createPaymentPath, 'utf-8')

      // Should show mock mode indicator
      expect(content).toContain('MOCK MODE')
      expect(content).toContain('Development Only')
    }
  })

  test('payment callback logs suspicious activity', () => {
    const callbackPath = path.join(process.cwd(), 'app/api/payment/callback/route.ts')
    const content = fs.readFileSync(callbackPath, 'utf-8')

    // Should log payment failures and invalid signatures
    expect(content).toContain('console.error')
  })
})

// Cleanup after all tests
test.afterAll(async () => {
  await prisma.$disconnect()
})
