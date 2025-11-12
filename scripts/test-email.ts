import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') })

import { sendTeamInvitationEmail } from '../lib/email'

async function testEmail() {
  console.log('\n=== Testing Email Configuration ===\n')

  const testEmail = '345287women@gmail.com'
  const schoolName = 'מיכאל'
  const inviterName = 'Michael Mishaev'
  const role = 'ADMIN'
  const token = 'test-token-123'

  console.log('Environment Variables:')
  console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✓ Set' : '✗ Not set')
  console.log('EMAIL_FROM:', process.env.EMAIL_FROM || 'Not set (will use default)')
  console.log('NEXT_PUBLIC_BASE_URL:', process.env.NEXT_PUBLIC_BASE_URL || 'Not set (will use default)')
  console.log('\n')

  console.log('Attempting to send test email...')
  console.log('To:', testEmail)
  console.log('\n')

  try {
    const result = await sendTeamInvitationEmail(
      testEmail,
      schoolName,
      inviterName,
      role,
      token
    )

    if (result) {
      console.log('✓ Email sent successfully!')
      console.log('\nNote: In development mode, emails can only be sent to the Resend account owner email.')
      console.log('Check your Resend dashboard at https://resend.com/emails to verify.')
    } else {
      console.log('✗ Email failed to send')
    }
  } catch (error) {
    console.error('✗ Error sending email:', error)
  }
}

testEmail().catch(console.error)
