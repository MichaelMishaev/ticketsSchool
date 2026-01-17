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
  const verificationUrl = `${BASE_URL}/api/admin/verify-email?token=${token}`

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
 * Send registration confirmation email with QR code
 */
export async function sendRegistrationConfirmationEmail(
  email: string,
  data: {
    name: string
    eventName: string
    eventDate: string
    eventLocation?: string
    confirmationCode: string
    qrCodeImage: string // base64 data URL
    status: 'CONFIRMED' | 'WAITLIST'
    schoolName: string
    cancellationUrl?: string
  }
): Promise<boolean> {
  const statusText = data.status === 'WAITLIST' ? 'רשימת המתנה' : 'אושרה'
  const statusColor = data.status === 'WAITLIST' ? '#f59e0b' : '#10b981'
  const statusEmoji = data.status === 'WAITLIST' ? '⏳' : '✅'

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; direction: rtl;">
      <div style="background: linear-gradient(135deg, ${statusColor} 0%, ${statusColor}dd 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">${statusEmoji} ההרשמה ${statusText}</h1>
        <p style="color: #ffffffdd; margin: 10px 0 0;">${data.schoolName}</p>
      </div>

      <div style="background: #f7fafc; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #2d3748; margin-top: 0;">שלום ${data.name},</h2>
        <p style="font-size: 16px; color: #4a5568;">
          ${data.status === 'WAITLIST'
            ? 'נרשמת בהצלחה לרשימת ההמתנה לאירוע <strong>' + data.eventName + '</strong>.'
            : 'נרשמת בהצלחה לאירוע <strong>' + data.eventName + '</strong>!'}
        </p>

        <div style="background: white; border: 2px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #2d3748;">📅 פרטי האירוע</h3>
          <p style="margin: 8px 0;"><strong>שם האירוע:</strong> ${data.eventName}</p>
          <p style="margin: 8px 0;"><strong>תאריך ושעה:</strong> ${data.eventDate}</p>
          ${data.eventLocation ? `<p style="margin: 8px 0;"><strong>מיקום:</strong> ${data.eventLocation}</p>` : ''}
          <p style="margin: 8px 0;"><strong>קוד אישור:</strong> <span style="font-family: monospace; font-size: 20px; font-weight: bold; color: ${statusColor};">${data.confirmationCode}</span></p>
        </div>

        <div style="background: white; border: 3px solid ${statusColor}; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
          <h3 style="margin-top: 0; color: #2d3748;">📱 QR לכניסה לאירוע</h3>
          <p style="font-size: 14px; color: #4a5568; margin-bottom: 15px;">
            ${data.status === 'WAITLIST'
              ? 'שמור קוד זה - אם יתפנה מקום תוכל להיכנס עם QR זה'
              : 'הצג קוד זה בכניסה לאירוע'}
          </p>
          <img src="${data.qrCodeImage}" alt="QR Code" style="width: 250px; height: 250px; border: 4px solid #e2e8f0; border-radius: 8px; display: block; margin: 0 auto;" />
          <p style="font-size: 12px; color: #718096; margin-top: 15px;">
            מומלץ לשמור תמונה זו או להציג אותה ישירות מהמייל בכניסה
          </p>
        </div>

        ${data.status === 'WAITLIST'
          ? `<div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e; font-weight: bold;">
                ⏳ נמצא ברשימת המתנה
              </p>
              <p style="margin: 10px 0 0; color: #78350f;">
                אם יתפנה מקום באירוע, נעדכן אותך באמצעות פרטי הקשר שהזנת.
              </p>
            </div>`
          : `<div style="background: #d1fae5; border: 2px solid #10b981; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #065f46; font-weight: bold;">
                ✅ המקום שלך נשמר!
              </p>
              <p style="margin: 10px 0 0; color: #047857;">
                נתראה באירוע! אל תשכח להציג את קוד ה-QR בכניסה.
              </p>
            </div>`
        }

        ${data.cancellationUrl
          ? `<div style="text-align: center; margin: 20px 0;">
              <a href="${data.cancellationUrl}" style="color: #dc2626; text-decoration: underline; font-size: 14px;">
                לביטול ההרשמה לחץ כאן
              </a>
            </div>`
          : ''
        }

        <p style="font-size: 14px; color: #718096; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
          אם לא ביקשת הרשמה זו, אפשר להתעלם ממייל זה.
        </p>
      </div>
    </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: `${statusEmoji} ${data.status === 'WAITLIST' ? 'רשימת המתנה' : 'אישור הרשמה'} - ${data.eventName}`,
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

/**
 * Send overbooking alert email to admin
 * Called when someone tries to promote from waitlist but event is full
 */
export async function sendOverbookingAlertEmail(params: {
  adminEmail: string
  adminName: string
  eventName: string
  eventId: string
  capacity: number
  currentConfirmed: number
  attemptedSpots: number
  registrantName: string
  registrantPhone: string
}): Promise<boolean> {
  const {
    adminEmail,
    adminName,
    eventName,
    eventId,
    capacity,
    currentConfirmed,
    attemptedSpots,
    registrantName,
    registrantPhone,
  } = params

  const eventUrl = `${BASE_URL}/admin/events/${eventId}?tab=registrations`
  const overbookAmount = (currentConfirmed + attemptedSpots) - capacity

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; direction: rtl;">
      <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">⚠️ התראת חריגה מתפוסה</h1>
        <p style="color: #fecaca; margin: 10px 0 0;">נחסמה הרשמה שהייתה גורמת לחריגה</p>
      </div>

      <div style="background: #f7fafc; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #2d3748; margin-top: 0;">שלום ${adminName},</h2>
        <p style="font-size: 16px; color: #4a5568;">
          בוצע ניסיון לאשר הרשמה מרשימת ההמתנה, אך הפעולה נחסמה מכיוון שהייתה גורמת לחריגה מתפוסת האירוע.
        </p>

        <div style="background: #fee2e2; border: 2px solid #dc2626; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #7f1d1d;">🚨 פרטי הניסיון</h3>
          <p style="margin: 8px 0;"><strong>אירוע:</strong> ${eventName}</p>
          <p style="margin: 8px 0;"><strong>תפוסה מקסימלית:</strong> ${capacity}</p>
          <p style="margin: 8px 0;"><strong>מאושרים כרגע:</strong> ${currentConfirmed}</p>
          <p style="margin: 8px 0;"><strong>מקומות שהתבקשו:</strong> ${attemptedSpots}</p>
          <p style="margin: 8px 0; color: #dc2626; font-weight: bold;">חריגה שנמנעה: ${overbookAmount} מקומות</p>
        </div>

        <div style="background: white; border: 2px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #2d3748;">👤 פרטי הנרשם</h3>
          <p style="margin: 8px 0;"><strong>שם:</strong> ${registrantName}</p>
          <p style="margin: 8px 0;"><strong>טלפון:</strong> ${registrantPhone}</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${eventUrl}"
             style="background: #dc2626; color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 16px;">
            צפה באירוע
          </a>
        </div>

        <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; color: #1e40af; font-size: 14px;">
            <strong>💡 מה לעשות?</strong><br>
            • בדוק אם יש הרשמות מבוטלות שאפשר למחוק<br>
            • שקול להגדיל את תפוסת האירוע<br>
            • צור קשר עם הנרשם להסביר את המצב
          </p>
        </div>

        <p style="font-size: 12px; color: #718096; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; text-align: center;">
          התראה זו נשלחה אוטומטית ממערכת Kartis
        </p>
      </div>
    </body>
    </html>
  `

  return sendEmail({
    to: adminEmail,
    subject: `⚠️ התראת חריגה מתפוסה - ${eventName}`,
    html,
  })
}

/**
 * Send payment invoice email
 */
export async function sendPaymentInvoiceEmail(params: {
  to: string
  eventTitle: string
  eventDate: string
  eventLocation: string
  amount: number
  currency: string
  paymentLink: string
  customerName: string
  confirmationCode: string
  dueDate?: string
}): Promise<boolean> {
  const {
    to,
    eventTitle,
    eventDate,
    eventLocation,
    amount,
    currency,
    paymentLink,
    customerName,
    confirmationCode,
    dueDate,
  } = params

  const currencySymbol = currency === 'ILS' || currency === 'NIS' ? '₪' : currency
  const formattedAmount = `${currencySymbol}${amount.toFixed(2)}`

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; direction: rtl;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">💳 חשבונית לתשלום</h1>
        <p style="color: #d1fae5; margin: 10px 0 0;">Kartis - מערכת ניהול כרטיסים</p>
      </div>

      <div style="background: #f7fafc; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #2d3748; margin-top: 0;">שלום ${customerName},</h2>
        <p style="font-size: 16px; color: #4a5568;">
          נרשמת בהצלחה לאירוע <strong>${eventTitle}</strong>
        </p>

        <div style="background: white; border: 2px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #2d3748;">📅 פרטי האירוע</h3>
          <p style="margin: 8px 0;"><strong>שם האירוע:</strong> ${eventTitle}</p>
          <p style="margin: 8px 0;"><strong>תאריך ושעה:</strong> ${eventDate}</p>
          <p style="margin: 8px 0;"><strong>מיקום:</strong> ${eventLocation}</p>
          <p style="margin: 8px 0;"><strong>קוד אישור:</strong> <span style="font-family: monospace; font-size: 18px; font-weight: bold; color: #10b981;">${confirmationCode}</span></p>
        </div>

        <div style="background: #fef3c7; border: 3px solid #f59e0b; border-radius: 8px; padding: 25px; margin: 25px 0; text-align: center;">
          <h3 style="margin-top: 0; color: #92400e; font-size: 20px;">💰 סכום לתשלום</h3>
          <p style="font-size: 36px; font-weight: bold; color: #78350f; margin: 15px 0;">
            ${formattedAmount}
          </p>
          ${dueDate
            ? `<p style="margin: 10px 0 0; color: #92400e; font-size: 14px;">
                ⏰ אנא שלם תוך 24 שעות (עד ${dueDate})
              </p>`
            : ''
          }
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${paymentLink}"
             style="background: #10b981; color: white; padding: 18px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 20px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            לתשלום ←
          </a>
        </div>

        ${dueDate
          ? `<div style="background: #fee2e2; border: 2px solid #dc2626; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #7f1d1d; font-weight: bold;">
                ⚠️ תשלום נדרש
              </p>
              <p style="margin: 10px 0 0; color: #991b1b; font-size: 14px;">
                אנא השלם את התשלום במהירות האפשרית כדי לשמור על הרישום שלך. לאחר 24 שעות הרישום עשוי להתבטל.
              </p>
            </div>`
          : `<div style="background: #dbeafe; border: 2px solid #3b82f6; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #1e3a8a; font-weight: bold;">
                ℹ️ השלם תשלום
              </p>
              <p style="margin: 10px 0 0; color: #1e40af; font-size: 14px;">
                לחץ על כפתור התשלום כדי להשלים את ההרשמה שלך לאירוע.
              </p>
            </div>`
        }

        <div style="background: #e0f2fe; border-left: 4px solid #0284c7; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; color: #0c4a6e; font-size: 14px;">
            <strong>💡 טיפ:</strong> לאחר ביצוע התשלום תקבל אישור נוסף עם QR לכניסה לאירוע.
          </p>
        </div>

        <p style="font-size: 14px; color: #718096; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
          אם לא ביקשת הרשמה זו, אפשר להתעלם ממייל זה.
        </p>
        <p style="font-size: 12px; color: #a0aec0; margin-top: 15px; text-align: center;">
          Kartis - מערכת ניהול כרטיסים מתקדמת
        </p>
      </div>
    </body>
    </html>
  `

  return sendEmail({
    to,
    subject: `חשבונית לתשלום - ${eventTitle}`,
    html,
  })
}
