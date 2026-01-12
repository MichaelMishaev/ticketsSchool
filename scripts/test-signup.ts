/**
 * Test script for signup and email verification
 * Run with: npx tsx scripts/test-signup.ts
 */

const BASE_URL = 'http://localhost:9000'

async function testSignup() {
  console.log('🧪 Testing Signup Flow...\n')

  const testData = {
    email: `test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    name: 'Test User',
    schoolName: 'Test School',
    schoolSlug: `test-school-${Date.now()}`,
  }

  console.log('📝 Signup data:', {
    ...testData,
    password: '***hidden***',
  })

  try {
    // Test signup
    const signupResponse = await fetch(`${BASE_URL}/api/admin/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    })

    const signupResult = await signupResponse.json()

    if (!signupResponse.ok) {
      console.error('❌ Signup failed:', signupResult)
      return
    }

    console.log('\n✅ Signup successful!')
    console.log('School:', signupResult.school)
    console.log('Admin:', signupResult.admin)
    console.log('Email sent:', signupResult.emailSent)

    if (!signupResult.emailSent) {
      console.warn('\n⚠️  Email was not sent. Check your RESEND_API_KEY in .env')
      console.warn('   Get your API key from: https://resend.com/api-keys')
    } else {
      console.log('\n✅ Verification email sent successfully!')
      console.log('   Check your inbox at:', testData.email)
      console.log('   (If using a test email, check Resend dashboard)')
    }

    console.log('\n📊 Next steps:')
    console.log('   1. Check your email for verification link')
    console.log('   2. Click the link to verify your account')
    console.log('   3. Login at:', `${BASE_URL}/admin/login`)

    return signupResult
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

async function testDuplicateEmail() {
  console.log('\n\n🧪 Testing Duplicate Email Prevention...\n')

  const testData = {
    email: 'duplicate@example.com',
    password: 'TestPassword123!',
    name: 'Duplicate Test',
    schoolName: 'Duplicate School',
    schoolSlug: 'duplicate-school-1',
  }

  try {
    // First signup
    console.log('1️⃣ Creating first account...')
    const firstResponse = await fetch(`${BASE_URL}/api/admin/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData),
    })

    if (firstResponse.ok) {
      console.log('✅ First account created')
    }

    // Try duplicate email with different slug
    console.log('\n2️⃣ Attempting duplicate email...')
    const duplicateResponse = await fetch(`${BASE_URL}/api/admin/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...testData,
        schoolSlug: 'duplicate-school-2', // Different slug
      }),
    })

    const duplicateResult = await duplicateResponse.json()

    if (duplicateResponse.status === 409) {
      console.log('✅ Duplicate email correctly prevented!')
      console.log('   Error message:', duplicateResult.error)
    } else {
      console.error('❌ Duplicate email was NOT prevented!')
    }
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

async function testDuplicateSlug() {
  console.log('\n\n🧪 Testing Duplicate Slug Prevention...\n')

  const baseSlug = 'test-slug-unique'

  try {
    // First signup
    console.log('1️⃣ Creating first school with slug...')
    const firstResponse = await fetch(`${BASE_URL}/api/admin/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `test-slug-1-${Date.now()}@example.com`,
        password: 'TestPassword123!',
        name: 'Slug Test 1',
        schoolName: 'Slug School 1',
        schoolSlug: baseSlug,
      }),
    })

    if (firstResponse.ok) {
      console.log('✅ First school created with slug:', baseSlug)
    }

    // Try duplicate slug with different email
    console.log('\n2️⃣ Attempting duplicate slug...')
    const duplicateResponse = await fetch(`${BASE_URL}/api/admin/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `test-slug-2-${Date.now()}@example.com`,
        password: 'TestPassword123!',
        name: 'Slug Test 2',
        schoolName: 'Slug School 2',
        schoolSlug: baseSlug, // Same slug!
      }),
    })

    const duplicateResult = await duplicateResponse.json()

    if (duplicateResponse.status === 409) {
      console.log('✅ Duplicate slug correctly prevented!')
      console.log('   Error message:', duplicateResult.error)
    } else {
      console.error('❌ Duplicate slug was NOT prevented!')
    }
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Signup Tests\n')
  console.log('='.repeat(60))

  await testSignup()
  await testDuplicateEmail()
  await testDuplicateSlug()

  console.log('\n' + '='.repeat(60))
  console.log('\n✅ All tests completed!\n')
}

runAllTests()
