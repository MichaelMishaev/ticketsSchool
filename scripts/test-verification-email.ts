import { sendVerificationEmail } from '../lib/email'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

async function testVerificationEmail() {
  console.log('\n🧪 Testing Verification Email Sending...\n')

  console.log('Environment check:')
  console.log('- RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✅ Set' : '❌ Not set')
  console.log('- EMAIL_FROM:', process.env.EMAIL_FROM || 'Not set')
  console.log('- BASE_URL:', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9000')

  // Get email from command line argument
  const testEmail = process.argv[2]

  if (!testEmail) {
    console.error('\n❌ Please provide an email address as argument')
    console.log('\nUsage: npx tsx scripts/test-verification-email.ts <email>\n')
    process.exit(1)
  }

  console.log('\n📧 Sending verification email to:', testEmail)
  console.log('⏳ Please wait...\n')

  try {
    const testToken = 'test-token-' + Date.now()
    const result = await sendVerificationEmail(
      testEmail,
      testToken,
      'Test User'
    )

    if (result) {
      console.log('✅ Email sent successfully!')
      console.log('\nCheck your inbox for:', testEmail)
      console.log('Subject: אימות כתובת מייל - TicketCap')
      console.log('\n⚠️  Note: This is a test email. The verification link will not work.')
    } else {
      console.log('❌ Email failed to send')
      console.log('\nPossible reasons:')
      console.log('1. RESEND_API_KEY is invalid')
      console.log('2. Resend API is down')
      console.log('3. Email domain not verified (kartis.info)')
      console.log('\nCheck the error logs above for details.')
    }
  } catch (error) {
    console.error('❌ Error sending email:', error)
  }
}

testVerificationEmail()
