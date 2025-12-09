import { Resend } from 'resend'

// Lazy initialization to avoid build-time errors
let resend: Resend | null = null

function getResendClient(): Resend {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY)
  }
  if (!resend) {
    throw new Error('RESEND_API_KEY is not configured')
  }
  return resend
}

const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@kartis.info'
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9000'

interface EmailOptions {
  to: string
  subject: string
  html: string
}

/**
 * Send an email using Resend
 */
async function sendEmail({ to, subject, html }: EmailOptions): Promise<boolean> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured. Email not sent:', { to, subject })
      return false
    }

    const client = getResendClient()
    const { data, error } = await client.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    })

    if (error) {
      console.error('Resend API error:', error)
      return false
    }

    console.log('Email sent successfully:', {
      to,
      subject,
      emailId: data?.id,
      from: FROM_EMAIL
    })
    return true
  } catch (error) {
    console.error('Failed to send email:', error)
    return false
  }
}

/**
 * Send email verification email
 */
export async function sendVerificationEmail(email: string, token: string, name: string): Promise<boolean> {
  const verificationUrl = `${BASE_URL}/admin/verify-email?token=${token}`

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; direction: rtl;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Kartis</h1>
        <p style="color: #e0e7ff; margin: 10px 0 0;">מערכת ניהול כרטיסים</p>
      </div>

      <div style="background: #f7fafc; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #2d3748; margin-top: 0;">שלום ${name},</h2>
        <p style="font-size: 16px; color: #4a5568;">
          ברוך הבא ל-Kartis! אנחנו שמחים שהצטרפת אלינו.
        </p>
        <p style="font-size: 16px; color: #4a5568;">
          כדי להשלים את ההרשמה ולאמת את כתובת המייל שלך, לחץ על הכפתור למטה:
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}"
             style="background: #667eea; color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 16px;">
            אמת את המייל שלך
          </a>
        </div>

        <p style="font-size: 14px; color: #718096; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
          אם לא ביקשת את המייל הזה, אפשר להתעלם ממנו.
        </p>
        <p style="font-size: 14px; color: #718096;">
          הקישור תקף ל-24 שעות.
        </p>
        <p style="font-size: 12px; color: #a0aec0; margin-top: 20px;">
          אם הכפתור לא עובד, העתק והדבק את הכתובת הזאת לדפדפן:<br>
          <span style="word-break: break-all;">${verificationUrl}</span>
        </p>
      </div>
    </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: 'אימות כתובת מייל - Kartis',
    html,
  })
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, token: string, name: string): Promise<boolean> {
  const resetUrl = `${BASE_URL}/admin/reset-password?token=${token}`

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; direction: rtl;">
      <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Kartis</h1>
        <p style="color: #ffe0e7; margin: 10px 0 0;">איפוס סיסמה</p>
      </div>

      <div style="background: #f7fafc; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #2d3748; margin-top: 0;">שלום ${name},</h2>
        <p style="font-size: 16px; color: #4a5568;">
          קיבלנו בקשה לאיפוס הסיסמה שלך.
        </p>
        <p style="font-size: 16px; color: #4a5568;">
          לחץ על הכפתור למטה כדי ליצור סיסמה חדשה:
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}"
             style="background: #f5576c; color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 16px;">
            אפס סיסמה
          </a>
        </div>

        <p style="font-size: 14px; color: #718096; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
          <strong>לא ביקשת איפוס סיסמה?</strong> אפשר להתעלם מהמייל הזה. הסיסמה שלך תישאר ללא שינוי.
        </p>
        <p style="font-size: 14px; color: #718096;">
          הקישור תקף לשעה אחת בלבד.
        </p>
        <p style="font-size: 12px; color: #a0aec0; margin-top: 20px;">
          אם הכפתור לא עובד, העתק והדבק את הכתובת הזאת לדפדפן:<br>
          <span style="word-break: break-all;">${resetUrl}</span>
        </p>
      </div>
    </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: 'איפוס סיסמה - Kartis',
    html,
  })
}

/**
 * Send team invitation email
 */
export async function sendTeamInvitationEmail(
  email: string,
  schoolName: string,
  inviterName: string,
  role: string,
  token: string
): Promise<boolean> {
  const invitationUrl = `${BASE_URL}/admin/accept-invitation?token=${token}`

  const roleNames: Record<string, string> = {
    OWNER: 'בעלים',
    ADMIN: 'מנהל',
    MANAGER: 'מפעיל',
    VIEWER: 'צופה',
  }

  const roleName = roleNames[role] || role

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; direction: rtl;">
      <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Kartis</h1>
        <p style="color: #e0f7ff; margin: 10px 0 0;">הזמנה לצוות</p>
      </div>

      <div style="background: #f7fafc; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #2d3748; margin-top: 0;">שלום!</h2>
        <p style="font-size: 16px; color: #4a5568;">
          <strong>${inviterName}</strong> הזמין אותך להצטרף לצוות של <strong>${schoolName}</strong> ב-Kartis.
        </p>
        <p style="font-size: 16px; color: #4a5568;">
          תפקידך: <strong style="color: #667eea;">${roleName}</strong>
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${invitationUrl}"
             style="background: #4facfe; color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 16px;">
            קבל הזמנה
          </a>
        </div>

        <p style="font-size: 14px; color: #718096; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
          לא מכיר את השולח? אפשר להתעלם מהמייל הזה.
        </p>
        <p style="font-size: 14px; color: #718096;">
          ההזמנה תקפה ל-7 ימים.
        </p>
        <p style="font-size: 12px; color: #a0aec0; margin-top: 20px;">
          אם הכפתור לא עובד, העתק והדבק את הכתובת הזאת לדפדפן:<br>
          <span style="word-break: break-all;">${invitationUrl}</span>
        </p>
      </div>
    </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: `הזמנה לצוות ${schoolName} - Kartis`,
    html,
  })
}

/**
 * Send welcome email after verification
 */
export async function sendWelcomeEmail(email: string, name: string, schoolName: string): Promise<boolean> {
  const dashboardUrl = `${BASE_URL}/admin`

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; direction: rtl;">
      <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🎉 ברוך הבא!</h1>
        <p style="color: #d0f5e7; margin: 10px 0 0;">החשבון שלך מוכן</p>
      </div>

      <div style="background: #f7fafc; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #2d3748; margin-top: 0;">שלום ${name},</h2>
        <p style="font-size: 16px; color: #4a5568;">
          החשבון שלך עבור <strong>${schoolName}</strong> מוכן לשימוש!
        </p>
        <p style="font-size: 16px; color: #4a5568;">
          אתה יכול להתחיל ליצור אירועים ולנהל רישומים.
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${dashboardUrl}"
             style="background: #11998e; color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 16px;">
            עבור לדשבורד
          </a>
        </div>

        <div style="background: #edf2f7; padding: 20px; border-radius: 5px; margin-top: 30px;">
          <h3 style="color: #2d3748; margin-top: 0;">צעדים ראשונים:</h3>
          <ul style="color: #4a5568;">
            <li>צור את האירוע הראשון שלך</li>
            <li>התאם את העיצוב והלוגו של הארגון</li>
            <li>הזמן חברי צוות נוספים</li>
            <li>שתף את קישור הרישום עם המשתתפים</li>
          </ul>
        </div>

        <p style="font-size: 14px; color: #718096; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
          צריך עזרה? פנה אלינו בכל עת!
        </p>
      </div>
    </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: 'ברוך הבא ל-Kartis! 🎉',
    html,
  })
}
