export const breachNotificationTemplate = (
  userName: string,
  incidentType: string,
  dataTypes: string[],
  detectedAt: Date
) => `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>הודעה על אירוע אבטחת מידע</title>
</head>
<body style="font-family: Arial, sans-serif; direction: rtl; background-color: #f5f5f5; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <h1 style="margin: 0; font-size: 24px;">⚠️ הודעה על אירוע אבטחת מידע</h1>
    </div>

    <!-- Greeting -->
    <p style="font-size: 16px; color: #333;">שלום ${userName},</p>

    <!-- Main Message -->
    <p style="font-size: 14px; line-height: 1.6; color: #555;">
      בהתאם לתיקון 13 לחוק הגנת הפרטיות, התשמ״א-1981, אנו מודיעים לך על אירוע אבטחת מידע שזוהה במערכת שלנו ביום <strong>${detectedAt.toLocaleDateString('he-IL')}</strong>.
    </p>

    <!-- What Happened -->
    <div style="background-color: #fef2f2; border-right: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <h3 style="margin-top: 0; color: #dc2626;">מה קרה?</h3>
      <p style="margin: 10px 0; color: #555;">
        סוג האירוע: <strong>${incidentType}</strong>
      </p>
      <p style="margin: 0; color: #555;">
        זוהתה גישה לא מורשית למידע הבא:
      </p>
      <ul style="margin: 10px 0; padding-right: 20px; color: #555;">
        ${dataTypes.map((type) => `<li>${type}</li>`).join('')}
      </ul>
    </div>

    <!-- What We Did -->
    <div style="background-color: #f0fdf4; border-right: 4px solid #16a34a; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <h3 style="margin-top: 0; color: #16a34a;">מה עשינו?</h3>
      <ul style="margin: 0; padding-right: 20px; color: #555;">
        <li>זיהינו וסגרנו את פרצת האבטחה מיידית</li>
        <li>דיווחנו לרשות להגנת הפרטיות בהתאם לחוק</li>
        <li>שדרגנו את מערכות האבטחה שלנו</li>
        <li>ביצענו בדיקת אבטחה מקיפה</li>
      </ul>
    </div>

    <!-- What You Should Do -->
    <div style="background-color: #eff6ff; border-right: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <h3 style="margin-top: 0; color: #3b82f6;">מה כדאי שתעשה?</h3>
      <ul style="margin: 0; padding-right: 20px; color: #555;">
        <li>החלף את הסיסמה שלך במערכת</li>
        <li>בחר סיסמה חזקה (12+ תווים, אותיות גדולות/קטנות, ספרות, תווים מיוחדים)</li>
        <li>עקוב אחר פעילות חשודה בחשבון שלך</li>
        <li>אל תשתף את הסיסמה החדשה עם אף אחד</li>
      </ul>
    </div>

    <!-- Contact -->
    <div style="background-color: #f9fafb; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <h3 style="margin-top: 0; color: #333;">יצירת קשר</h3>
      <p style="margin: 5px 0; color: #555;">
        לשאלות או חששות בנושא הגנת הפרטיות:
      </p>
      <p style="margin: 5px 0;">
        <strong>קצין הגנת המידע:</strong>
        <a href="mailto:privacy@ticketcap.co.il" style="color: #3b82f6;">privacy@ticketcap.co.il</a>
      </p>
    </div>

    <!-- Footer -->
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px;">
      <p>TicketCap - מערכת ניהול אירועים מאובטחת</p>
      <p>הודעה זו נשלחה בהתאם לתיקון 13 לחוק הגנת הפרטיות, התשמ״א-1981</p>
    </div>

  </div>
</body>
</html>
`

export const ppaBreachNotificationTemplate = (
  breachId: string,
  schoolName: string,
  incidentType: string,
  severity: string,
  affectedUsers: number,
  dataTypes: string[],
  detectedAt: Date,
  description: string
) => `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <title>דיווח לרשות להגנת הפרטיות - אירוע אבטחה</title>
</head>
<body style="font-family: Arial, sans-serif; direction: rtl;">
  <h1>דיווח על אירוע אבטחת מידע</h1>

  <h2>פרטי הארגון</h2>
  <p><strong>שם:</strong> TicketCap - ${schoolName}</p>
  <p><strong>קצין הגנת מידע:</strong> privacy@ticketcap.co.il</p>

  <h2>פרטי האירוע</h2>
  <p><strong>מזהה אירוע:</strong> ${breachId}</p>
  <p><strong>תאריך זיהוי:</strong> ${detectedAt.toLocaleDateString('he-IL')} ${detectedAt.toLocaleTimeString('he-IL')}</p>
  <p><strong>סוג אירוע:</strong> ${incidentType}</p>
  <p><strong>חומרה:</strong> ${severity}</p>
  <p><strong>מספר משתמשים מושפעים:</strong> ${affectedUsers}</p>

  <h3>סוגי מידע שנחשפו:</h3>
  <ul>
    ${dataTypes.map((type) => `<li>${type}</li>`).join('')}
  </ul>

  <h3>תיאור האירוע:</h3>
  <p>${description}</p>

  <h3>צעדים שננקטו:</h3>
  <ul>
    <li>זיהוי וסגירת פרצת האבטחה</li>
    <li>שדרוג מערכות האבטחה</li>
    <li>הודעה למשתמשים המושפעים</li>
    <li>בדיקת אבטחה מקיפה</li>
  </ul>

  <p style="margin-top: 30px; font-size: 12px; color: #666;">
    דיווח זה נשלח בהתאם לתיקון 13 לחוק הגנת הפרטיות, התשמ״א-1981, סעיף 19א
  </p>
</body>
</html>
`
