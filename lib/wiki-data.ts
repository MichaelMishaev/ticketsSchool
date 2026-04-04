// Wiki Data Structure for Help/Documentation System

export type UserRole = 'SUPER_ADMIN' | 'OWNER' | 'ADMIN' | 'MANAGER' | 'VIEWER' | 'ALL'
export type FeatureType = 'NEW' | 'UPDATED' | 'CORE' | 'ADVANCED' | 'BETA'
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced'

export interface WikiFeature {
  id: string
  title: string
  titleHe: string
  description: string
  descriptionHe: string
  category: string
  type: FeatureType
  roles: UserRole[]
  difficulty: DifficultyLevel
  keywords: string[]
  content: string
  contentHe: string
  examples?: {
    title: string
    titleHe: string
    code?: string
    description: string
    descriptionHe: string
  }[]
  relatedFeatures?: string[]
  videoUrl?: string
  lastUpdated: string
}

export interface WikiCategory {
  id: string
  name: string
  nameHe: string
  icon: string
  description: string
  descriptionHe: string
  color: string
  features: WikiFeature[]
  order: number
}

// Wiki data
export const wikiCategories: WikiCategory[] = [
  {
    id: 'getting-started',
    name: 'Getting Started',
    nameHe: 'התחלה מהירה',
    icon: 'Rocket',
    description: 'Quick start guide and tutorials',
    descriptionHe: 'מדריך התחלה מהירה ומדריכים',
    color: 'blue',
    order: 0,
    features: [
      {
        id: 'quick-start',
        title: 'Quick Start Guide',
        titleHe: 'מדריך התחלה מהירה',
        description: 'Get started in 5 minutes',
        descriptionHe: 'התחל לעבוד תוך 5 דקות',
        category: 'getting-started',
        type: 'CORE',
        roles: ['ALL'],
        difficulty: 'beginner',
        keywords: ['start', 'begin', 'tutorial', 'התחלה', 'מדריך'],
        lastUpdated: '2026-01-10',
        content: `# Quick Start Guide\n\nWelcome to TicketCap! Follow these steps to create your first event:\n\n1. Sign up for a free account\n2. Complete the onboarding wizard\n3. Create your first event\n4. Share the registration link\n5. Track registrations in real-time`,
        contentHe: `# מדריך התחלה מהירה\n\nברוכים הבאים ל-TicketCap! עקבו אחר השלבים הבאים כדי ליצור את האירוע הראשון שלכם:\n\n1. הירשמו לחשבון חינמי\n2. השלימו את אשף ההתקנה\n3. צרו את האירוע הראשון\n4. שתפו את קישור ההרשמה\n5. עקבו אחר ההרשמות בזמן אמת`,
        examples: [
          {
            title: 'Create Your First Event',
            titleHe: 'צרו את האירוע הראשון',
            description: 'Step-by-step example',
            descriptionHe: 'דוגמה שלב אחר שלב',
          }
        ]
      }
    ]
  },
  {
    id: 'event-management',
    name: 'Event Management',
    nameHe: 'ניהול אירועים',
    icon: 'Calendar',
    description: 'Create and manage basic events',
    descriptionHe: 'יצירה וניהול אירועים בסיסיים',
    color: 'purple',
    order: 1,
    features: [
      {
        id: 'create-event',
        title: 'How to Create Your First Event',
        titleHe: 'איך ליצור את האירוע הראשון שלך',
        description: 'Step-by-step guide to creating events like soccer matches, workshops, and concerts',
        descriptionHe: 'מדריך שלב-אחר-שלב ליצירת אירועים כמו משחקי כדורגל, סדנאות וקונצרטים',
        category: 'event-management',
        type: 'CORE',
        roles: ['ADMIN', 'OWNER'],
        difficulty: 'beginner',
        keywords: ['create', 'event', 'new', 'capacity', 'יצירה', 'אירוע', 'חדש', 'קיבולת'],
        lastUpdated: '2026-01-10',
        content: `# How to Create Your First Event

You're organizing a Saturday soccer match for 100 players. Here's how to set it up in 5 minutes.

## Quick Setup

**Create the event:**
- Click "אירוע חדש" → Name it "משחק כדורגל - שבת"
- Set date/time: Saturday 10:00 AM
- Set capacity: 100 players
- Click "Create" → Get registration link

**Share & manage:**
- Copy the link → Send via WhatsApp
- Players register online in 30 seconds
- Dashboard shows: "23/100 registered"
- When full (100 people) → Automatic waitlist

**Event day:**
Open dashboard → See who's coming → You're ready!

## Use this for:
⚽ Sports • 🎓 Workshops • 🎵 Concerts • 🎉 Open seating events

**Don't use for:** Weddings or formal dinners (need table assignments - use Table Events instead)`,
        contentHe: `# איך ליצור אירוע ראשון

אתם מארגנים משחק כדורגל בשבת ל-100 שחקנים. כך מקימים אירוע ב-5 דקות.

## הקמת אירוע

**יצירה:**
- לחצו "אירוע חדש" → הקלידו שם "משחק כדורגל - שבת"
- הגדירו תאריך ושעה: שבת 10:00
- הגדירו קיבולת: 100 שחקנים
- לחצו "צור" → קבלו קישור הרשמה

**שיתוף וניהול:**
- העתיקו קישור → שלחו בווטסאפ
- שחקנים נרשמים תוך 30 שניות
- הדשבורד מציג: "23/100 נרשמו"
- כשמתמלא (100 איש) → רשימת המתנה אוטומטית

**ביום האירוע:**
פתחו דשבורד → ראו מי מגיע → אתם מוכנים!

## מתאים ל:
⚽ ספורט • 🎓 סדנאות • 🎵 קונצרטים • 🎉 אירועים עם הושבה חופשית

**לא מתאים ל:** חתונות או ארוחות ערב רשמיות (צריך שיוך שולחנות - השתמשו באירועי שולחנות)`,
        examples: [
          {
            title: 'Complete Soccer Match Workflow',
            titleHe: 'תהליך מלא של משחק כדורגל',
            description: 'See exactly what you click, what happens, and what players see',
            descriptionHe: 'ראו בדיוק על מה אתם לוחצים, מה קורה, ומה השחקנים רואים',
          }
        ],
        relatedFeatures: ['edit-event', 'check-in-system']
      },
      {
        id: 'edit-event',
        title: 'Fix Your Mistake in 30 Seconds - The Wrong Date Story',
        titleHe: 'תקן את הטעות שלך ב-30 שניות - סיפור התאריך הלא נכון',
        description: 'What happens when you create an event for the wrong date? How to fix it without starting over',
        descriptionHe: 'מה קורה כשיוצרים אירוע לתאריך הלא נכון? איך לתקן בלי להתחיל מחדש',
        category: 'event-management',
        type: 'CORE',
        roles: ['ADMIN', 'OWNER'],
        difficulty: 'beginner',
        keywords: ['edit', 'modify', 'update', 'fix', 'mistake', 'עריכה', 'שינוי', 'עדכון', 'תיקון', 'טעות'],
        lastUpdated: '2026-01-10',
        content: `# Fix Your Mistake in 30 Seconds - The Wrong Date Story

**Meet Rachel - Soccer Club Manager:**

"It's Tuesday morning. I just created Saturday's soccer match event. Spent 20 minutes setting everything up perfectly:
- Created the event
- Set capacity to 100 players
- Wrote the description
- Added custom fields for player positions
- Shared the registration link with 200 people on WhatsApp

Then my phone rings. It's the field owner:

'Rachel, the field is NOT available Saturday. Only Sunday.'

I stare at my screen in horror. The event says Saturday. 50 people already registered. Do I have to delete everything and start over? 😱"

## The Old Way (Nightmare!)

❌ **Starting from scratch:**
1. Delete the Saturday event (lose all 50 registrations!)
2. Create a new Sunday event (another 20 minutes)
3. Copy all the settings manually
4. Send new link to everyone
5. Everyone has to register AGAIN
6. Total disaster: 40 minutes wasted + angry people

## The New Way (30 seconds!)

✅ **Edit the existing event:**
1. Open the event
2. Click "Edit Event" button
3. Change Saturday → Sunday
4. Click "Save"
5. System automatically notifies all 50 registered people about the date change
6. **Done in 30 seconds!**

## The Complete Workflow

**Step 1: You realize the mistake**
- "Oh no, I created the event for the wrong date!"
- Don't panic, don't delete anything
- Open the event in your dashboard

**Step 2: Click "Edit Event"**
- You see a button at top right: "✏️ Edit Event"
- Click it
- Edit page opens with all current settings

**Step 3: Fix what needs fixing**
- Change the date from Saturday to Sunday
- Change the time if needed
- Change location if needed
- Change anything else you want
- Leave everything else as-is

**Step 4: Save and notify**
- Click "Save Changes" button
- System asks: "Send notification to registered users about date change?"
- Click "Yes, notify them"
- System automatically emails all 50 registered people:
  - "Date changed: Saturday → Sunday"
  - Link to updated event details
  - Option to cancel if they can't make it

**Step 5: Celebrate!**
- ✅ Event fixed in 30 seconds
- ✅ All 50 registrations preserved
- ✅ Everyone notified automatically
- ✅ You saved 39.5 minutes + avoided massive headache!

## What You Can Edit

**Always safe to edit:**
- ✅ Event name and description
- ✅ Date and time
- ✅ Location
- ✅ Registration deadline
- ✅ Custom registration fields
- ✅ Terms and conditions
- ✅ Completion message
- ✅ Event images

**Need to be careful:**
- ⚠️ **Capacity** - Can't reduce below current registrations
- ⚠️ **Status** - Closing event stops new registrations

## Real Scenarios

### Scenario 1: Wrong Location

**The problem:**
- Created event at "North Field"
- Actually it's at "South Field"
- 30 people already registered

**The panic:**
- "Everyone will go to the wrong field!"

**The solution:**
1. Click "Edit Event"
2. Change location: "North Field" → "South Field"
3. Save + Notify users
4. System emails everyone: "Location changed to South Field"
5. **Fixed in 20 seconds!**

### Scenario 2: Need More Capacity

**The problem:**
- Created event with 100 spots
- 98 people registered in first hour
- Phone ringing: "Can we add more spots?"

**The old way:**
- "Sorry, event is full!" (turn people away)

**The new way:**
1. Click "Edit Event"
2. Change capacity: 100 → 150
3. Save
4. System automatically accepts next 50 registrations
5. **Fixed in 15 seconds!**

**Rachel's story:**
"100 spots filled in 1 hour. I increased to 150. All 150 spots filled in 2 hours. I increased to 200. Final count: 187 registered! Without edit feature, I would have turned away 87 people."

### Scenario 3: Typo in Description

**The problem:**
- Event description says "משחק כדורגל - שבת 10:00"
- Should be 11:00, not 10:00
- 20 people registered

**The fix:**
1. Edit Event → Change 10:00 to 11:00 → Save
2. System asks: "Notify users?"
3. Click "Yes"
4. Everyone gets email: "Time updated to 11:00"
5. **No one shows up at wrong time!**

### Scenario 4: Emergency Pause

**The problem:**
Friday afternoon, Saturday's soccer match:
- Weather forecast: Heavy rain
- Need to check if field owner allows play in rain
- But registrations are still coming in
- Don't want to cancel yet (might still happen)

**The solution:**
1. Click "Edit Event"
2. Change status: OPEN → PAUSED
3. Save
4. Registration link now shows: "Registration temporarily paused"
5. You call field owner, get answer
6. If yes: Change status back to OPEN
7. If no: Change status to CLOSED and send cancellation email

**Time saved:** Made decision in calm way, didn't accidentally get 50 more registrations while figuring it out

## Capacity Changes - The Smart Way

**Increasing capacity:**
- ✅ Always safe!
- ✅ No warnings needed
- ✅ Just increase and save

**Decreasing capacity:**

**Safe decrease:**
- Current: 100 spots, 50 registered
- Change to: 80 spots
- ✅ System says: "OK! 50 registered < 80 capacity"
- Change accepted

**Dangerous decrease:**
- Current: 100 spots, 85 registered
- Try to change to: 70 spots
- ❌ System blocks: "Cannot reduce to 70! You have 85 confirmed registrations"
- Options:
  1. Keep capacity at 100
  2. Cancel some registrations first (manually)
  3. Set to 85 (minimum allowed)

**Protection feature:**
You cannot accidentally kick out confirmed registrants by reducing capacity!

## Status Control

**Three states:**

**OPEN (זמין):**
- Green color
- Registration link works
- People can register
- Default state

**PAUSED (מושהה):**
- Yellow color
- Registration link shows: "Registration temporarily paused"
- No new registrations accepted
- Use when: Need time to decide, checking something, temporarily full

**CLOSED (סגור):**
- Red color
- Registration link shows: "Registration closed"
- No new registrations
- Use when: Event happened, cancelled, or permanently full

## Common Questions

**Q: If I change the date, do people have to register again?**
A: No! All registrations stay. System just notifies them of the change.

**Q: What if someone can't make the new date?**
A: They receive email with cancellation link. They can cancel their registration.

**Q: Can I edit after the event happened?**
A: Yes, but only for record-keeping. Registration is automatically closed after event date passes.

**Q: What if I accidentally delete important text?**
A: No undo button, but you can re-type it. System doesn't auto-save until you click "Save Changes".

**Q: How do I notify people about changes?**
A: System asks after you save: "Notify registered users?" Click yes and everyone gets email.

## Time Saved - Real Numbers

**Rachel's soccer club (monthly):**
- 8 events per month
- Average 1-2 edits per event (date changes, capacity increases, typos)
- Without edit: Delete + recreate = 20 min × 2 × 8 = 5.3 hours/month
- With edit: 30 seconds × 2 × 8 = 8 minutes/month
- **Monthly savings: 5.2 hours!**

**What Rachel does with saved time:**
- Actually coaches the kids
- Organizes better tournaments
- Responds to parents' questions
- Goes home on time 🎉

## Success Stories

**David's wedding hall:**
"Client called at 10 PM: 'Can we add 20 more seats?'
Before edit feature: 'Sorry, too late, event is full'
After edit feature: Opened my phone, clicked edit, increased capacity 40→60, saved. Done in 30 seconds. Client happy, I got 20 more paid seats!"

**Maya's community center:**
"Wrong date FIVE times in one month (I know, I know...). Each time: Edit → Change date → Notify → Done. 2.5 minutes total. Without edit feature, would have spent 1.5 hours recreating events + lost hundreds of registrations."

**Eli's concert venue:**
"Artist's manager calls: 'Show starts 8 PM now, not 7 PM'
1,200 people already have tickets.
Edit event → Change time → Notify 1,200 people → Done in 40 seconds.
Imagine calling 1,200 people... 😱"

---

**The bottom line:** Mistakes happen. The edit feature turns "Oh no, I have to start over!" into "Fixed in 30 seconds!" Save hours, keep your registrations, notify everyone automatically.`,
        contentHe: `# תקן את הטעות שלך ב-30 שניות - סיפור התאריך הלא נכון

**הכירו את רחל - מנהלת מועדון כדורגל:**

"זה יום שלישי בבוקר. הרגע יצרתי את אירוע משחק הכדורגל של השבת. ביליתי 20 דקות בהגדרת הכל בצורה מושלמת:
- יצרתי את האירוע
- קבעתי קיבולת ל-100 שחקנים
- כתבתי את התיאור
- הוספתי שדות מותאמים אישית לתפקידי השחקנים
- שיתפתי את קישור ההרשמה עם 200 אנשים בווטסאפ

ואז הטלפון שלי מצלצל. זה בעל המגרש:

'רחל, המגרש לא זמין בשבת. רק ביום ראשון.'

אני בוהה במסך שלי באימה. האירוע כתוב שבת. 50 אנשים כבר נרשמו. האם אני צריכה למחוק הכל ולהתחיל מחדש? 😱"

## הדרך הישנה (סיוט!)

❌ **התחלה מאפס:**
1. מחק את אירוע השבת (תאבד את כל 50 ההרשמות!)
2. צור אירוע חדש ליום ראשון (עוד 20 דקות)
3. העתק את כל ההגדרות ידנית
4. שלח קישור חדש לכולם
5. כולם צריכים להירשם שוב
6. אסון מוחלט: 40 דקות בזבוז + אנשים כועסים

## הדרך החדשה (30 שניות!)

✅ **ערוך את האירוע הקיים:**
1. פתח את האירוע
2. לחץ על כפתור "ערוך אירוע"
3. שנה שבת → ראשון
4. לחץ על "שמור"
5. המערכת מודיעה אוטומטית לכל 50 הנרשמים על שינוי התאריך
6. **סיימת ב-30 שניות!**

## התהליך המלא

**שלב 1: אתה מבין את הטעות**
- "אוי לא, יצרתי את האירוע לתאריך הלא נכון!"
- אל תיבהל, אל תמחק כלום
- פתח את האירוע בלוח הבקרה שלך

**שלב 2: לחץ על "ערוך אירוע"**
- אתה רואה כפתור בפינה הימנית העליונה: "✏️ ערוך אירוע"
- לחץ עליו
- דף העריכה נפתח עם כל ההגדרות הנוכחיות

**שלב 3: תקן מה שצריך תיקון**
- שנה את התאריך משבת לראשון
- שנה את השעה אם צריך
- שנה מיקום אם צריך
- שנה כל דבר אחר שאתה רוצה
- השאר את כל השאר כמו שזה

**שלב 4: שמור והודע**
- לחץ על כפתור "שמור שינויים"
- המערכת שואלת: "לשלוח הודעה למשתמשים רשומים על שינוי התאריך?"
- לחץ על "כן, הודע להם"
- המערכת שולחת אוטומטית מייל לכל 50 הנרשמים:
  - "תאריך השתנה: שבת → ראשון"
  - קישור לפרטי האירוע המעודכנים
  - אפשרות לבטל אם הם לא יכולים להגיע

**שלב 5: חגוג!**
- ✅ אירוע תוקן ב-30 שניות
- ✅ כל 50 ההרשמות נשמרו
- ✅ כולם קיבלו הודעה אוטומטית
- ✅ חסכת 39.5 דקות + נמנעת מכאב ראש עצום!

## מה אפשר לערוך

**תמיד בטוח לערוך:**
- ✅ שם ותיאור האירוע
- ✅ תאריך ושעה
- ✅ מיקום
- ✅ מועד אחרון להרשמה
- ✅ שדות הרשמה מותאמים אישית
- ✅ תנאים והגבלות
- ✅ הודעת השלמה
- ✅ תמונות האירוע

**צריך להיות זהיר:**
- ⚠️ **קיבולת** - לא יכול להפחית מתחת להרשמות נוכחיות
- ⚠️ **סטטוס** - סגירת אירוע עוצרת הרשמות חדשות

## תרחישים אמיתיים

### תרחיש 1: מיקום לא נכון

**הבעיה:**
- יצרת אירוע ב"מגרש צפון"
- בעצם זה ב"מגרש דרום"
- 30 אנשים כבר נרשמו

**הפאניקה:**
- "כולם יגיעו למגרש הלא נכון!"

**הפתרון:**
1. לחץ על "ערוך אירוע"
2. שנה מיקום: "מגרש צפון" → "מגרש דרום"
3. שמור + הודע למשתמשים
4. המערכת שולחת מייל לכולם: "מיקום השתנה למגרש דרום"
5. **תוקן ב-20 שניות!**

### תרחיש 2: צריך יותר קיבולת

**הבעיה:**
- יצרת אירוע עם 100 מקומות
- 98 אנשים נרשמו בשעה הראשונה
- הטלפון מצלצל: "אפשר להוסיף עוד מקומות?"

**הדרך הישנה:**
- "מצטער, האירוע מלא!" (לסרב לאנשים)

**הדרך החדשה:**
1. לחץ על "ערוך אירוע"
2. שנה קיבולת: 100 → 150
3. שמור
4. המערכת אוטומטית מקבלת את 50 ההרשמות הבאות
5. **תוקן ב-15 שניות!**

**סיפור רחל:**
"100 מקומות התמלאו בשעה. הגדלתי ל-150. כל 150 המקומות התמלאו ב-2 שעות. הגדלתי ל-200. ספירה סופית: 187 נרשמו! בלי תכונת העריכה, הייתי מסרבת ל-87 אנשים."

### תרחיש 3: שגיאת כתיב בתיאור

**הבעיה:**
- תיאור האירוע אומר "משחק כדורגל - שבת 10:00"
- צריך להיות 11:00, לא 10:00
- 20 אנשים נרשמו

**התיקון:**
1. ערוך אירוע → שנה 10:00 ל-11:00 → שמור
2. המערכת שואלת: "להודיע למשתמשים?"
3. לחץ על "כן"
4. כולם מקבלים מייל: "שעה עודכנה ל-11:00"
5. **אף אחד לא מגיע בשעה הלא נכונה!**

### תרחיש 4: השהיה חירום

**הבעיה:**
יום שישי אחר הצהריים, משחק כדורגל של שבת:
- תחזית מזג האוויר: גשם כבד
- צריך לבדוק אם בעל המגרש מאפשר משחק בגשם
- אבל הרשמות עדיין נכנסות
- לא רוצה לבטל עדיין (אולי עדיין יקרה)

**הפתרון:**
1. לחץ על "ערוך אירוע"
2. שנה סטטוס: פתוח → מושהה
3. שמור
4. קישור ההרשמה עכשיו מציג: "הרשמה מושהית זמנית"
5. אתה מתקשר לבעל המגרש, מקבל תשובה
6. אם כן: שנה סטטוס חזרה לפתוח
7. אם לא: שנה סטטוס לסגור ושלח מייל ביטול

**זמן שנחסך:** קבלת החלטה בצורה רגועה, לא קיבלת בטעות עוד 50 הרשמות בזמן הבירור

## שינויי קיבולת - הדרך החכמה

**הגדלת קיבולת:**
- ✅ תמיד בטוח!
- ✅ אין צורך באזהרות
- ✅ פשוט הגדל ושמור

**הפחתת קיבולת:**

**הפחתה בטוחה:**
- נוכחי: 100 מקומות, 50 נרשמו
- שנה ל: 80 מקומות
- ✅ המערכת אומרת: "בסדר! 50 נרשמו < 80 קיבולת"
- שינוי מתקבל

**הפחתה מסוכנת:**
- נוכחי: 100 מקומות, 85 נרשמו
- מנסה לשנות ל: 70 מקומות
- ❌ המערכת חוסמת: "לא יכול להפחית ל-70! יש לך 85 הרשמות מאושרות"
- אפשרויות:
  1. שמור קיבולת ב-100
  2. בטל כמה הרשמות קודם (ידנית)
  3. קבע ל-85 (מינימום מותר)

**תכונת הגנה:**
אי אפשר בטעות להעיף נרשמים מאושרים על ידי הפחתת קיבולת!

## בקרת סטטוס

**שלושה מצבים:**

**פתוח (OPEN):**
- צבע ירוק
- קישור הרשמה עובד
- אנשים יכולים להירשם
- מצב ברירת מחדל

**מושהה (PAUSED):**
- צבע צהוב
- קישור הרשמה מציג: "הרשמה מושהית זמנית"
- לא מתקבלות הרשמות חדשות
- השתמש כאשר: צריך זמן להחליט, בודק משהו, מלא זמנית

**סגור (CLOSED):**
- צבע אדום
- קישור הרשמה מציג: "הרשמה סגורה"
- אין הרשמות חדשות
- השתמש כאשר: אירוע קרה, בוטל, או מלא לצמיתות

## שאלות נפוצות

**ש: אם אני משנה את התאריך, אנשים צריכים להירשם שוב?**
ת: לא! כל ההרשמות נשארות. המערכת רק מודיעה להם על השינוי.

**ש: מה אם מישהו לא יכול להגיע לתאריך החדש?**
ת: הם מקבלים מייל עם קישור ביטול. הם יכולים לבטל את ההרשמה שלהם.

**ש: אפשר לערוך אחרי שהאירוע קרה?**
ת: כן, אבל רק לשמירת רשומות. הרשמה סוגרת אוטומטית אחרי שתאריך האירוע עבר.

**ש: מה אם אני בטעות מוחק טקסט חשוב?**
ת: אין כפתור ביטול, אבל אפשר להקליד מחדש. המערכת לא שומרת אוטומטית עד שתלחץ על "שמור שינויים".

**ש: איך אני מודיע לאנשים על שינויים?**
ת: המערכת שואלת אחרי ששומרים: "להודיע למשתמשים רשומים?" לחץ כן וכולם מקבלים מייל.

## זמן שנחסך - מספרים אמיתיים

**מועדון הכדורגל של רחל (חודשי):**
- 8 אירועים לחודש
- ממוצע 1-2 עריכות לאירוע (שינויי תאריך, הגדלת קיבולת, שגיאות כתיב)
- בלי עריכה: מחיקה + יצירה מחדש = 20 דק' × 2 × 8 = 5.3 שעות/חודש
- עם עריכה: 30 שניות × 2 × 8 = 8 דקות/חודש
- **חיסכון חודשי: 5.2 שעות!**

**מה רחל עושה עם הזמן שנחסך:**
- באמת מאמנת את הילדים
- מארגנת טורנירים טובים יותר
- עונה לשאלות של הורים
- חוזרת הביתה בזמן 🎉

## סיפורי הצלחה

**אולם החתונות של דוד:**
"לקוח התקשר ב-10 בלילה: 'אפשר להוסיף עוד 20 מקומות?'
לפני תכונת עריכה: 'מצטער, מאוחר מדי, האירוע מלא'
אחרי תכונת עריכה: פתחתי את הטלפון, לחצתי ערוך, הגדלתי קיבולת 40→60, שמרתי. סיימתי ב-30 שניות. לקוח מרוצה, קיבלתי 20 מקומות בתשלום נוספים!"

**מרכז הקהילה של מיה:**
"תאריך לא נכון חמש פעמים בחודש אחד (אני יודעת, אני יודעת...). כל פעם: ערוך → שנה תאריך → הודע → סיימתי. 2.5 דקות סה״כ. בלי תכונת עריכה, הייתי מבזבזת 1.5 שעות ביצירת אירועים מחדש + מאבדת מאות הרשמות."

**אולם ההופעות של אלי:**
"מנהל האמן מתקשר: 'ההופעה מתחילה ב-8 בערב עכשיו, לא ב-7'
1,200 אנשים כבר קיבלו כרטיסים.
ערוך אירוע → שנה שעה → הודע ל-1,200 אנשים → סיימתי ב-40 שניות.
תארו לעצמכם להתקשר ל-1,200 אנשים... 😱"

---

**השורה התחתונה:** טעויות קורות. תכונת העריכה הופכת "אוי לא, אני צריך להתחיל מחדש!" ל"תוקן ב-30 שניות!" חסוך שעות, שמור את ההרשמות שלך, הודע לכולם אוטומטית.`,
        relatedFeatures: ['create-event', 'event-status']
      }
    ]
  },
  {
    id: 'table-management',
    name: 'Table Management',
    nameHe: 'ניהול שולחנות',
    icon: 'Grid3x3',
    description: 'Table-based events with seating assignments (weddings, dinners, conferences)',
    descriptionHe: 'אירועים מבוססי שולחנות עם הקצאת הושבה (חתונות, ארוחות ערב, כנסים)',
    color: 'green',
    order: 2,
    features: [
      {
        id: 'table-based-events',
        title: 'Tables vs Capacity - Sarah\'s Wedding Hall Dilemma',
        titleHe: 'שולחנות מול קיבולת - הדילמה של אולם החתונות של שרה',
        description: 'When do you need table-based events? Sarah manages a wedding hall and had to learn the hard way',
        descriptionHe: 'מתי צריך אירועים מבוססי שולחנות? שרה מנהלת אולם חתונות ולמדה את זה בדרך הקשה',
        category: 'table-management',
        type: 'ADVANCED',
        roles: ['ADMIN', 'OWNER'],
        difficulty: 'intermediate',
        keywords: ['table', 'seating', 'assignment', 'wedding', 'capacity', 'שולחן', 'הושבה', 'הקצאה', 'חתונה', 'קיבולת'],
        lastUpdated: '2026-01-10',
        content: `# Tables vs Capacity - Sarah's Wedding Hall Dilemma

**Meet Sarah - Wedding Hall Manager:**

"I manage a wedding hall. When I first started using TicketCap, I had a big question:

'Do I need table-based events or capacity-based events?'

I didn't understand the difference. So I chose capacity-based (seemed simpler). BIG MISTAKE. Here's what happened..."

## Sarah's First Wedding - The Capacity Disaster

**Saturday night, 320-person wedding:**

**What Sarah did (wrong way):**
- Created capacity-based event: 320 total spots
- Guests registered online
- Everyone got a confirmation email
- Simple! Or so I thought...

**What happened on wedding day:**

**6:00 PM - Guests arrive:**
- Bride's family: "We're sitting on the right side, tables 1-20"
- Groom's family: "We're sitting on the left side, tables 21-40"
- Everyone is confused: "Which table am I at?"
- There are NO table assignments in the system!

**6:30 PM - Total chaos:**
- 320 people standing around
- No one knows where to sit
- Sarah running around with a paper list (last minute!)
- Bride's uncle: "I reserved for 8 people, where's my table?"
- Sarah: "Um... I don't know? Pick any empty table?"

**Result:**
- 45 minutes of confusion
- Bride crying (not happy tears!)
- Sarah's reputation damaged
- **Sarah learns: Weddings NEED table assignments!**

## Sarah's Second Wedding - The Table Success

**Next Saturday, 280-person wedding:**

**What Sarah did (right way):**
- Created table-based event
- Added 40 tables (using duplicate feature - 30 seconds!)
- Each table: 8 seats, names "שולחן 1" through "שולחן 40"
- Set minimum order: 4 people per table (no tiny scattered groups)

**What happened when guests registered:**

**Guest registers online:**
1. Opens registration link
2. Sees dropdown: "Select your table"
3. Sees: "שולחן 5 (3/8 seats left)"
4. Selects their table
5. Enters number of people: 5 people
6. System checks: Does table 5 have 5 seats left? ✅ Yes! Confirmed.

**Multiple families booking:**
- Bride's aunt: Books שולחן 12 (full 8 seats) ✅
- Groom's cousin: Books שולחן 15 (6 seats) ✅
- Friend group: Books שולחן 23 (4 seats) ✅
- System tracks: "שולחן 12: FULL, שולחן 15: 2 left, שולחן 23: 4 left"

**On wedding day:**

**6:00 PM - Guests arrive:**
- Each guest's confirmation email shows: "You're at שולחן 12"
- They walk in, find their table number (on table cards)
- Sit down immediately
- No confusion!

**6:15 PM - Everyone seated:**
- All 280 guests seated in 15 minutes
- No chaos, no running around
- Bride happy, Sarah happy
- **This is how weddings should work!**

## The Two Types - When to Use Each

### Type 1: Capacity-Based Events ⚡

**Perfect for:**
- Soccer matches (who cares where you sit?)
- Concerts (general admission)
- Workshops (any seat is fine)
- Community events (open seating)

**Example - Soccer match:**
- Event: "Soccer game - Saturday 10 AM"
- Total capacity: 100 players
- Registration: Name, phone, email - Done!
- Day of event: Everyone just shows up and plays
- **No seating needed = Use capacity-based!**

**How it works:**
1. Create event → Set total capacity (100 spots)
2. People register → System counts down: 99, 98, 97...
3. When full: "Event is full, you're on waitlist"
4. Super simple!

**Time to set up:** 5 minutes

### Type 2: Table-Based Events 🪑

**Perfect for:**
- Weddings (families sit together)
- Dinner parties (assigned seating)
- Corporate events (company departments sit together)
- VIP sections (different table tiers)

**Example - Wedding:**
- Event: "Yossi & Rachel's Wedding"
- 40 tables × 8 seats = 320 total capacity
- Registration: Select table, enter number of people
- System tracks each table individually
- Day of event: Everyone knows exactly where to sit
- **Seating matters = Use table-based!**

**How it works:**
1. Create event → Choose "Table-Based"
2. Add tables → 40 tables (duplicate feature: 30 seconds!)
3. People register → Select which table they want
4. System tracks per table: "Table 5: 3/8 left, Table 12: FULL"
5. Day of event: Everyone seated smoothly

**Time to set up:** 10 minutes (5 min event + 30 sec tables + 4.5 min other settings)

## Real Comparison - Same Event, Different Approaches

**Event: 200-person company dinner**

### Option A: Capacity-Based (WRONG!)

**Setup:**
- Create event, set 200 capacity
- ✅ Simple 5-minute setup

**Registration day:**
- 200 people register
- Everyone confirmed
- ✅ Easy so far!

**Event day:**
- HR manager prints table assignments manually
- Runs around placing name cards on 25 tables
- Guests arrive: "Where do I sit?"
- HR manager: "Um, let me check my list..."
- **Total chaos for 30 minutes**

**Result:**
- ❌ 30 min chaos on event day
- ❌ Manual work: printing, placing cards
- ❌ Confused guests
- **Saved 5 min in setup, lost 30 min + reputation on event day**

### Option B: Table-Based (RIGHT!)

**Setup:**
- Create event, choose table-based
- Duplicate 25 tables (30 seconds)
- Set each table: 8 seats
- ⏱️ 10-minute setup

**Registration day:**
- Guests see: "Select your table"
- Sales department picks Tables 1-5
- Marketing picks Tables 6-10
- System tracks everything automatically

**Event day:**
- Each guest's email says: "You're at Table 8"
- Guests walk in, find their table, sit down
- **Seated in 10 minutes, zero chaos**

**Result:**
- ✅ Smooth event day
- ✅ No manual work
- ✅ Happy guests
- **Spent 5 extra min in setup, saved 30 min + reputation on event day**

## Table Features That Save Time

### 1. Duplicate Tables (30 seconds for 40 tables!)
Instead of creating 40 tables one by one (20 minutes), you:
- Create 1 table → Click duplicate → Enter "39" → Done!
- See: "How to Create 40 Tables in 30 Seconds" feature

### 2. Table Templates (Reuse setups forever!)
Create once, use forever:
- Create perfect 40-table wedding setup
- Save as template: "Standard Wedding"
- Next wedding: Apply template → All 40 tables appear!
- See: "Never Set Up Tables Again - Use Templates!" feature

### 3. Bulk Edit (Change 40 tables at once!)
Need to change 40 tables?
- Select all 40 → Change capacity 8→10 → Save
- Done in 20 seconds (vs 40 min individually)
- See: "Change 40 Tables at Once" feature

## Advanced Table Settings

**For each table you can set:**

**1. Capacity**
- How many people fit at this table
- Example: 8 people, 10 people, 12 people

**2. Minimum Order**
- Minimum people required to book this table
- Example: Table seats 8, minimum 4 people
- Prevents: Someone booking 8-seat table for just 1 person

**3. Status**
- **AVAILABLE** - Anyone can book it
- **RESERVED** - Blocked for VIPs (you manually assign)
- **INACTIVE** - Hidden from guests (not in use)

**Real scenario - VIP tables:**
- Tables 1-5: RESERVED for bride's family
- Tables 6-40: AVAILABLE for guests
- Guests only see tables 6-40 when registering
- You manually assign family to tables 1-5

## Common Questions

**Q: Can I mix table-based and capacity-based?**
A: No, pick one per event. Wedding = table-based. Soccer = capacity-based.

**Q: What if someone wants to sit with friends at a different table?**
A: They coordinate and all register for the same table number. System tracks seats on that table.

**Q: Can I change from capacity to table-based after creating event?**
A: No. If you made a mistake, create new event as table-based, copy registration link.

**Q: How do guests know which table to choose?**
A: Usually family/group coordinators tell everyone: "We're at Table 15, register for Table 15"

**Q: Do I HAVE to use table assignments at weddings?**
A: Not required, but HIGHLY recommended. Sarah learned this the hard way! (See story above)

## Time Saved - Real Numbers

**Sarah's wedding hall (monthly):**
- 32 weddings per month
- Before table-based events: 30 min chaos per wedding = 16 hours/month
- After table-based events: 10 min smooth seating per wedding = 5.3 hours/month
- **Monthly savings: 10.7 hours + way less stress!**

**What Sarah does with saved time:**
- Actually helps brides with setup
- Coordinates with caterers better
- Goes home on time (not running around with paper lists!)

## Success Stories

**Sarah's wedding hall:**
"First wedding: 45 minutes of chaos, bride crying. Second wedding: 15 minutes, everyone seated, bride happy. I'll NEVER use capacity-based for weddings again! Table-based saved my reputation."

**Tech company's annual dinner:**
"200 employees, 25 tables. Everyone registered online, selected their team's table. Event day: Zero confusion. HR manager thanked me for making their life easy!"

**Bar Mitzvah with mixed seating:**
"40 tables: 10 VIP (reserved), 30 regular (available). VIP families manually assigned, regular guests chose their tables. System tracked everything. Smooth as butter!"

---

**The bottom line:** Open seating (soccer, concerts) = Capacity-based. Assigned seating (weddings, dinners) = Table-based. Choose right, save hours, avoid chaos!`,
        contentHe: `# שולחנות מול קיבולת - הדילמה של אולם החתונות של שרה

**הכירו את שרה - מנהלת אולם חתונות:**

"אני מנהלת אולם חתונות. כשהתחלתי להשתמש ב-TicketCap, הייתה לי שאלה גדולה:

'האם אני צריכה אירועים מבוססי שולחנות או אירועים מבוססי קיבולת?'

לא הבנתי את ההבדל. אז בחרתי מבוסס קיבולת (נראה פשוט יותר). טעות ענקית. הנה מה שקרה..."

## החתונה הראשונה של שרה - אסון הקיבולת

**שבת בלילה, חתונה ל-320 איש:**

**מה שרה עשתה (דרך לא נכונה):**
- יצרה אירוע מבוסס קיבולת: 320 מקומות סה״כ
- אורחים נרשמו באינטרנט
- כולם קיבלו מייל אישור
- פשוט! או כך חשבתי...

**מה קרה ביום החתונה:**

**18:00 - אורחים מגיעים:**
- משפחת הכלה: "אנחנו יושבים בצד ימין, שולחנות 1-20"
- משפחת החתן: "אנחנו יושבים בצד שמאל, שולחנות 21-40"
- כולם מבולבלים: "באיזה שולחן אני?"
- אין שיוך שולחנות במערכת!

**18:30 - כאוס מוחלט:**
- 320 אנשים עומדים
- אף אחד לא יודע איפה לשבת
- שרה רצה עם רשימת נייר (רגע אחרון!)
- דוד של הכלה: "הזמנתי ל-8 אנשים, איפה השולחן שלי?"
- שרה: "אממ... אני לא יודעת? תבחר שולחן ריק?"

**תוצאה:**
- 45 דקות של בלבול
- כלה בוכה (לא דמעות שמחה!)
- המוניטין של שרה נפגע
- **שרה לומדת: חתונות זקוקות לשיוך שולחנות!**

## החתונה השנייה של שרה - הצלחת השולחנות

**שבת הבאה, חתונה ל-280 איש:**

**מה שרה עשתה (דרך נכונה):**
- יצרה אירוע מבוסס שולחנות
- הוסיפה 40 שולחנות (בתכונת שכפול - 30 שניות!)
- כל שולחן: 8 מקומות, שמות "שולחן 1" עד "שולחן 40"
- קבעה הזמנה מינימלית: 4 אנשים לכל שולחן (לא קבוצות קטנות מפוזרות)

**מה קרה כשאורחים נרשמו:**

**אורח נרשם באינטרנט:**
1. פותח קישור הרשמה
2. רואה תפריט נפתח: "בחר את השולחן שלך"
3. רואה: "שולחן 5 (3/8 מקומות נשארו)"
4. בוחר את השולחן שלו
5. מזין מספר אנשים: 5 אנשים
6. המערכת בודקת: יש לשולחן 5, 5 מקומות פנויים? ✅ כן! מאושר.

**מספר משפחות מזמינות:**
- דודה של הכלה: מזמינה שולחן 12 (8 מקומות מלאים) ✅
- בן דוד של החתן: מזמין שולחן 15 (6 מקומות) ✅
- קבוצת חברים: מזמינה שולחן 23 (4 מקומות) ✅
- המערכת עוקבת: "שולחן 12: מלא, שולחן 15: 2 נשארו, שולחן 23: 4 נשארו"

**ביום החתונה:**

**18:00 - אורחים מגיעים:**
- מייל האישור של כל אורח מציג: "אתה בשולחן 12"
- הם נכנסים, מוצאים את מספר השולחן שלהם (על כרטיסי שולחן)
- יושבים מיד
- אין בלבול!

**18:15 - כולם יושבים:**
- כל 280 האורחים יושבים ב-15 דקות
- אין כאוס, אין ריצות
- כלה מאושרת, שרה מאושרת
- **ככה חתונות צריכות לעבוד!**

## שני הסוגים - מתי להשתמש בכל אחד

### סוג 1: אירועים מבוססי קיבולת ⚡

**מושלם עבור:**
- משחקי כדורגל (למי אכפת איפה אתה יושב?)
- הופעות (כניסה כללית)
- סדנאות (כל מקום בסדר)
- אירועי קהילה (הושבה פתוחה)

**דוגמה - משחק כדורגל:**
- אירוע: "משחק כדורגל - שבת 10 בבוקר"
- קיבולת כוללת: 100 שחקנים
- הרשמה: שם, טלפון, מייל - סיימנו!
- יום האירוע: כולם פשוט מגיעים ומשחקים
- **אין צורך בהושבה = השתמש במבוסס קיבולת!**

**איך זה עובד:**
1. צור אירוע → קבע קיבולת כוללת (100 מקומות)
2. אנשים נרשמים → המערכת סופרת לאחור: 99, 98, 97...
3. כשמלא: "האירוע מלא, אתה ברשימת המתנה"
4. סופר פשוט!

**זמן הגדרה:** 5 דקות

### סוג 2: אירועים מבוססי שולחנות 🪑

**מושלם עבור:**
- חתונות (משפחות יושבות ביחד)
- ארוחות ערב (הושבה מוקצית)
- אירועי חברות (מחלקות חברה יושבות ביחד)
- קטעי VIP (רמות שולחן שונות)

**דוגמה - חתונה:**
- אירוע: "החתונה של יוסי ורחל"
- 40 שולחנות × 8 מקומות = 320 קיבולת כוללת
- הרשמה: בחר שולחן, הזן מספר אנשים
- המערכת עוקבת אחר כל שולחן בנפרד
- יום האירוע: כולם יודעים בדיוק איפה לשבת
- **הושבה חשובה = השתמש במבוסס שולחנות!**

**איך זה עובד:**
1. צור אירוע → בחר "מבוסס שולחנות"
2. הוסף שולחנות → 40 שולחנות (תכונת שכפול: 30 שניות!)
3. אנשים נרשמים → בוחרים איזה שולחן הם רוצים
4. המערכת עוקבת לכל שולחן: "שולחן 5: 3/8 נשארו, שולחן 12: מלא"
5. יום האירוע: כולם יושבים בצורה חלקה

**זמן הגדרה:** 10 דקות (5 דק׳ אירוע + 30 שנ׳ שולחנות + 4.5 דק׳ הגדרות אחרות)

## השוואה אמיתית - אותו אירוע, גישות שונות

**אירוע: ארוחת ערב של חברה ל-200 איש**

### אפשרות א׳: מבוסס קיבולת (לא נכון!)

**הגדרה:**
- צור אירוע, קבע 200 קיבולת
- ✅ הגדרה פשוטה של 5 דקות

**יום ההרשמה:**
- 200 אנשים נרשמים
- כולם מאושרים
- ✅ קל עד כה!

**יום האירוע:**
- מנהלת משאבי אנוש מדפיסה הקצאות שולחן ידנית
- רצה ומציבה כרטיסי שם על 25 שולחנות
- אורחים מגיעים: "איפה אני יושב?"
- מנהלת משאבי אנוש: "אממ, תן לי לבדוק את הרשימה שלי..."
- **כאוס מוחלט למשך 30 דקות**

**תוצאה:**
- ❌ 30 דק׳ כאוס ביום האירוע
- ❌ עבודה ידנית: הדפסה, הצבת כרטיסים
- ❌ אורחים מבולבלים
- **חסכנו 5 דק׳ בהגדרה, הפסדנו 30 דק׳ + מוניטין ביום האירוע**

### אפשרות ב׳: מבוסס שולחנות (נכון!)

**הגדרה:**
- צור אירוע, בחר מבוסס שולחנות
- שכפל 25 שולחנות (30 שניות)
- קבע כל שולחן: 8 מקומות
- ⏱️ הגדרה של 10 דקות

**יום ההרשמה:**
- אורחים רואים: "בחר את השולחן שלך"
- מחלקת מכירות בוחרת שולחנות 1-5
- שיווק בוחר שולחנות 6-10
- המערכת עוקבת אוטומטית אחר הכל

**יום האירוע:**
- מייל של כל אורח אומר: "אתה בשולחן 8"
- אורחים נכנסים, מוצאים את השולחן שלהם, יושבים
- **יושבים ב-10 דקות, אפס כאוס**

**תוצאה:**
- ✅ יום אירוע חלק
- ✅ אין עבודה ידנית
- ✅ אורחים מרוצים
- **השקענו 5 דק׳ נוספות בהגדרה, חסכנו 30 דק׳ + מוניטין ביום האירוע**

## תכונות שולחן שחוסכות זמן

### 1. שכפול שולחנות (30 שניות ל-40 שולחנות!)
במקום ליצור 40 שולחנות אחד אחד (20 דקות), אתה:
- יוצר 1 שולחן → לוחץ שכפול → מזין "39" → סיימת!
- ראה: "איך ליצור 40 שולחנות ב-30 שניות" תכונה

### 2. תבניות שולחן (שימוש חוזר בהגדרות לנצח!)
צור פעם אחת, השתמש לנצח:
- צור הגדרת חתונה מושלמת ל-40 שולחנות
- שמור כתבנית: "חתונה סטנדרטית"
- חתונה הבאה: החל תבנית → כל 40 השולחנות מופיעים!
- ראה: "לעולם לא תצטרכו להגדיר שולחנות שוב" תכונה

### 3. עריכה מרובה (שנה 40 שולחנות בבת אחת!)
צריך לשנות 40 שולחנות?
- בחר את כל 40 → שנה קיבולת 8→10 → שמור
- סיימת ב-20 שניות (מול 40 דק׳ בנפרד)
- ראה: "שנה 40 שולחנות בבת אחת" תכונה

## הגדרות שולחן מתקדמות

**לכל שולחן אפשר לקבוע:**

**1. קיבולת**
- כמה אנשים נכנסים בשולחן הזה
- דוגמה: 8 אנשים, 10 אנשים, 12 אנשים

**2. הזמנה מינימלית**
- מינימום אנשים נדרש להזמין שולחן זה
- דוגמה: שולחן ל-8, מינימום 4 אנשים
- מונע: מישהו מזמין שולחן ל-8 רק לאדם 1

**3. סטטוס**
- **זמין** - כל אחד יכול להזמין אותו
- **שמור** - חסום ל-VIPים (אתה מקצה ידנית)
- **לא פעיל** - מוסתר מאורחים (לא בשימוש)

**תרחיש אמיתי - שולחנות VIP:**
- שולחנות 1-5: שמורים למשפחת הכלה
- שולחנות 6-40: זמינים לאורחים
- אורחים רואים רק שולחנות 6-40 בהרשמה
- אתה מקצה ידנית משפחה לשולחנות 1-5

## שאלות נפוצות

**ש: אפשר לערבב מבוסס שולחנות ומבוסס קיבולת?**
ת: לא, בחר אחד לכל אירוע. חתונה = מבוסס שולחנות. כדורגל = מבוסס קיבולת.

**ש: מה אם מישהו רוצה לשבת עם חברים בשולחן אחר?**
ת: הם מתאמים וכולם נרשמים לאותו מספר שולחן. המערכת עוקבת אחר מקומות בשולחן הזה.

**ש: אפשר לשנות מקיבולת לשולחנות אחרי יצירת אירוע?**
ת: לא. אם עשית טעות, צור אירוע חדש כמבוסס שולחנות, העתק קישור הרשמה.

**ש: איך אורחים יודעים איזה שולחן לבחור?**
ת: בדרך כלל מתאמי משפחה/קבוצה אומרים לכולם: "אנחנו בשולחן 15, תירשמו לשולחן 15"

**ש: אני חייב להשתמש בהקצאת שולחנות בחתונות?**
ת: לא חובה, אבל מומלץ מאוד! שרה למדה את זה בדרך הקשה! (ראה סיפור למעלה)

## זמן שנחסך - מספרים אמיתיים

**אולם החתונות של שרה (חודשי):**
- 32 חתונות לחודש
- לפני אירועים מבוססי שולחנות: 30 דק׳ כאוס לחתונה = 16 שעות/חודש
- אחרי אירועים מבוססי שולחנות: 10 דק׳ הושבה חלקה לחתונה = 5.3 שעות/חודש
- **חיסכון חודשי: 10.7 שעות + הרבה פחות לחץ!**

**מה שרה עושה עם הזמן שנחסך:**
- באמת עוזרת לכלות עם הכנה
- מתאמת טוב יותר עם קייטרינג
- חוזרת הביתה בזמן (לא רצה עם רשימות נייר!)

## סיפורי הצלחה

**אולם החתונות של שרה:**
"חתונה ראשונה: 45 דקות כאוס, כלה בוכה. חתונה שנייה: 15 דקות, כולם יושבים, כלה מאושרת. לעולם לא אשתמש במבוסס קיבולת לחתונות שוב! מבוסס שולחנות הציל את המוניטין שלי."

**ארוחת ערב שנתית של חברת טק:**
"200 עובדים, 25 שולחנות. כולם נרשמו באינטרנט, בחרו את שולחן הצוות שלהם. יום האירוע: אפס בלבול. מנהלת משאבי אנוש הודתה לי על שהקלתי על החיים שלהם!"

**בר מצווה עם הושבה מעורבת:**
"40 שולחנות: 10 VIP (שמורים), 30 רגילים (זמינים). משפחות VIP הוקצו ידנית, אורחים רגילים בחרו את השולחנות שלהם. המערכת עקבה אחר הכל. חלק כמו חמאה!"

---

**השורה התחתונה:** הושבה פתוחה (כדורגל, הופעות) = מבוסס קיבולת. הושבה מוקצית (חתונות, ארוחות ערב) = מבוסס שולחנות. בחר נכון, חסוך שעות, הימנע מכאוס!`,
        examples: [
          {
            title: 'Wedding Chaos vs Wedding Success',
            titleHe: 'כאוס בחתונה מול הצלחה בחתונה',
            description: 'Sarah\'s first wedding (capacity-based): 45 min chaos. Second wedding (table-based): 15 min smooth seating',
            descriptionHe: 'החתונה הראשונה של שרה (מבוסס קיבולת): 45 דק׳ כאוס. חתונה שנייה (מבוסס שולחנות): 15 דק׳ הושבה חלקה',
          }
        ],
        relatedFeatures: ['duplicate-tables', 'table-templates', 'bulk-edit-tables']
      },
      {
        id: 'duplicate-tables',
        title: 'How to Create 40 Tables in 30 Seconds',
        titleHe: 'איך ליצור 40 שולחנות ב-30 שניות',
        description: 'The magic duplicate feature that saves hours of work',
        descriptionHe: 'תכונת השכפול הקסומה שחוסכת שעות עבודה',
        category: 'table-management',
        type: 'NEW',
        roles: ['ADMIN', 'OWNER'],
        difficulty: 'intermediate',
        keywords: ['duplicate', 'copy', 'tables', 'bulk', 'שכפול', 'העתקה', 'שולחנות', 'מרובים'],
        lastUpdated: '2026-01-10',
        content: `# How to Create 40 Tables in 30 Seconds

Let's say you're organizing a wedding and need 40 tables, each seating 8 guests. Normally this would take 20 minutes of clicking "Add Table" 40 times. With the duplicate feature, it takes 30 seconds!

## The Old Way (Don't do this!)

❌ **Manual creation (20 minutes of pain):**
- Click "Add Table" → Type "שולחן 1" → Enter 8 seats → Click "Save"
- Click "Add Table" → Type "שולחן 2" → Enter 8 seats → Click "Save"
- Click "Add Table" → Type "שולחן 3" → Enter 8 seats → Click "Save"
- ...repeat 37 more times... 😫
- Your fingers hurt and 20 minutes are gone

## The New Way (30 seconds!)

✅ **Duplicate magic:**
- Create 1 table → Click Copy icon → Enter "39" → Done!
- All 40 tables created with perfect numbering
- Same settings for all (8 seats, same minimum order, same status)

## The Complete Workflow

**Step 1: Create your first table**
- Go to your wedding event
- Click "הוסף שולחן" (Add Table)
- Name it: "שולחן 1"
- Set capacity: 8 people
- Set minimum order: 4 people (optional - ensures tables are at least half full)
- Click "Save"

**Step 2: Find the Copy icon**
- You see your table "שולחן 1" in the list
- Next to it is a small copy icon 📋
- Click it!

**Step 3: The magic happens**
- A dialog pops up asking: "How many copies?"
- Type: 39 (because you already have 1, you need 39 more to reach 40)
- You see a preview: "שולחן 1 → שולחן 2, 3, 4, 5... 40"

**Step 4: The system thinks for you**
- It detected the number "1" in your table name
- It knows to increment: 2, 3, 4, 5... all the way to 40
- It copies ALL settings: capacity (8), minimum order (4), status (AVAILABLE)

**Step 5: Confirm and celebrate!**
- Click "Confirm"
- *BOOM* - 40 tables appear in 2 seconds
- All perfectly named and configured
- You just saved 19.5 minutes!

## Real Example: Wedding Hall Owner

**Your situation:**
- You run a wedding hall
- Every wedding needs 40 tables
- Each table seats 8 guests
- You organize 2 weddings per week

**Before duplicate feature:**
- 20 minutes × 2 weddings = 40 minutes per week
- 160 minutes per month = 2.5 hours wasted!

**After duplicate feature:**
- 30 seconds × 2 weddings = 1 minute per week
- You saved 2.5 hours every month!

**What you do with saved time:**
- Actually talk to clients
- Plan better events
- Go home earlier
- Enjoy life! 🎉

## Smart Naming Examples

The system is smart about numbers:

**Hebrew:**
- "שולחן 5" → Duplicates become: "שולחן 6, 7, 8, 9, 10..."
- "שולחן A" → Stays as: "שולחן A, שולחן A, שולחן A..." (no number to increment)

**English:**
- "Table 10" → Becomes: "Table 11, 12, 13, 14..."
- "VIP Section 3" → Becomes: "VIP Section 4, 5, 6, 7..."

**Mixed:**
- "שולחן VIP 2" → Becomes: "שולחן VIP 3, 4, 5, 6..."

**Pro tip:** Always put a number in your first table name so the system can auto-increment!

## Common Scenarios

**Scenario 1: Conference with 100 Tables**
- Create "Table 1" with 12 seats
- Duplicate 99 times
- Result: "Table 1" through "Table 100"
- Time: 30 seconds instead of 1 hour!

**Scenario 2: Stadium with Multiple Sections**
- Create "Section A - Table 1"
- Duplicate 19 times → Get Section A Tables 1-20
- Create "Section B - Table 1"
- Duplicate 19 times → Get Section B Tables 1-20
- Total: 40 tables in 2 minutes

**Scenario 3: Already have 5 tables, need 35 more**
- Click copy on any existing table
- Duplicate 35 times
- Edit the names manually if needed
- Still faster than creating from scratch!

## What Gets Copied?

When you duplicate a table, these settings are copied:

✅ **Copied automatically:**
- Capacity (number of seats)
- Minimum order requirement
- Status (AVAILABLE, RESERVED, INACTIVE)
- All other table settings

❌ **NOT copied:**
- Table name (auto-increments instead)
- Existing registrations (new tables are empty)

## Tips for Success

**Before duplicating:**
1. Make sure your first table has the EXACT settings you want
2. Put a number in the name (preferably at the end)
3. Double-check capacity and minimum order
4. Choose the right status (usually AVAILABLE)

**After duplicating:**
5. Scroll through and verify the tables look correct
6. If you made a mistake, you can bulk-delete and start over
7. Save as a template for future events!

## Troubleshooting

**Q: I duplicated but all tables have the same name!**
A: Your first table name didn't have a number. The system needs a number to increment. Rename the first table to include a number (e.g., "שולחן 1" instead of "שולחן ראשון")

**Q: Can I duplicate just some of the settings?**
A: No, duplicate copies everything. But you can use bulk-edit afterward to change multiple tables at once.

**Q: What if I need 400 tables?**
A: Create 1, duplicate 399 times! The system handles it. Takes about 10 seconds for 400 tables.

**Q: Can I undo a duplicate?**
A: Use bulk-delete to select and remove the duplicated tables. Then try again.`,
        contentHe: `# איך ליצור 40 שולחנות ב-30 שניות

בואו נגיד שאתם מארגנים חתונה וצריכים 40 שולחנות, כל אחד מכיל 8 אורחים. בדרך כלל זה ייקח 20 דקות של לחיצה על "הוסף שולחן" 40 פעמים. עם תכונת השכפול, זה לוקח 30 שניות!

## הדרך הישנה (אל תעשו את זה!)

❌ **יצירה ידנית (20 דקות של כאב):**
- לחץ "הוסף שולחן" → הקלד "שולחן 1" → הזן 8 מקומות → לחץ "שמור"
- לחץ "הוסף שולחן" → הקלד "שולחן 2" → הזן 8 מקומות → לחץ "שמור"
- לחץ "הוסף שולחן" → הקלד "שולחן 3" → הזן 8 מקומות → לחץ "שמור"
- ...חזור על זה עוד 37 פעמים... 😫
- האצבעות שלכם כואבות ו-20 דקות נעלמו

## הדרך החדשה (30 שניות!)

✅ **קסם השכפול:**
- צור 1 שולחן → לחץ על סמל ההעתקה → הזן "39" → סיימת!
- כל 40 השולחנות נוצרו עם מיספור מושלם
- אותן הגדרות לכולם (8 מקומות, אותה הזמנה מינימלית, אותו סטטוס)

## התהליך המלא

**שלב 1: צרו את השולחן הראשון שלכם**
- עברו לאירוע החתונה שלכם
- לחצו על "הוסף שולחן"
- תנו לו שם: "שולחן 1"
- קבעו קיבולת: 8 אנשים
- קבעו הזמנה מינימלית: 4 אנשים (אופציונלי - מבטיח ששולחנות יהיו לפחות חצי מלאים)
- לחצו "שמור"

**שלב 2: מצאו את סמל ההעתקה**
- אתם רואים את השולחן שלכם "שולחן 1" ברשימה
- לידו יש סמל העתקה קטן 📋
- לחצו עליו!

**שלב 3: הקסם קורה**
- דיאלוג צץ ושואל: "כמה עותקים?"
- הקלידו: 39 (כי כבר יש לכם 1, אתם צריכים עוד 39 כדי להגיע ל-40)
- אתם רואים תצוגה מקדימה: "שולחן 1 → שולחן 2, 3, 4, 5... 40"

**שלב 4: המערכת חושבת בשבילכם**
- היא זיהתה את המספר "1" בשם השולחן שלכם
- היא יודעת להגדיל: 2, 3, 4, 5... עד 40
- היא מעתיקה את כל ההגדרות: קיבולת (8), הזמנה מינימלית (4), סטטוס (זמין)

**שלב 5: אשרו וחגגו!**
- לחצו "אשר"
- *בום* - 40 שולחנות מופיעים תוך 2 שניות
- כולם בעלי שמות והגדרות מושלמות
- הרגע חסכתם 19.5 דקות!

## דוגמה אמיתית: בעל אולם אירועים

**המצב שלכם:**
- אתם מנהלים אולם אירועים
- כל חתונה צריכה 40 שולחנות
- כל שולחן מכיל 8 אורחים
- אתם מארגנים 2 חתונות בשבוע

**לפני תכונת השכפול:**
- 20 דקות × 2 חתונות = 40 דקות בשבוע
- 160 דקות בחודש = 2.5 שעות מבוזבזות!

**אחרי תכונת השכפול:**
- 30 שניות × 2 חתונות = דקה אחת בשבוע
- חסכתם 2.5 שעות בכל חודש!

**מה אתם עושים עם הזמן שנחסך:**
- באמת מדברים עם לקוחות
- מתכננים אירועים טובים יותר
- חוזרים הביתה מוקדם יותר
- נהנים מהחיים! 🎉

## דוגמאות לשמות חכמים

המערכת חכמה לגבי מספרים:

**עברית:**
- "שולחן 5" → העותקים הופכים ל: "שולחן 6, 7, 8, 9, 10..."
- "שולחן א'" → נשאר כ: "שולחן א', שולחן א', שולחן א'..." (אין מספר להגדיל)

**אנגלית:**
- "Table 10" → הופך ל: "Table 11, 12, 13, 14..."
- "VIP Section 3" → הופך ל: "VIP Section 4, 5, 6, 7..."

**מעורב:**
- "שולחן VIP 2" → הופך ל: "שולחן VIP 3, 4, 5, 6..."

**טיפ מקצועי:** תמיד שימו מספר בשם השולחן הראשון כדי שהמערכת תוכל להגדיל אוטומטית!

## תרחישים נפוצים

**תרחיש 1: כנס עם 100 שולחנות**
- צרו "שולחן 1" עם 12 מקומות
- שכפלו 99 פעמים
- תוצאה: "שולחן 1" עד "שולחן 100"
- זמן: 30 שניות במקום שעה!

**תרחיש 2: אצטדיון עם מספר קטעים**
- צרו "קטע א' - שולחן 1"
- שכפלו 19 פעמים → קבלו קטע א' שולחנות 1-20
- צרו "קטע ב' - שולחן 1"
- שכפלו 19 פעמים → קבלו קטע ב' שולחנות 1-20
- סה"כ: 40 שולחנות ב-2 דקות

**תרחיש 3: כבר יש לכם 5 שולחנות, צריכים עוד 35**
- לחצו על העתקה בכל שולחן קיים
- שכפלו 35 פעמים
- ערכו את השמות ידנית אם צריך
- עדיין יותר מהר מיצירה מאפס!

## מה מועתק?

כשאתם משכפלים שולחן, ההגדרות האלה מועתקות:

✅ **מועתק אוטומטית:**
- קיבולת (מספר מקומות)
- דרישת הזמנה מינימלית
- סטטוס (זמין, שמור, לא פעיל)
- כל ההגדרות האחרות של השולחן

❌ **לא מועתק:**
- שם השולחן (עולה אוטומטית במקום)
- הרשמות קיימות (שולחנות חדשים ריקים)

## טיפים להצלחה

**לפני השכפול:**
1. ודאו שהשולחן הראשון שלכם יש לו את ההגדרות המדויקות שאתם רוצים
2. שימו מספר בשם (רצוי בסוף)
3. בדקו כפול את הקיבולת וההזמנה המינימלית
4. בחרו את הסטטוס הנכון (בדרך כלל זמין)

**אחרי השכפול:**
5. גללו ובדקו שהשולחנות נראים נכון
6. אם טעיתם, אתם יכולים למחוק בצורה מרובה ולהתחיל מחדש
7. שמרו כתבנית לאירועים עתידיים!

## פתרון בעיות

**ש: שכפלתי אבל לכל השולחנות יש את אותו שם!**
ת: לשם השולחן הראשון שלכם לא היה מספר. המערכת צריכה מספר כדי להגדיל. שנו את שם השולחן הראשון כך שיכלול מספר (למשל, "שולחן 1" במקום "שולחן ראשון")

**ש: האם אני יכול לשכפל רק חלק מההגדרות?**
ת: לא, שכפול מעתיק הכל. אבל אתם יכולים להשתמש בעריכה מרובה אחר כך כדי לשנות מספר שולחנות בבת אחת.

**ש: מה אם אני צריך 400 שולחנות?**
ת: צרו 1, שכפלו 399 פעמים! המערכת מטפלת בזה. לוקח בערך 10 שניות ל-400 שולחנות.

**ש: האם אני יכול לבטל שכפול?**
ת: השתמשו במחיקה מרובה כדי לבחור ולהסיר את השולחנות המשוכפלים. אז נסו שוב.`,
        examples: [
          {
            title: 'Complete Wedding Setup',
            titleHe: 'הקמת חתונה מלאה',
            description: 'From 0 to 40 tables in 30 seconds - see every click',
            descriptionHe: 'מ-0 ל-40 שולחנות ב-30 שניות - ראו כל לחיצה',
          }
        ],
        relatedFeatures: ['table-templates', 'bulk-edit-tables']
      },
      {
        id: 'table-templates',
        title: 'Never Set Up Tables Again - Use Templates!',
        titleHe: 'לעולם לא תצטרכו להגדיר שולחנות שוב - השתמשו בתבניות!',
        description: 'Set up once, reuse forever. Save hours every month!',
        descriptionHe: 'הגדירו פעם אחת, השתמשו לנצח. חסכו שעות בכל חודש!',
        category: 'table-management',
        type: 'NEW',
        roles: ['ADMIN', 'OWNER'],
        difficulty: 'intermediate',
        keywords: ['templates', 'reuse', 'save', 'תבניות', 'שמירה', 'שימוש חוזר'],
        lastUpdated: '2026-01-10',
        content: `# Never Set Up Tables Again - Use Templates!

You run a wedding hall. Every wedding needs the same 40 tables setup. You've created this exact same configuration 50 times this year.

**Current reality:** 20 minutes per wedding × 50 weddings = **16.5 hours wasted on repetitive setup!**

## The Problem: Repeating Yourself

**Sarah's story - Wedding Hall Manager:**

"Every Monday morning, I create next weekend's wedding events:
1. Create event for Saturday wedding
2. Add 40 tables, one by one (20 minutes)
3. Create event for Sunday wedding
4. Add the EXACT SAME 40 tables again (another 20 minutes)
5. Repeat next week... and the week after... forever! 😫

I'm spending 40 minutes every week just recreating the same table setup. That's 35 hours per year!"

## The Solution: Table Templates

**What Sarah does now:**

**One-time setup (20 minutes):**
1. Created her perfect 40-table wedding layout
2. Clicked "Save as Template"
3. Named it: "Standard Wedding - 40 Tables"

**Every wedding after (30 seconds):**
1. Create new event
2. Click "Apply Template"
3. Select "Standard Wedding - 40 Tables"
4. Click "Apply"
5. BOOM! All 40 tables appear instantly!

**Time saved:** 19.5 minutes per wedding × 100 weddings/year = **32.5 hours saved!**

## The Complete Workflow

### Part 1: Creating Your First Template

**Step 1: Set up your perfect event**
- You create a wedding event
- Spend 20 minutes creating 40 perfect tables
- Name them: "שולחן 1" through "שולחן 40"
- Set capacity: 8 per table
- Set minimum order: 4 per table
- Everything is exactly how you want it

**Step 2: Save it as a template**
- Click the "💾 Save as Template" button
- Dialog pops up asking: "Template name?"
- Enter: "Standard Wedding - 40 Tables"
- Add description: "Our standard 40-table wedding layout"
- Choose: Private (only your school sees it)
- Click "Save Template"

**Step 3: Success!**
- ✅ Template saved
- You see it in your templates list
- It's ready to use on all future events!

### Part 2: Using Your Template (Every Event After)

**Step 1: Create a new wedding event**
- Next Monday, you create Saturday's wedding event
- Fill in name, date, location
- Click "Create Event"

**Step 2: Apply your template**
- You're now in the event
- You see: "No tables yet. Add tables or apply a template"
- Click "📋 Apply Template" button
- A list appears showing all your saved templates

**Step 3: Preview and confirm**
- Select "Standard Wedding - 40 Tables"
- Preview shows:
  - "This will create 40 tables"
  - "שולחן 1 through שולחן 40"
  - "8 seats each, minimum 4 orders"
- Click "Apply Template"

**Step 4: Magic happens!**
- ✨ All 40 tables appear in 3 seconds
- Perfectly named, perfectly configured
- Ready for registrations immediately
- **You just saved 19.5 minutes!**

## Real Example: Wedding Hall's Monthly Savings

**Sarah's wedding hall:**
- 4 weddings per weekend
- 8 weekends per month
- 32 weddings per month

**Before templates:**
- 20 minutes × 32 weddings = **640 minutes = 10.5 hours per month**
- Repetitive, boring, error-prone work

**After templates:**
- 30 seconds × 32 weddings = **16 minutes per month**
- Time saved: **10 hours and 14 minutes every month!**

**What Sarah does with saved time:**
- Actually talks to brides and grooms
- Improves service quality
- Plans better weddings
- Goes home on time!
- Enjoys her job again 🎉

## Multiple Templates for Different Events

You can create as many templates as you need!

**Wedding Hall Example:**
- "Standard Wedding - 40 Tables" (8 seats each)
- "Small Wedding - 20 Tables" (8 seats each)
- "Mega Wedding - 60 Tables" (10 seats each)
- "VIP Wedding - 30 Tables" (6 seats premium)

**Conference Center Example:**
- "Standard Conference - 50 Tables" (12 seats each)
- "Workshop Setup - 15 Tables" (8 seats each)
- "Banquet Hall - 80 Tables" (10 seats each)

**Sports Stadium Example:**
- "Home Game - Section A" (20 tables)
- "Home Game - Section B" (20 tables)
- "Full Stadium - All Sections" (100 tables)

## Workflow: Creating Multiple Templates

**Scenario: You run events in 3 different venues**

**Week 1: Create templates**
1. Set up Venue A configuration → Save as "Venue A - Standard"
2. Set up Venue B configuration → Save as "Venue B - Standard"
3. Set up Venue C configuration → Save as "Venue C - Standard"

**Week 2-52: Just use templates!**
- Creating event at Venue A? → Apply "Venue A - Standard"
- Creating event at Venue B? → Apply "Venue B - Standard"
- Creating event at Venue C? → Apply "Venue C - Standard"

Each template loads in 3 seconds instead of 20 minutes of manual setup!

## What Gets Saved in a Template?

When you save a template, it remembers:

✅ **Everything important:**
- Number of tables
- Table names and numbering
- Capacity per table
- Minimum order requirements
- Table status (AVAILABLE, RESERVED, INACTIVE)

❌ **Not saved (event-specific):**
- Actual registrations (tables start empty)
- Event name, date, location (you set these per event)
- Custom modifications for special events

## Template Management Tips

**Naming conventions:**
- ✅ "Standard Wedding - 40 Tables" (clear, descriptive)
- ✅ "Conference Room A - 20 Tables"
- ❌ "Template 1" (you'll forget what this is!)
- ❌ "The one with tables" (too vague)

**When to create a template:**
- You've used the same setup 2+ times
- You plan to use it again in the future
- You want consistency across events
- You want to save time

**When NOT to create a template:**
- One-time unique event layout
- Constantly changing configurations
- Still experimenting with setup

## Sharing Templates (Advanced)

**Private templates (default):**
- Only your school sees them
- Perfect for your specific venue layouts
- Keep your configurations private

**Public templates (SUPER_ADMIN only):**
- Share with all TicketCap users
- Example: "Standard Wedding - 40 Tables (Global)"
- Help other event organizers get started
- Build a library of best practices

## Editing an Existing Template

**Scenario: Your venue changed capacity rules**

You have a template: "Standard Wedding - 40 Tables" with 8 seats per table.
New fire code says maximum 6 seats per table.

**Option 1: Update the template**
1. Create a test event
2. Apply the template
3. Use bulk-edit to change all tables to 6 seats
4. Save as template with same name (overwrites old one)
5. ✅ Template updated! All future events use 6 seats

**Option 2: Create a new template**
1. Follow same steps above
2. Save with new name: "Standard Wedding - 40 Tables (6-seat)"
3. Keep old template for reference
4. Switch to new template for all new events

## Common Questions

**Q: Can I apply multiple templates to one event?**
A: No, each application replaces existing tables. But you can apply a template, then duplicate tables or add more manually.

**Q: What happens if I apply a template to an event that already has tables?**
A: You'll get a warning: "This will replace all existing tables. Continue?" You can cancel if you didn't mean to do this.

**Q: Can I modify tables after applying a template?**
A: Yes! Templates just create the initial setup. After that, you can edit, duplicate, or delete tables as needed.

**Q: How many templates can I create?**
A: Unlimited! Create as many as you need for different event types and venues.

**Q: Can I delete a template?**
A: Yes, but it won't affect events that already used it. It just removes it from future use.

**Q: If I update a template, do old events get updated?**
A: No. Templates are like a copy-paste tool. Once applied, the tables belong to that specific event and aren't connected to the template anymore.

## Success Story: From Chaos to Calm

**Before templates:**
- Monday morning panic: "Oh no, I have 3 weddings this weekend!"
- Spend 1 hour creating tables for all 3 events
- Make mistakes (forgot to set minimum order on 15 tables!)
- Stressed and behind schedule

**After templates:**
- Monday morning: "I have 3 weddings this weekend!"
- Click, click, click → All 3 events set up in 90 seconds
- Perfect configuration every time
- Time for coffee and planning ☕

## Your Action Plan

**This week:**
1. Identify your most common event setup
2. Create that event perfectly once
3. Save it as a template
4. Use it for your next event

**This month:**
5. Create templates for your other common setups
6. Track time saved (you'll be amazed!)
7. Celebrate your newfound free time!

**This year:**
8. Build a library of templates for all scenarios
9. Never manually recreate tables again
10. Wonder how you ever lived without this!

**Result:** Hundreds of hours saved per year, better consistency, less stress, happier you! 🎉`,
        contentHe: `# לעולם לא תצטרכו להגדיר שולחנות שוב - השתמשו בתבניות!

אתם מנהלים אולם אירועים. כל חתונה צריכה את אותן 40 שולחנות. יצרתם את אותה הגדרה בדיוק 50 פעמים השנה.

**המציאות הנוכחית:** 20 דקות לחתונה × 50 חתונות = **16.5 שעות מבוזבזות על הגדרה חוזרת!**

## הבעיה: חזרה על עצמכם

**הסיפור של שרה - מנהלת אולם אירועים:**

"כל יום שני בבוקר, אני יוצרת את אירועי סוף השבוע הבא:
1. יוצרת אירוע לחתונת שבת
2. מוסיפה 40 שולחנות, אחד אחד (20 דקות)
3. יוצרת אירוע לחתונת יום ראשון
4. מוסיפה את אותם 40 שולחנות שוב (עוד 20 דקות)
5. חוזרת על זה שבוע הבא... ושבוע אחרי... לנצח! 😫

אני מבזבזת 40 דקות כל שבוע רק על יצירה מחדש של אותה הגדרת שולחנות. זה 35 שעות בשנה!"

## הפתרון: תבניות שולחנות

**מה שרה עושה עכשיו:**

**הגדרה חד-פעמית (20 דקות):**
1. יצרה את פריסת 40 השולחנות המושלמת שלה
2. לחצה "שמור כתבנית"
3. נתנה לזה שם: "חתונה סטנדרטית - 40 שולחנות"

**כל חתונה אחרי (30 שניות):**
1. יוצרת אירוע חדש
2. לוחצת "החל תבנית"
3. בוחרת "חתונה סטנדרטית - 40 שולחנות"
4. לוחצת "החל"
5. בום! כל 40 השולחנות מופיעים מיד!

**זמן שנחסך:** 19.5 דקות לחתונה × 100 חתונות/שנה = **32.5 שעות שנחסכו!**

## התהליך המלא

### חלק 1: יצירת התבנית הראשונה שלכם

**שלב 1: הגדירו את האירוע המושלם שלכם**
- אתם יוצרים אירוע חתונה
- מבלים 20 דקות ביצירת 40 שולחנות מושלמים
- נותנים להם שמות: "שולחן 1" עד "שולחן 40"
- קובעים קיבולת: 8 לכל שולחן
- קובעים הזמנה מינימלית: 4 לכל שולחן
- הכל בדיוק איך שאתם רוצים

**שלב 2: שמרו את זה כתבנית**
- לוחצים על כפתור "💾 שמור כתבנית"
- דיאלוג צץ ושואל: "שם התבנית?"
- מזינים: "חתונה סטנדרטית - 40 שולחנות"
- מוסיפים תיאור: "פריסת 40 השולחנות הסטנדרטית שלנו"
- בוחרים: פרטי (רק בית הספר שלכם רואה את זה)
- לוחצים "שמור תבנית"

**שלב 3: הצלחה!**
- ✅ התבנית נשמרה
- אתם רואים אותה ברשימת התבניות שלכם
- היא מוכנה לשימוש בכל האירועים העתידיים!

### חלק 2: שימוש בתבנית שלכם (כל אירוע אחרי)

**שלב 1: יצרו אירוע חתונה חדש**
- יום שני הבא, אתם יוצרים את אירוע חתונת שבת
- ממלאים שם, תאריך, מיקום
- לוחצים "צור אירוע"

**שלב 2: החילו את התבנית שלכם**
- אתם עכשיו באירוע
- אתם רואים: "אין עדיין שולחנות. הוסף שולחנות או החל תבנית"
- לוחצים על כפתור "📋 החל תבנית"
- רשימה מופיעה ומציגה את כל התבניות השמורות שלכם

**שלב 3: תצוגה מקדימה ואישור**
- בוחרים "חתונה סטנדרטית - 40 שולחנות"
- תצוגה מקדימה מציגה:
  - "זה ייצור 40 שולחנות"
  - "שולחן 1 עד שולחן 40"
  - "8 מקומות כל אחד, מינימום 4 הזמנות"
- לוחצים "החל תבנית"

**שלב 4: הקסם קורה!**
- ✨ כל 40 השולחנות מופיעים תוך 3 שניות
- עם שמות מושלמים, הגדרות מושלמות
- מוכנים להרשמות מיד
- **הרגע חסכתם 19.5 דקות!**

## דוגמה אמיתית: חיסכון חודשי של אולם אירועים

**אולם האירועים של שרה:**
- 4 חתונות בסוף שבוע
- 8 סופי שבוע בחודש
- 32 חתונות בחודש

**לפני תבניות:**
- 20 דקות × 32 חתונות = **640 דקות = 10.5 שעות בחודש**
- עבודה חוזרת, משעממת, נוטה לטעויות

**אחרי תבניות:**
- 30 שניות × 32 חתונות = **16 דקות בחודש**
- זמן שנחסך: **10 שעות ו-14 דקות כל חודש!**

**מה שרה עושה עם הזמן שנחסך:**
- באמת מדברת עם חתנים וכלות
- משפרת את איכות השירות
- מתכננת חתונות טובות יותר
- חוזרת הביתה בזמן!
- נהנית מהעבודה שלה שוב 🎉

## תבניות מרובות לאירועים שונים

אתם יכולים ליצור כמה תבניות שאתם צריכים!

**דוגמת אולם אירועים:**
- "חתונה סטנדרטית - 40 שולחנות" (8 מקומות כל אחד)
- "חתונה קטנה - 20 שולחנות" (8 מקומות כל אחד)
- "חתונה מגה - 60 שולחנות" (10 מקומות כל אחד)
- "חתונת VIP - 30 שולחנות" (6 מקומות פרימיום)

**דוגמת מרכז כנסים:**
- "כנס סטנדרטי - 50 שולחנות" (12 מקומות כל אחד)
- "הגדרת סדנה - 15 שולחנות" (8 מקומות כל אחד)
- "אולם אירועים - 80 שולחנות" (10 מקומות כל אחד)

**דוגמת אצטדיון ספורט:**
- "משחק בית - קטע א'" (20 שולחנות)
- "משחק בית - קטע ב'" (20 שולחנות)
- "אצטדיון מלא - כל הקטעים" (100 שולחנות)

## תהליך: יצירת תבניות מרובות

**תרחיש: אתם מנהלים אירועים ב-3 מקומות שונים**

**שבוע 1: צרו תבניות**
1. הגדירו תצורת מקום א' → שמרו כ"מקום א' - סטנדרט"
2. הגדירו תצורת מקום ב' → שמרו כ"מקום ב' - סטנדרט"
3. הגדירו תצורת מקום ג' → שמרו כ"מקום ג' - סטנדרט"

**שבוע 2-52: פשוט השתמשו בתבניות!**
- יוצרים אירוע במקום א'? → החילו "מקום א' - סטנדרט"
- יוצרים אירוע במקום ב'? → החילו "מקום ב' - סטנדרט"
- יוצרים אירוע במקום ג'? → החילו "מקום ג' - סטנדרט"

כל תבנית נטענת תוך 3 שניות במקום 20 דקות של הגדרה ידנית!

## מה נשמר בתבנית?

כשאתם שומרים תבנית, היא זוכרת:

✅ **כל מה שחשוב:**
- מספר השולחנות
- שמות ומספור השולחנות
- קיבולת לכל שולחן
- דרישות הזמנה מינימלית
- סטטוס שולחן (זמין, שמור, לא פעיל)

❌ **לא נשמר (ספציפי לאירוע):**
- הרשמות בפועל (שולחנות מתחילים ריקים)
- שם האירוע, תאריך, מיקום (אתם קובעים אלה לכל אירוע)
- שינויים מותאמים אישית לאירועים מיוחדים

## טיפים לניהול תבניות

**מוסכמות שמות:**
- ✅ "חתונה סטנדרטית - 40 שולחנות" (ברור, תיאורי)
- ✅ "חדר כנסים א' - 20 שולחנות"
- ❌ "תבנית 1" (תשכחו מה זה!)
- ❌ "זה עם שולחנות" (מדי מעורפל)

**מתי ליצור תבנית:**
- השתמשתם באותה הגדרה 2+ פעמים
- אתם מתכננים להשתמש בזה שוב בעתיד
- אתם רוצים עקביות בין אירועים
- אתם רוצים לחסוך זמן

**מתי לא ליצור תבנית:**
- פריסת אירוע ייחודית חד-פעמית
- תצורות שמשתנות כל הזמן
- עדיין מתנסים בהגדרה

## שיתוף תבניות (מתקדם)

**תבניות פרטיות (ברירת מחדל):**
- רק בית הספר שלכם רואה אותן
- מושלם לפריסות המקום הספציפיות שלכם
- שמרו את התצורות שלכם פרטיות

**תבניות ציבוריות (SUPER_ADMIN בלבד):**
- שתפו עם כל משתמשי TicketCap
- דוגמה: "חתונה סטנדרטית - 40 שולחנות (גלובלי)"
- עזרו למארגני אירועים אחרים להתחיל
- בנו ספרייה של שיטות עבודה מומלצות

## עריכת תבנית קיימת

**תרחיש: המקום שלכם שינה כללי קיבולת**

יש לכם תבנית: "חתונה סטנדרטית - 40 שולחנות" עם 8 מקומות לכל שולחן.
חוק כיבוי אש חדש אומר מקסימום 6 מקומות לכל שולחן.

**אופציה 1: עדכנו את התבנית**
1. צרו אירוע בדיקה
2. החילו את התבנית
3. השתמשו בעריכה מרובה כדי לשנות את כל השולחנות ל-6 מקומות
4. שמרו כתבנית עם אותו שם (מחליף את הישן)
5. ✅ התבנית עודכנה! כל האירועים העתידיים משתמשים ב-6 מקומות

**אופציה 2: צרו תבנית חדשה**
1. עקבו אחר אותם שלבים למעלה
2. שמרו עם שם חדש: "חתונה סטנדרטית - 40 שולחנות (6-מקומות)"
3. שמרו את התבנית הישנה להתייחסות
4. עברו לתבנית החדשה לכל האירועים החדשים

## שאלות נפוצות

**ש: האם אני יכול להחיל תבניות מרובות על אירוע אחד?**
ת: לא, כל יישום מחליף שולחנות קיימים. אבל אתם יכולים להחיל תבנית, ואז לשכפל שולחנות או להוסיף עוד ידנית.

**ש: מה קורה אם אני מחיל תבנית על אירוע שכבר יש בו שולחנות?**
ת: תקבלו אזהרה: "זה יחליף את כל השולחנות הקיימים. להמשיך?" אתם יכולים לבטל אם לא התכוונתם לזה.

**ש: האם אני יכול לשנות שולחנות אחרי החלת תבנית?**
ת: כן! תבניות רק יוצרות את ההגדרה הראשונית. אחרי זה, אתם יכולים לערוך, לשכפל, או למחוק שולחנות לפי הצורך.

**ש: כמה תבניות אני יכול ליצור?**
ת: ללא הגבלה! צרו כמה שאתם צריכים לסוגי אירועים ומקומות שונים.

**ש: האם אני יכול למחוק תבנית?**
ת: כן, אבל זה לא ישפיע על אירועים שכבר השתמשו בה. זה רק מסיר אותה משימוש עתידי.

**ש: אם אני מעדכן תבנית, האם אירועים ישנים מתעדכנים?**
ת: לא. תבניות הן כמו כלי העתק-הדבק. ברגע שמוחלים, השולחנות שייכים לאותו אירוע ספציפי ולא מחוברים לתבנית יותר.

## סיפור הצלחה: מכאוס לרוגע

**לפני תבניות:**
- פאניקה של יום שני בבוקר: "אוי לא, יש לי 3 חתונות בסוף השבוע הזה!"
- מבלים שעה ביצירת שולחנות לכל 3 האירועים
- עושים טעויות (שכחתי להגדיר הזמנה מינימלית ב-15 שולחנות!)
- לחוצים ומפגרים בלוח זמנים

**אחרי תבניות:**
- יום שני בבוקר: "יש לי 3 חתונות בסוף השבוע הזה!"
- לחץ, לחץ, לחץ → כל 3 האירועים מוגדרים תוך 90 שניות
- תצורה מושלמת בכל פעם
- זמן לקפה ותכנון ☕

## תוכנית הפעולה שלכם

**השבוע:**
1. זהו את הגדרת האירוע הכי נפוצה שלכם
2. צרו את האירוע הזה מושלם פעם אחת
3. שמרו אותו כתבנית
4. השתמשו בו לאירוע הבא שלכם

**החודש:**
5. צרו תבניות להגדרות הנפוצות האחרות שלכם
6. עקבו אחר הזמן שנחסך (תהיו מופתעים!)
7. חגגו את הזמן החופשי החדש שלכם!

**השנה:**
8. בנו ספרייה של תבניות לכל התרחישים
9. לעולם לא תצטרכו ליצור שולחנות ידנית שוב
10. תתפלאו איך בכלל חייתם בלי זה!

**תוצאה:** מאות שעות שנחסכו בשנה, עקביות טובה יותר, פחות לחץ, אתם מאושרים יותר! 🎉`,
        relatedFeatures: ['duplicate-tables', 'bulk-edit-tables']
      },
      {
        id: 'bulk-edit-tables',
        title: 'Change 40 Tables at Once - The VIP Section Story',
        titleHe: 'שנה 40 שולחנות בבת אחת - סיפור קטע ה-VIP',
        description: 'How one click saved a concert venue manager from editing 40 tables individually',
        descriptionHe: 'איך קליק אחד חסך למנהל אולם הופעות עריכה של 40 שולחנות בנפרד',
        category: 'table-management',
        type: 'NEW',
        roles: ['ADMIN', 'OWNER'],
        difficulty: 'intermediate',
        keywords: ['bulk', 'edit', 'multiple', 'tables', 'עריכה מרובה', 'שולחנות'],
        lastUpdated: '2026-01-10',
        content: `# Change 40 Tables at Once - The VIP Section Story\n\n**Meet Eli - Concert Venue Manager**\n\n"We're hosting a big concert this Friday. I already created 80 tables (regular + VIP). Then my boss tells me:\n\n'Eli, the VIP tables (Tables 1-40) need a minimum order of 8 people now, not 6. Corporate policy changed.'\n\nI looked at the screen... 40 tables to edit... this will take 45 minutes... 😫"\n\n## The Old Way (Don't do this!)\n\n❌ **Manual editing (45 minutes of clicking):**\n1. Click on Table 1 → Change min order 6→8 → Save\n2. Click on Table 2 → Change min order 6→8 → Save\n3. Click on Table 3 → Change min order 6→8 → Save\n4. ...repeat 37 more times...\n5. By Table 20, you're making mistakes\n6. By Table 30, you want to quit\n7. Finally done at Table 40 💀\n\n## The New Way (30 seconds!)\n\n✅ **Bulk edit magic:**\n\n**Step 1: Select the tables**\n- Click checkbox on Table 1 (VIP)\n- Click checkbox on Table 2 (VIP)\n- Or... click "Select Range: Tables 1-40"\n- All 40 VIP tables now highlighted in blue\n- Counter shows: "40 tables selected"\n\n**Step 2: Click "Edit Selected"**\n- Button appears at bottom: "Edit 40 tables"\n- Click it → popup appears\n\n**Step 3: Change what you need**\n- Popup shows:\n  - Capacity: [leave empty to keep current]\n  - Minimum Order: [8]\n  - Status: [leave empty to keep current]\n- Enter "8" in Minimum Order field\n- Click "Apply to 40 tables"\n\n**Step 4: Done!**\n- ✅ All 40 tables updated in 2 seconds\n- System shows: "40 tables updated successfully"\n- You saved 44 minutes and 30 seconds!\n\n## Real Scenarios\n\n### Scenario 1: Last-Minute Venue Change\n\n**The problem:**\nFriday morning, 4 hours before concert:\n- Fire marshal says: "Capacity reduced from 10 to 8 per table"\n- You have 80 tables total\n- Need to change capacity on ALL of them\n- Concert starts in 4 hours\n\n**The panic:**\n- If you edit manually: 80 tables × 40 seconds = 53 minutes\n- You have other tasks to do!\n- Can't afford to spend an hour clicking\n\n**The solution:**\n1. Click "Select All" → 80 tables selected\n2. Click "Edit Selected"\n3. Change capacity to 8\n4. Click "Apply to 80 tables"\n5. **Done in 15 seconds!**\n\n**Eli's reaction:**\n"I literally said 'wow' out loud. Saved 52 minutes before a major event. That time went to checking sound equipment instead."\n\n### Scenario 2: Delete Wrong Tables\n\n**The problem:**\n- Created 50 tables for Wedding A\n- Created 50 tables for Wedding B (same event by accident!)\n- Need to delete the duplicate 50 tables\n- Don't want to click 50 times\n\n**The solution:**\n1. Select the duplicate tables (Tables 51-100)\n2. Click "Delete Selected"\n3. System checks: "Are these tables reserved?"\n4. If yes → Shows which ones are reserved (can't delete)\n5. If no → "Delete 50 tables permanently?"\n6. Click "Yes, delete 50 tables"\n7. **Gone in 10 seconds!**\n\n**Protection feature:**\n- System WON'T let you delete tables with reservations\n- If Tables 51-55 have reservations, you'll see:\n  - "Cannot delete 5 tables: they have reservations"\n  - "Can delete 45 tables: they're empty"\n- Prevents accidental deletion of paid tables!\n\n## The Complete Workflow\n\n**Part 1: Selecting Tables**\n\n**Option A - Select one by one:**\n- Click checkbox on Table 1\n- Click checkbox on Table 2\n- Click checkbox on Table 3\n- Works for small selections\n\n**Option B - Select range:**\n- Click "Select Range"\n- Enter "1-40" (Tables 1 through 40)\n- Click "Select" → All 40 selected\n- Best for consecutive tables\n\n**Option C - Select all:**\n- Click "Select All" at top\n- All tables in the event selected\n- Best for global changes (capacity, status)\n\n**Part 2: Editing Tables**\n\n**What you can change:**\n- **Capacity:** Change max people per table\n- **Minimum Order:** Change minimum people required\n- **Status:** Change AVAILABLE ↔ RESERVED ↔ INACTIVE\n\n**How it works:**\n1. Select tables (using any method above)\n2. Click "Edit Selected" button\n3. Popup shows 3 fields (leave empty = keep current)\n4. Fill what you want to change\n5. Click "Apply to X tables"\n6. System updates all selected tables\n7. See success message: "X tables updated"\n\n**Part 3: Deleting Tables**\n\n**Safety first:**\n1. Select tables to delete\n2. Click "Delete Selected"\n3. System checks for reservations\n4. Shows warning: "Delete X tables permanently?"\n5. Lists which tables CAN'T be deleted (have reservations)\n6. You confirm: "Yes, delete X tables"\n7. Tables deleted (except reserved ones)\n\n## Calculations: Time Saved\n\n**Editing 40 VIP tables:**\n- Manual: 40 tables × 1 minute = 40 minutes\n- Bulk edit: 30 seconds\n- **Saved: 39.5 minutes per event**\n\n**Deleting 50 duplicate tables:**\n- Manual: 50 tables × 30 seconds = 25 minutes\n- Bulk delete: 15 seconds\n- **Saved: 24 minutes 45 seconds**\n\n**Changing capacity on 80 tables (emergency):**\n- Manual: 80 tables × 40 seconds = 53 minutes\n- Bulk edit: 20 seconds\n- **Saved: 52 minutes 40 seconds**\n\n**Eli's concert venue (monthly):**\n- 8 concerts per month\n- Average 2 bulk changes per concert (VIP sections, last-minute adjustments)\n- Average time saved: 30 minutes per change\n- **Monthly savings: 8 concerts × 2 changes × 30 min = 8 hours!**\n\n## Practical Tips\n\n**Before bulk editing:**\n- ✅ Double-check your selection count (is "40 tables selected" correct?)\n- ✅ Use filters to narrow down selection (status: AVAILABLE)\n- ✅ Test on 2-3 tables first if unsure\n\n**When bulk editing:**\n- Leave fields empty that you don't want to change\n- System keeps current values for empty fields\n- Only fill what needs updating\n\n**When bulk deleting:**\n- System protects reserved tables (can't delete)\n- You'll see which ones are protected\n- Confirmation required (no accidental deletes)\n\n## Common Questions\n\n**Q: What if I select the wrong tables?**\nA: Click "Deselect All" and start over. Nothing changes until you click "Apply"\n\n**Q: Can I undo a bulk edit?**\nA: No undo button, but you can bulk edit again to revert changes\n\n**Q: What if some tables have reservations and I try to delete?**\nA: System blocks deletion of reserved tables and shows you which ones are protected\n\n**Q: Can I change different values for different tables?**\nA: No, bulk edit applies same change to all. For different values, edit individually\n\n**Q: What's the maximum number of tables I can select?**\nA: No limit! Select 100, 200, even 500 tables at once\n\n## Success Stories\n\n**Eli's concert venue:**\n- Before: 53 minutes to change 80 tables (emergency)\n- After: 20 seconds with bulk edit\n- **Mood change: Panic → Relief**\n- "I had time to check sound equipment instead of clicking buttons"\n\n**Sarah's wedding hall:**\n- Before: 40 minutes to delete duplicate tables\n- After: 15 seconds with bulk delete\n- **Saved: 39 minutes 45 seconds**\n- "I thought I'd be there all morning. Done before my coffee cooled!"\n\n**David's sports club:**\n- Before: Changes to VIP section took 35 minutes each event\n- After: 25 seconds with bulk edit\n- Over 10 events: **Saved 5.8 hours**\n- "That's 5.8 hours I spent coaching instead of clicking"\n\n---\n\n**The bottom line:** Bulk edit turns 40 minutes of repetitive clicking into 30 seconds of smart selection. Your time is valuable - use it for planning great events, not clicking "Save" 40 times!`,
        contentHe: `# שנה 40 שולחנות בבת אחת - סיפור קטע ה-VIP\n\n**הכירו את אלי - מנהל אולם הופעות**\n\n"אנחנו מארחים הופעה גדולה ביום שישי. כבר יצרתי 80 שולחנות (רגיל + VIP). ואז הבוס שלי אומר לי:\n\n'אלי, שולחנות ה-VIP (שולחנות 1-40) צריכים הזמנה מינימלית של 8 אנשים עכשיו, לא 6. המדיניות של החברה השתנתה.'\n\nהסתכלתי על המסך... 40 שולחנות לערוך... זה ייקח 45 דקות... 😫"\n\n## הדרך הישנה (אל תעשו את זה!)\n\n❌ **עריכה ידנית (45 דקות של לחיצות):**\n1. לחץ על שולחן 1 → שנה מינימום 6→8 → שמור\n2. לחץ על שולחן 2 → שנה מינימום 6→8 → שמור\n3. לחץ על שולחן 3 → שנה מינימום 6→8 → שמור\n4. ...חזור 37 פעמים נוספות...\n5. בשולחן 20, אתה מתחיל לעשות טעויות\n6. בשולחן 30, אתה רוצה להתפטר\n7. סוף סוף גמרת בשולחן 40 💀\n\n## הדרך החדשה (30 שניות!)\n\n✅ **קסם עריכה מרובה:**\n\n**שלב 1: בחר את השולחנות**\n- לחץ על תיבת הסימון בשולחן 1 (VIP)\n- לחץ על תיבת הסימון בשולחן 2 (VIP)\n- או... לחץ על "בחר טווח: שולחנות 1-40"\n- כל 40 שולחנות ה-VIP מסומנים כעת בכחול\n- המונה מציג: "40 שולחנות נבחרו"\n\n**שלב 2: לחץ על "ערוך נבחרים"**\n- כפתור מופיע בתחתית: "ערוך 40 שולחנות"\n- לחץ עליו → חלון קופץ מופיע\n\n**שלב 3: שנה מה שצריך**\n- החלון הקופץ מציג:\n  - קיבולת: [השאר ריק כדי לשמור את הנוכחי]\n  - הזמנה מינימלית: [8]\n  - סטטוס: [השאר ריק כדי לשמור את הנוכחי]\n- הזן "8" בשדה הזמנה מינימלית\n- לחץ על "החל על 40 שולחנות"\n\n**שלב 4: סיימת!**\n- ✅ כל 40 השולחנות עודכנו ב-2 שניות\n- המערכת מציגה: "40 שולחנות עודכנו בהצלחה"\n- חסכת 44 דקות ו-30 שניות!\n\n## תרחישים אמיתיים\n\n### תרחיש 1: שינוי אולם ברגע האחרון\n\n**הבעיה:**\nיום שישי בבוקר, 4 שעות לפני ההופעה:\n- מפקח הכבאות אומר: "קיבולת מופחתת מ-10 ל-8 לכל שולחן"\n- יש לך 80 שולחנות בסך הכל\n- צריך לשנות את הקיבולת על כולם\n- ההופעה מתחילה בעוד 4 שעות\n\n**הפאניקה:**\n- אם תערוך ידנית: 80 שולחנות × 40 שניות = 53 דקות\n- יש לך משימות אחרות לעשות!\n- לא יכול להרשות לעצמך לבזבז שעה על לחיצות\n\n**הפתרון:**\n1. לחץ על "בחר הכל" → 80 שולחנות נבחרו\n2. לחץ על "ערוך נבחרים"\n3. שנה קיבולת ל-8\n4. לחץ על "החל על 80 שולחנות"\n5. **סיימת ב-15 שניות!**\n\n**תגובת אלי:**\n"ממש אמרתי 'וואו' בקול רם. חסכתי 52 דקות לפני אירוע גדול. הזמן הזה הלך לבדיקת ציוד הסאונד במקום."\n\n### תרחיש 2: מחק שולחנות שגויים\n\n**הבעיה:**\n- יצרת 50 שולחנות לחתונה א'\n- יצרת 50 שולחנות לחתונה ב' (אותו אירוע בטעות!)\n- צריך למחוק את 50 השולחנות המשוכפלים\n- לא רוצה ללחוץ 50 פעמים\n\n**הפתרון:**\n1. בחר את השולחנות המשוכפלים (שולחנות 51-100)\n2. לחץ על "מחק נבחרים"\n3. המערכת בודקת: "האם השולחנות האלה שמורים?"\n4. אם כן → מראה אילו שמורים (לא ניתן למחוק)\n5. אם לא → "למחוק 50 שולחנות לצמיתות?"\n6. לחץ על "כן, מחק 50 שולחנות"\n7. **נעלמו ב-10 שניות!**\n\n**תכונת הגנה:**\n- המערכת לא תאפשר לך למחוק שולחנות עם הזמנות\n- אם לשולחנות 51-55 יש הזמנות, תראה:\n  - "לא ניתן למחוק 5 שולחנות: יש להם הזמנות"\n  - "ניתן למחוק 45 שולחנות: הם ריקים"\n- מונע מחיקה בטעות של שולחנות ששולמו!\n\n## התהליך המלא\n\n**חלק 1: בחירת שולחנות**\n\n**אפשרות א' - בחר אחד אחד:**\n- לחץ על תיבת הסימון בשולחן 1\n- לחץ על תיבת הסימון בשולחן 2\n- לחץ על תיבת הסימון בשולחן 3\n- עובד לבחירות קטנות\n\n**אפשרות ב' - בחר טווח:**\n- לחץ על "בחר טווח"\n- הזן "1-40" (שולחנות 1 עד 40)\n- לחץ על "בחר" → כל 40 נבחרו\n- הכי טוב לשולחנות רצופים\n\n**אפשרות ג' - בחר הכל:**\n- לחץ על "בחר הכל" בראש\n- כל השולחנות באירוע נבחרו\n- הכי טוב לשינויים גלובליים (קיבולת, סטטוס)\n\n**חלק 2: עריכת שולחנות**\n\n**מה אפשר לשנות:**\n- **קיבולת:** שנה מקסימום אנשים לשולחן\n- **הזמנה מינימלית:** שנה מינימום אנשים נדרש\n- **סטטוס:** שנה זמין ↔ שמור ↔ לא פעיל\n\n**איך זה עובד:**\n1. בחר שולחנות (בכל שיטה למעלה)\n2. לחץ על כפתור "ערוך נבחרים"\n3. חלון קופץ מציג 3 שדות (השאר ריק = שמור נוכחי)\n4. מלא מה שאתה רוצה לשנות\n5. לחץ על "החל על X שולחנות"\n6. המערכת מעדכנת את כל השולחנות הנבחרים\n7. ראה הודעת הצלחה: "X שולחנות עודכנו"\n\n**חלק 3: מחיקת שולחנות**\n\n**בטיחות קודם:**\n1. בחר שולחנות למחיקה\n2. לחץ על "מחק נבחרים"\n3. המערכת בודקת הזמנות\n4. מציגה אזהרה: "למחוק X שולחנות לצמיתות?"\n5. מציגה אילו שולחנות לא ניתן למחוק (יש הזמנות)\n6. אתה מאשר: "כן, מחק X שולחנות"\n7. שולחנות נמחקים (חוץ משמורים)\n\n## חישובים: זמן שנחסך\n\n**עריכת 40 שולחנות VIP:**\n- ידני: 40 שולחנות × 1 דקה = 40 דקות\n- עריכה מרובה: 30 שניות\n- **נחסך: 39.5 דקות לכל אירוע**\n\n**מחיקת 50 שולחנות משוכפלים:**\n- ידני: 50 שולחנות × 30 שניות = 25 דקות\n- מחיקה מרובה: 15 שניות\n- **נחסך: 24 דקות 45 שניות**\n\n**שינוי קיבולת על 80 שולחנות (חירום):**\n- ידני: 80 שולחנות × 40 שניות = 53 דקות\n- עריכה מרובה: 20 שניות\n- **נחסך: 52 דקות 40 שניות**\n\n**אולם ההופעות של אלי (חודשי):**\n- 8 הופעות לחודש\n- ממוצע 2 שינויים מרובים להופעה (קטעי VIP, התאמות רגע אחרון)\n- ממוצע זמן נחסך: 30 דקות לשינוי\n- **חיסכון חודשי: 8 הופעות × 2 שינויים × 30 דק' = 8 שעות!**\n\n## טיפים מעשיים\n\n**לפני עריכה מרובה:**\n- ✅ בדוק פעמיים את מספר הבחירות (האם "40 שולחנות נבחרו" נכון?)\n- ✅ השתמש בסינונים לצמצום הבחירה (סטטוס: זמין)\n- ✅ נסה על 2-3 שולחנות קודם אם לא בטוח\n\n**בזמן עריכה מרובה:**\n- השאר שדות ריקים שאתה לא רוצה לשנות\n- המערכת שומרת ערכים נוכחיים לשדות ריקים\n- מלא רק מה שצריך עדכון\n\n**בזמן מחיקה מרובה:**\n- המערכת מגנה על שולחנות שמורים (לא ניתן למחוק)\n- תראה אילו מוגנים\n- נדרש אישור (אין מחיקות בטעות)\n\n## שאלות נפוצות\n\n**ש: מה אם בחרתי את השולחנות הלא נכונים?**\nת: לחץ על "בטל בחירת הכל" והתחל מחדש. שום דבר לא משתנה עד שתלחץ על "החל"\n\n**ש: האם אפשר לבטל עריכה מרובה?**\nת: אין כפתור ביטול, אבל אפשר לערוך מרובה שוב כדי להחזיר שינויים\n\n**ש: מה אם לחלק מהשולחנות יש הזמנות ואני מנסה למחוק?**\nת: המערכת חוסמת מחיקה של שולחנות שמורים ומראה לך אילו מוגנים\n\n**ש: האם אפשר לשנות ערכים שונים לשולחנות שונים?**\nת: לא, עריכה מרובה מחילה אותו שינוי על הכל. לערכים שונים, ערוך בנפרד\n\n**ש: מה המספר המקסימלי של שולחנות שאפשר לבחור?**\nת: אין הגבלה! בחר 100, 200, אפילו 500 שולחנות בבת אחת\n\n## סיפורי הצלחה\n\n**אולם ההופעות של אלי:**\n- לפני: 53 דקות לשנות 80 שולחנות (חירום)\n- אחרי: 20 שניות עם עריכה מרובה\n- **שינוי מצב רוח: פאניקה → הקלה**\n- "היה לי זמן לבדוק ציוד סאונד במקום ללחוץ על כפתורים"\n\n**אולם החתונות של שרה:**\n- לפני: 40 דקות למחוק שולחנות משוכפלים\n- אחרי: 15 שניות עם מחיקה מרובה\n- **נחסך: 39 דקות 45 שניות**\n- "חשבתי שאהיה שם כל הבוקר. סיימתי לפני שהקפה התקרר!"\n\n**מועדון הספורט של דוד:**\n- לפני: שינויים בקטע VIP לקחו 35 דקות לכל אירוע\n- אחרי: 25 שניות עם עריכה מרובה\n- על פני 10 אירועים: **נחסך 5.8 שעות**\n- "זה 5.8 שעות שביליתי באימון במקום בלחיצות"\n\n---\n\n**השורה התחתונה:** עריכה מרובה הופכת 40 דקות של לחיצות חוזרות ל-30 שניות של בחירה חכמה. הזמן שלך יקר - השתמש בו לתכנון אירועים מעולים, לא ללחוץ על "שמור" 40 פעמים!`,
        relatedFeatures: ['duplicate-tables', 'table-management']
      }
    ]
  },
  {
    id: 'check-in',
    name: 'Check-In System',
    nameHe: 'מערכת צ\'ק-אין',
    icon: 'QrCode',
    description: 'QR code scanning and attendance tracking',
    descriptionHe: 'סריקת QR ומעקב נוכחות',
    color: 'orange',
    order: 3,
    features: [
      {
        id: 'qr-scanner',
        title: 'How the Check-In System Works',
        titleHe: 'איך מערכת הצ\'ק-אין עובדת',
        description: 'From creating your event to checking people in on game day',
        descriptionHe: 'מיצירת האירוע ועד לצ\'ק-אין של אנשים ביום המשחק',
        category: 'check-in',
        type: 'NEW',
        roles: ['ADMIN', 'MANAGER', 'OWNER'],
        difficulty: 'beginner',
        keywords: ['qr', 'scan', 'camera', 'check-in', 'סריקה', 'מצלמה', 'צק-אין'],
        lastUpdated: '2026-01-10',
        content: `# How the Check-In System Works

Let's say it's Saturday morning, the soccer match is about to start, and you need to know who actually showed up.

## The Complete Workflow

**Step 1: You created an event (already done!)**
- You made a soccer match event with 100 spots
- 85 people registered during the week
- Now it's game day!

**Step 2: You get a check-in link**
- Open your event in the dashboard
- Click the "צ'ק-אין" (Check-In) tab
- You see a special check-in link at the top
- Copy this link

**Step 3: The check-in link is for your staff**
- This link is special because:
  - Anyone with it can check people in (no login needed!)
  - Perfect for volunteers at the entrance
  - Works on any phone or tablet
  - Stays active for the entire event

**Step 4: Open the link on your phone**
- Send the link to yourself or volunteer
- Open it on your phone
- You see a big camera view (full screen!)
- Camera turns on automatically

**Step 5: Each player has a QR code**
- When someone registered, they got a confirmation email
- That email contains their personal QR code
- They show you the QR code on their phone
- Or they can print it out

**Step 6: You scan their QR code**
- Point your phone camera at their QR code
- The system automatically detects it (you don't click anything!)
- You see a big **green flash** ✅
- The screen shows: "יוסי כהן - נרשם בהצלחה!" (Yossi Cohen - Checked in!)
- Takes 2 seconds total

**Step 7: What you see while scanning**
- Top of screen shows live stats:
  - "42/85 checked in" (updates instantly!)
  - "43 not yet arrived"
  - "0 on waitlist showed up"
- You can see at a glance how many people are here

**Step 8: What happens with problems?**

**If someone isn't registered:**
- You scan their QR code
- Screen shows **red flash** ❌
- Message: "לא נרשמת לאירוע זה" (You're not registered for this event)
- You can manually add them if needed

**If someone already checked in:**
- You scan their QR code again
- Screen shows **yellow flash** ⚠️
- Message: "כבר נרשמת ב-09:15" (Already checked in at 09:15)
- Prevents duplicate entries

**If someone is banned:**
- You scan their QR code
- Screen shows **red flash** 🚫
- Message: "חסום: 3 אי-הופעות" (Banned: 3 no-shows)
- They cannot check in

## Real Example: Saturday Morning

**Your situation:**
- Soccer match starts at 10:00 AM
- 85 people registered during the week
- You're at the field at 9:30 AM

**What you do:**
1. Open event dashboard on your phone
2. Go to Check-In tab
3. Copy the check-in link
4. Open link → camera starts
5. Stand at entrance
6. Scan QR codes as players arrive

**What happens:**
- 9:35 AM - First player arrives → scan → ✅ "1/85 checked in"
- 9:40 AM - 5 more players → scan scan scan → ✅ "6/85 checked in"
- 9:50 AM - Rush of players → scan scan scan → ✅ "38/85 checked in"
- 10:00 AM - Game starts → "62/85 checked in"
- You close the scanner and know exactly who came (62 people)

**After the game:**
- Go back to dashboard
- See full attendance report:
  - 62 people checked in (showed up)
  - 23 people didn't show up (no-shows)
- You can now ban repeat no-shows from future events

## Why use the QR scanner?

**Instead of pen and paper:**
- ❌ Paper list: Check names one by one, slow, people make typos
- ✅ QR scanner: Point camera, instant check-in, no mistakes

**Benefits:**
- **Super fast**: 2 seconds per person (vs 15 seconds with paper)
- **No mistakes**: Can't check in the wrong person
- **Live count**: Always know how many are here
- **Works offline**: Camera works without internet
- **Fraud prevention**: Can't fake a QR code
- **Attendance tracking**: Automatic record of who showed up

## Tips for smooth check-in

**Before event day:**
- Send reminder email with QR codes the day before
- Test the check-in link on your phone
- Make sure your phone is fully charged

**On event day:**
- Arrive 15-30 minutes early
- Set up scanning station at entrance
- Have a backup charger ready
- If someone forgot their QR code, you can search by name and check them in manually

## Common questions

**Q: What if someone forgot their phone?**
A: Use the search feature - type their name and check them in manually

**Q: Can multiple people scan at once?**
A: Yes! Share the link with multiple volunteers, everyone can scan simultaneously

**Q: Does it work without internet?**
A: Camera works offline, but you need internet to load the initial page and sync check-ins

**Q: What if someone shows a screenshot of someone else's QR?**
A: The system only allows one check-in per code. After first scan, it shows "already checked in"`,
        contentHe: `# איך מערכת הצ'ק-אין עובדת

בואו נגיד שזה שבת בבוקר, משחק הכדורגל עומד להתחיל, ואתם צריכים לדעת מי באמת הגיע.

## התהליך המלא

**שלב 1: יצרתם אירוע (כבר נעשה!)**
- עשיתם אירוע משחק כדורגל עם 100 מקומות
- 85 אנשים נרשמו במהלך השבוע
- עכשיו זה יום המשחק!

**שלב 2: אתם מקבלים קישור צ'ק-אין**
- פותחים את האירוע שלכם בדאשבורד
- לוחצים על הלשונית "צ'ק-אין"
- אתם רואים קישור צ'ק-אין מיוחד בראש העמוד
- מעתיקים את הקישור הזה

**שלב 3: קישור הצ'ק-אין הוא עבור הצוות שלכם**
- הקישור הזה מיוחד כי:
  - כל מי שיש לו אותו יכול לעשות צ'ק-אין (לא צריך להתחבר!)
  - מושלם למתנדבים בכניסה
  - עובד על כל טלפון או טאבלט
  - נשאר פעיל לכל משך האירוע

**שלב 4: פותחים את הקישור בטלפון**
- שולחים את הקישור לעצמכם או למתנדב
- פותחים אותו בטלפון
- אתם רואים תצוגת מצלמה גדולה (מסך מלא!)
- המצלמה נדלקת אוטומטית

**שלב 5: כל שחקן יש לו קוד QR**
- כשמישהו נרשם, הוא קיבל אימייל אישור
- האימייל הזה מכיל את קוד ה-QR האישי שלו
- הם מראים לכם את קוד ה-QR בטלפון שלהם
- או שהם יכולים להדפיס אותו

**שלב 6: אתם סורקים את קוד ה-QR שלהם**
- מכוונים את מצלמת הטלפון שלכם לקוד ה-QR שלהם
- המערכת מזהה אותו אוטומטית (אתם לא לוחצים כלום!)
- אתם רואים **הבזק ירוק** גדול ✅
- המסך מראה: "יוסי כהן - נרשם בהצלחה!"
- לוקח 2 שניות בסך הכל

**שלב 7: מה אתם רואים בזמן הסריקה**
- בחלק העליון של המסך מוצגות סטטיסטיקות חיות:
  - "42/85 נרשמו" (מתעדכן מיידית!)
  - "43 עדיין לא הגיעו"
  - "0 מרשימת המתנה הגיעו"
- אתם יכולים לראות במבט אחד כמה אנשים כאן

**שלב 8: מה קורה עם בעיות?**

**אם מישהו לא נרשם:**
- אתם סורקים את קוד ה-QR שלו
- המסך מראה **הבזק אדום** ❌
- הודעה: "לא נרשמת לאירוע זה"
- אתם יכולים להוסיף אותו ידנית במידת הצורך

**אם מישהו כבר נרשם:**
- אתם סורקים את קוד ה-QR שלו שוב
- המסך מראה **הבזק צהוב** ⚠️
- הודעה: "כבר נרשמת ב-09:15"
- מונע רשומות כפולות

**אם מישהו חסום:**
- אתם סורקים את קוד ה-QR שלו
- המסך מראה **הבזק אדום** 🚫
- הודעה: "חסום: 3 אי-הופעות"
- הם לא יכולים לבצע צ'ק-אין

## דוגמה אמיתית: שבת בבוקר

**המצב שלכם:**
- משחק כדורגל מתחיל ב-10:00 בבוקר
- 85 אנשים נרשמו במהלך השבוע
- אתם במגרש ב-9:30 בבוקר

**מה אתם עושים:**
1. פותחים את דאשבורד האירועים בטלפון
2. עוברים ללשונית צ'ק-אין
3. מעתיקים את קישור הצ'ק-אין
4. פותחים קישור → מצלמה מתחילה
5. עומדים בכניסה
6. סורקים קודי QR כשהשחקנים מגיעים

**מה קורה:**
- 9:35 - שחקן ראשון מגיע → סריקה → ✅ "1/85 נרשמו"
- 9:40 - 5 שחקנים נוספים → סריקה סריקה סריקה → ✅ "6/85 נרשמו"
- 9:50 - פרץ של שחקנים → סריקה סריקה סריקה → ✅ "38/85 נרשמו"
- 10:00 - המשחק מתחיל → "62/85 נרשמו"
- אתם סוגרים את הסורק ויודעים בדיוק מי בא (62 אנשים)

**אחרי המשחק:**
- חוזרים לדאשבורד
- רואים דוח נוכחות מלא:
  - 62 אנשים נרשמו (הגיעו)
  - 23 אנשים לא הגיעו (אי-הופעות)
- עכשיו אתם יכולים לחסום אי-הופעות חוזרות מאירועים עתידיים

## למה להשתמש בסורק QR?

**במקום עט ונייר:**
- ❌ רשימת נייר: בדקו שמות אחד אחד, איטי, אנשים עושים טעויות כתיב
- ✅ סורק QR: כוונו מצלמה, צ'ק-אין מיידי, בלי טעויות

**יתרונות:**
- **סופר מהיר**: 2 שניות לאדם (לעומת 15 שניות עם נייר)
- **בלי טעויות**: לא יכול לעשות צ'ק-אין לאדם הלא נכון
- **ספירה חיה**: תמיד יודעים כמה כאן
- **עובד אופליין**: מצלמה עובדת בלי אינטרנט
- **מניעת הונאה**: לא יכול לזייף קוד QR
- **מעקב נוכחות**: רשומה אוטומטית של מי הגיע

## טיפים לצ'ק-אין חלק

**לפני יום האירוע:**
- שלחו אימייל תזכורת עם קודי QR יום לפני
- בדקו את קישור הצ'ק-אין בטלפון שלכם
- ודאו שהטלפון שלכם טעון במלואו

**ביום האירוע:**
- הגיעו 15-30 דקות מוקדם
- הקימו עמדת סריקה בכניסה
- החזיקו מטען גיבוי מוכן
- אם מישהו שכח את הטלפון שלו, אתם יכולים לחפש לפי שם ולעשות לו צ'ק-אין ידנית

## שאלות נפוצות

**ש: מה אם מישהו שכח את הטלפון שלו?**
ת: השתמשו בתכונת החיפוש - הקלידו את השם שלו ועשו לו צ'ק-אין ידנית

**ש: האם מספר אנשים יכולים לסרוק בו זמנית?**
ת: כן! שתפו את הקישור עם מספר מתנדבים, כולם יכולים לסרוק במקביל

**ש: האם זה עובד בלי אינטרנט?**
ת: המצלמה עובדת אופליין, אבל אתם צריכים אינטרנט כדי לטעון את העמוד הראשוני ולסנכרן צ'ק-אינים

**ש: מה אם מישהו מראה צילום מסך של קוד QR של מישהו אחר?**
ת: המערכת מאפשרת רק צ'ק-אין אחד לכל קוד. אחרי סריקה ראשונה, זה מראה "כבר נרשם"`,
        examples: [
          {
            title: 'Complete Check-In Workflow',
            titleHe: 'תהליך צ\'ק-אין מלא',
            description: 'From opening the link to checking in 85 people in 10 minutes',
            descriptionHe: 'מפתיחת הקישור ועד לצ\'ק-אין של 85 אנשים ב-10 דקות',
          }
        ],
        relatedFeatures: ['create-event', 'attendance-tracking']
      }
    ]
  },
  {
    id: 'ban-management',
    name: 'Ban Management',
    nameHe: 'ניהול חסימות',
    icon: 'ShieldAlert',
    description: 'Ban users from registering or checking in',
    descriptionHe: 'חסום משתמשים מהרשמה או צ\'ק-אין',
    color: 'red',
    order: 4,
    features: [
      {
        id: 'create-ban',
        title: 'How to Handle No-Shows and Problem Players',
        titleHe: 'איך להתמודד עם אי-הופעות ושחקנים בעייתיים',
        description: 'The complete guide to banning repeat offenders from future events',
        descriptionHe: 'המדריך המלא לחסימת עבריינים חוזרים מאירועים עתידיים',
        category: 'ban-management',
        type: 'NEW',
        roles: ['ADMIN', 'OWNER'],
        difficulty: 'intermediate',
        keywords: ['ban', 'block', 'restrict', 'חסימה', 'חסום', 'הגבלה'],
        lastUpdated: '2026-01-10',
        content: `# How to Handle No-Shows and Problem Players

You organize a soccer match. 85 people register. Only 62 show up. 23 people didn't come and didn't even bother to cancel.

Now you have this problem: **The same 5 people always register and never show up.** They're taking spots from people who actually want to play!

## The Problem: Serial No-Shows

**Real scenario from a soccer club:**
- דני (Danny): Registered for 8 matches, showed up to 2
- יוסי (Yossi): Registered for 6 matches, showed up to 1
- מיכל (Michal): Registered for 10 matches, showed up to 4
- רונית (Ronit): Registered for 5 matches, showed up to 0 (!)
- אלי (Eli): Registered for 7 matches, showed up to 3

These 5 people are blocking 36 spots that could go to players who actually show up!

## The Solution: Smart Banning System

You have 2 ways to ban someone:

### Option 1: Game-Based Ban (Most Common)
**"You can't register for the next 5 games"**

**When to use:**
- Repeat no-shows
- Minor problems
- Want them to learn a lesson
- Will eventually let them back

**How it works:**
- They register for next game → System says "Sorry, you're banned from 5 more events"
- After each event passes (whether they try to register or not), counter goes down: 5 → 4 → 3 → 2 → 1 → 0
- When counter reaches 0 → Ban automatically lifted
- They can register again!

### Option 2: Date-Based Ban (For Serious Issues)
**"You can't register until March 1st"**

**When to use:**
- Serious misbehavior (fighting, harassment)
- Need exact time period
- School suspension period
- Temporary punishment

**How it works:**
- They try to register → System says "You're banned until March 1st, 2026"
- On March 1st → Ban automatically expires
- They can register again
- Or you can lift it earlier manually if you forgive them

## Complete Workflow: Banning a No-Show

**Step 1: After the event, you check attendance**
- Open your Saturday soccer match
- Go to Attendance tab
- See 23 people didn't show up (red list)

**Step 2: Find the repeat offenders**
- Look at the no-show list
- You recognize Danny - this is his 4th no-show in a row!
- You see Yossi - also a repeat offender
- Time to take action

**Step 3: Select who to ban**
- Check the box next to Danny
- Check the box next to Yossi
- You can select multiple people at once (saves time!)

**Step 4: Click "Create Ban" button**
- A dialog pops up asking: "What type of ban?"
- Two big buttons: "Game-Based" or "Date-Based"

**Step 5: For Danny and Yossi, choose Game-Based**
- Click "Game-Based Ban"
- Enter: 5 (they can't register for next 5 events)
- Write reason: "4 consecutive no-shows without canceling"
- This reason is private - only admins see it

**Step 6: Confirm and it's done!**
- Click "Ban Users"
- System shows: "✅ 2 users banned successfully"
- Danny and Yossi are now blocked

## What Happens Next?

**Next Tuesday - Danny tries to register for Thursday's game:**
- Opens registration link
- Fills his name, phone number
- Clicks "Register"
- 🚫 **BLOCKED!** Screen shows:
  - "אתה חסום מ-5 אירועים עתידיים" (You're banned from 5 future events)
  - "סיבה: 4 אי-הופעות רצופות" (Reason: 4 consecutive no-shows)
  - "צור קשר עם המנהל אם זו טעות" (Contact admin if this is a mistake)

**Thursday - Event happens (without Danny):**
- His ban counter automatically decreases: 5 → 4
- He still can't register for next 4 events

**After 5 events pass:**
- Counter reaches 0
- Ban automatically lifted
- Danny can register again
- Hopefully he learned his lesson!

## Real Example: Soccer Club Manager

**Your situation:**
- You run a weekly soccer match
- 100 spots per match
- 15% of players are chronic no-shows
- They're ruining it for everyone

**Week 1: No ban system**
- 85 register, 62 show up
- Same 5 people no-show AGAIN
- Players complain: "I couldn't register because it was full!"

**Week 2: You implement bans**
- Ban the 5 repeat offenders from next 3 matches
- Now you have 5 extra spots
- 5 new reliable players register!

**Week 3: Results**
- 85 register, 78 show up! (92% attendance!)
- Only 7 no-shows (much better!)
- Players are happy
- Games are full with people who actually show up

**Month later:**
- The banned players learned their lesson
- They're allowed back
- They now cancel if they can't make it
- Everyone wins!

## Bulk Banning: Handle Multiple Offenders at Once

**Scenario: After a big event, you have 10 no-shows**

**The fast way:**
1. Select all 10 checkboxes
2. Click "Create Ban"
3. Choose "Game-Based", enter "3"
4. Write reason: "No-show from [event name]"
5. Click "Ban Users"
6. ✅ All 10 banned in 30 seconds!

Instead of banning one by one (10 minutes), you did it in 30 seconds!

## Ban Management Tips

**How many events to ban:**
- **First offense**: 1-2 events (warning)
- **Second offense**: 3-5 events (serious warning)
- **Third offense**: 10+ events or permanent

**When to use date-based:**
- School suspension: "Banned until suspension ends"
- Seasonal: "Banned until next season starts"
- Cooling off: "Banned for 30 days"
- Serious issues: Fighting, harassment, theft

**Document everything:**
- Always write clear reasons
- You'll forget in 2 months why you banned someone
- "3 no-shows" is clear
- "Bad behavior" is too vague

## What Banned Users See

**When trying to register:**
\`\`\`
❌ לא ניתן להירשם

אתה חסום מהרשמה לאירועים עתידיים.

סוג חסימה: 5 אירועים נותרים
סיבה: 3 אי-הופעות רצופות ללא ביטול

אם לדעתך זו טעות, צור קשר עם המנהל.
\`\`\`

**When trying to check in:**
\`\`\`
❌ צ'ק-אין נחסם

שם: דני כהן
טלפון: 050-1234567

חסום: 3 משחקים נותרים
סיבה: התנהגות לא הולמת

לא ניתן לבצע צ'ק-אין.
\`\`\`

## Lifting a Ban Early (Forgiveness!)

**Danny calls you:** "I'm so sorry about the no-shows. My mom was sick. Can you please unban me?"

**You decide to give him another chance:**
1. Go to Settings → Bans
2. Find Danny in the ban list
3. Click "Lift Ban"
4. Confirm
5. ✅ Danny can register again immediately!

**The system tracks:**
- When ban was created
- When ban was lifted
- Who lifted it
- Original reason (stays in history)

## Common Questions

**Q: Can someone register with a different phone number to bypass the ban?**
A: Yes, but you'll see duplicate names and can ban the new number too. Most people won't try this.

**Q: What if I accidentally banned someone?**
A: Just lift the ban immediately. It takes 5 seconds to undo.

**Q: Can I see all currently banned users?**
A: Yes! Go to Settings → Bans. You see full list with:
- Names and phone numbers
- Type of ban (game-based or date-based)
- Events remaining OR date it expires
- Reason
- When ban was created

**Q: Do bans work across all my events?**
A: Yes! If you ban someone, they can't register for ANY of your future events until the ban expires.

**Q: Can I ban someone before they even no-show?**
A: Technically yes, but not recommended. Only ban based on actual behavior, not predictions.

**Q: What if someone keeps creating new accounts?**
A: Ban their phone number. Most people won't get a new phone number just to register for a soccer match.

## Success Metrics: Is Banning Working?

**Before banning (typical club):**
- 85 registrations → 62 show up (73% attendance)
- Same people no-show repeatedly
- Frustrated players can't get spots
- Time wasted on no-shows

**After implementing bans (same club after 2 months):**
- 85 registrations → 78-82 show up (92-96% attendance!)
- Repeat offenders learned their lesson
- Reliable players get spots
- Better games with full teams
- Club reputation improves

## Your Game Plan

**Week 1:** Start tracking attendance
**Week 2:** Identify repeat offenders (3+ no-shows)
**Week 3:** Ban them from 3-5 events
**Week 4:** See attendance improve
**Week 5:** Lift bans for those who learned
**Week 6:** Maintain system - ban any new repeat offenders

**Result:** Within 2 months, you have a reliable player base where people either show up or cancel properly. Everyone wins!`,
        contentHe: `# איך להתמודד עם אי-הופעות ושחקנים בעייתיים

אתם מארגנים משחק כדורגל. 85 אנשים נרשמים. רק 62 מגיעים. 23 אנשים לא באו ואפילו לא טרחו לבטל.

עכשיו יש לכם את הבעיה הזו: **אותם 5 אנשים תמיד נרשמים ואף פעם לא מגיעים.** הם תופסים מקומות מאנשים שבאמת רוצים לשחק!

## הבעיה: אי-הופעות סדרתיות

**תרחיש אמיתי ממועדון כדורגל:**
- דני: נרשם ל-8 משחקים, הגיע ל-2
- יוסי: נרשם ל-6 משחקים, הגיע ל-1
- מיכל: נרשמה ל-10 משחקים, הגיעה ל-4
- רונית: נרשמה ל-5 משחקים, הגיעה ל-0 (!)
- אלי: נרשם ל-7 משחקים, הגיע ל-3

5 האנשים האלה חוסמים 36 מקומות שיכלו ללכת לשחקנים שבאמת מגיעים!

## הפתרון: מערכת חסימות חכמה

יש לכם 2 דרכים לחסום מישהו:

### אופציה 1: חסימה מבוססת משחקים (הכי נפוץ)
**"אתה לא יכול להירשם ל-5 המשחקים הבאים"**

**מתי להשתמש:**
- אי-הופעות חוזרות
- בעיות קלות
- רוצים שילמדו לקח
- בסופו של דבר תחזירו אותם

**איך זה עובד:**
- הם נרשמים למשחק הבא → המערכת אומרת "סליחה, אתה חסום מעוד 5 אירועים"
- אחרי כל אירוע שעובר (בין אם הם מנסים להירשם או לא), המונה יורד: 5 → 4 → 3 → 2 → 1 → 0
- כשהמונה מגיע ל-0 → החסימה מוסרת אוטומטית
- הם יכולים להירשם שוב!

### אופציה 2: חסימה מבוססת תאריך (לבעיות חמורות)
**"אתה לא יכול להירשם עד 1 במרץ"**

**מתי להשתמש:**
- התנהגות לא הולמת חמורה (קטטות, הטרדות)
- צריכים תקופת זמן מדויקת
- תקופת השעיה מבית הספר
- עונש זמני

**איך זה עובד:**
- הם מנסים להירשם → המערכת אומרת "אתה חסום עד 1 במרץ, 2026"
- ב-1 במרץ → החסימה פגה אוטומטית
- הם יכולים להירשם שוב
- או שאתם יכולים להסיר את זה מוקדם יותר ידנית אם אתם סולחים להם

## תהליך מלא: חסימת אדם עם אי-הופעה

**שלב 1: אחרי האירוע, אתם בודקים נוכחות**
- פותחים את משחק הכדורגל של שבת
- עוברים ללשונית נוכחות
- רואים 23 אנשים לא הגיעו (רשימה אדומה)

**שלב 2: מוצאים את העבריינים החוזרים**
- מסתכלים על רשימת אי-ההופעות
- אתם מזהים את דני - זו אי-ההופעה הרביעית שלו ברצף!
- אתם רואים את יוסי - גם עבריין חוזר
- הגיע הזמן לפעול

**שלב 3: בוחרים את מי לחסום**
- מסמנים את התיבה ליד דני
- מסמנים את התיבה ליד יוסי
- אתם יכולים לבחור מספר אנשים בבת אחת (חוסך זמן!)

**שלב 4: לוחצים על כפתור "צור חסימה"**
- דיאלוג צץ ושואל: "איזה סוג חסימה?"
- שני כפתורים גדולים: "מבוססת משחקים" או "מבוססת תאריך"

**שלב 5: עבור דני ויוסי, בוחרים מבוסס משחקים**
- לוחצים "חסימה מבוססת משחקים"
- מזינים: 5 (הם לא יכולים להירשם ל-5 האירועים הבאים)
- כותבים סיבה: "4 אי-הופעות רצופות ללא ביטול"
- הסיבה הזו פרטית - רק מנהלים רואים אותה

**שלב 6: מאשרים וזהו!**
- לוחצים "חסום משתמשים"
- המערכת מציגה: "✅ 2 משתמשים נחסמו בהצלחה"
- דני ויוסי עכשיו חסומים

## מה קורה אחר כך?

**יום שלישי הבא - דני מנסה להירשם למשחק של יום חמישי:**
- פותח קישור הרשמה
- ממלא את השם, מספר הטלפון
- לוחץ "להירשם"
- 🚫 **חסום!** המסך מראה:
  - "אתה חסום מ-5 אירועים עתידיים"
  - "סיבה: 4 אי-הופעות רצופות"
  - "צור קשר עם המנהל אם זו טעות"

**יום חמישי - האירוע קורה (בלי דני):**
- מונה החסימה שלו יורד אוטומטית: 5 → 4
- הוא עדיין לא יכול להירשם ל-4 האירועים הבאים

**אחרי ש-5 אירועים עוברים:**
- המונה מגיע ל-0
- החסימה מוסרת אוטומטית
- דני יכול להירשם שוב
- מקווים שהוא למד את הלקח!

## דוגמה אמיתית: מנהל מועדון כדורגל

**המצב שלכם:**
- אתם מנהלים משחק כדורגל שבועי
- 100 מקומות למשחק
- 15% מהשחקנים הם אי-הופעות כרוניות
- הם הורסים את זה לכולם

**שבוע 1: ללא מערכת חסימות**
- 85 נרשמים, 62 מגיעים
- אותם 5 אנשים לא מגיעים שוב
- שחקנים מתלוננים: "לא יכולתי להירשם כי זה היה מלא!"

**שבוע 2: אתם מיישמים חסימות**
- חוסמים את 5 העבריינים החוזרים מ-3 המשחקים הבאים
- עכשיו יש לכם 5 מקומות נוספים
- 5 שחקנים חדשים אמינים נרשמים!

**שבוע 3: תוצאות**
- 85 נרשמים, 78 מגיעים! (92% נוכחות!)
- רק 7 אי-הופעות (הרבה יותר טוב!)
- השחקנים מרוצים
- המשחקים מלאים עם אנשים שבאמת מגיעים

**חודש אחר כך:**
- השחקנים החסומים למדו את הלקח
- הם מותרים בחזרה
- הם עכשיו מבטלים אם הם לא יכולים להגיע
- כולם מרוויחים!

## חסימה מרובה: טיפול במספר עבריינים בבת אחת

**תרחיש: אחרי אירוע גדול, יש לכם 10 אי-הופעות**

**הדרך המהירה:**
1. בוחרים את כל 10 התיבות
2. לוחצים "צור חסימה"
3. בוחרים "מבוסס משחקים", מזינים "3"
4. כותבים סיבה: "אי-הופעה מ[שם האירוע]"
5. לוחצים "חסום משתמשים"
6. ✅ כל 10 נחסמו ב-30 שניות!

במקום לחסום אחד אחד (10 דקות), עשיתם את זה ב-30 שניות!

## טיפים לניהול חסימות

**כמה אירועים לחסום:**
- **עבירה ראשונה**: 1-2 אירועים (אזהרה)
- **עבירה שנייה**: 3-5 אירועים (אזהרה חמורה)
- **עבירה שלישית**: 10+ אירועים או קבוע

**מתי להשתמש במבוסס תאריך:**
- השעיה מבית ספר: "חסום עד שהשעיה מסתיימת"
- עונתי: "חסום עד שהעונה הבאה מתחילה"
- צינון: "חסום ל-30 יום"
- בעיות חמורות: קטטות, הטרדות, גניבה

**תעדו הכל:**
- תמיד כתבו סיבות ברורות
- תשכחו בעוד חודשיים למה חסמתם מישהו
- "3 אי-הופעות" ברור
- "התנהגות גרועה" מדי מעורפל

## מה משתמשים חסומים רואים

**כשמנסים להירשם:**
\`\`\`
❌ לא ניתן להירשם

אתה חסום מהרשמה לאירועים עתידיים.

סוג חסימה: 5 אירועים נותרים
סיבה: 3 אי-הופעות רצופות ללא ביטול

אם לדעתך זו טעות, צור קשר עם המנהל.
\`\`\`

**כשמנסים לעשות צ'ק-אין:**
\`\`\`
❌ צ'ק-אין נחסם

שם: דני כהן
טלפון: 050-1234567

חסום: 3 משחקים נותרים
סיבה: התנהגות לא הולמת

לא ניתן לבצע צ'ק-אין.
\`\`\`

## הסרת חסימה מוקדם (סליחה!)

**דני מתקשר אליכם:** "אני כל כך מצטער על אי-ההופעות. אמא שלי הייתה חולה. אתה יכול בבקשה להסיר את החסימה?"

**אתם מחליטים לתת לו הזדמנות נוספת:**
1. עוברים להגדרות → חסימות
2. מוצאים את דני ברשימת החסימות
3. לוחצים "הסר חסימה"
4. מאשרים
5. ✅ דני יכול להירשם שוב מיד!

**המערכת עוקבת:**
- מתי החסימה נוצרה
- מתי החסימה הוסרה
- מי הסיר אותה
- הסיבה המקורית (נשארת בהיסטוריה)

## שאלות נפוצות

**ש: האם מישהו יכול להירשם עם מספר טלפון אחר כדי לעקוף את החסימה?**
ת: כן, אבל אתם תראו שמות כפולים ותוכלו לחסום את המספר החדש גם כן. רוב האנשים לא ינסו את זה.

**ש: מה אם חסמתי מישהו בטעות?**
ת: פשוט הסירו את החסימה מיד. לוקח 5 שניות לבטל.

**ש: האם אני יכול לראות את כל המשתמשים החסומים כרגע?**
ת: כן! עברו להגדרות → חסימות. אתם רואים רשימה מלאה עם:
- שמות ומספרי טלפון
- סוג חסימה (מבוסס משחקים או תאריך)
- אירועים שנותרו או תאריך שבו זה פג
- סיבה
- מתי החסימה נוצרה

**ש: האם חסימות עובדות על פני כל האירועים שלי?**
ת: כן! אם אתם חוסמים מישהו, הם לא יכולים להירשם לאף אחד מהאירועים העתידיים שלכם עד שהחסימה פגה.

**ש: האם אני יכול לחסום מישהו לפני שהוא בכלל לא הגיע?**
ת: טכנית כן, אבל לא מומלץ. חסמו רק על סמך התנהגות ממשית, לא תחזיות.

**ש: מה אם מישהו ממשיך ליצור חשבונות חדשים?**
ת: חסמו את מספר הטלפון שלו. רוב האנשים לא יקבלו מספר טלפון חדש רק כדי להירשם למשחק כדורגל.

## מדדי הצלחה: האם החסימות עובדות?

**לפני חסימות (מועדון טיפוסי):**
- 85 הרשמות → 62 מגיעים (73% נוכחות)
- אותם אנשים לא מגיעים שוב ושוב
- שחקנים מתוסכלים לא יכולים לקבל מקומות
- זמן מבוזבז על אי-הופעות

**אחרי יישום חסימות (אותו מועדון אחרי חודשיים):**
- 85 הרשמות → 78-82 מגיעים (92-96% נוכחות!)
- עבריינים חוזרים למדו את הלקח
- שחקנים אמינים מקבלים מקומות
- משחקים טובים יותר עם קבוצות מלאות
- המוניטין של המועדון משתפר

## תוכנית המשחק שלכם

**שבוע 1:** התחילו לעקוב אחר נוכחות
**שבוע 2:** זהו עבריינים חוזרים (3+ אי-הופעות)
**שבוע 3:** חסמו אותם מ-3-5 אירועים
**שבוע 4:** ראו שהנוכחות משתפרת
**שבוע 5:** הסירו חסימות למי שלמדו
**שבוע 6:** שמרו על המערכת - חסמו כל עבריינים חוזרים חדשים

**תוצאה:** תוך חודשיים, יש לכם בסיס שחקנים אמין שבו אנשים או מגיעים או מבטלים כראוי. כולם מרוויחים!`,
        relatedFeatures: ['check-in-system', 'attendance-tracking']
      }
    ]
  }
]

// Helper functions
export function getAllFeatures(): WikiFeature[] {
  return wikiCategories.flatMap(cat => cat.features)
}

export function searchFeatures(query: string, language: 'en' | 'he' = 'en'): WikiFeature[] {
  const normalizedQuery = query.toLowerCase()
  return getAllFeatures().filter(feature => {
    const searchFields = language === 'he'
      ? [feature.titleHe, feature.descriptionHe, feature.contentHe, ...feature.keywords]
      : [feature.title, feature.description, feature.content, ...feature.keywords]

    return searchFields.some(field =>
      field.toLowerCase().includes(normalizedQuery)
    )
  })
}

export function filterFeatures(filters: {
  categories?: string[]
  types?: FeatureType[]
  roles?: UserRole[]
  difficulty?: DifficultyLevel[]
}): WikiFeature[] {
  let features = getAllFeatures()

  if (filters.categories && filters.categories.length > 0) {
    features = features.filter(f => filters.categories!.includes(f.category))
  }

  if (filters.types && filters.types.length > 0) {
    features = features.filter(f => filters.types!.includes(f.type))
  }

  if (filters.roles && filters.roles.length > 0) {
    features = features.filter(f =>
      f.roles.some(role => filters.roles!.includes(role) || f.roles.includes('ALL'))
    )
  }

  if (filters.difficulty && filters.difficulty.length > 0) {
    features = features.filter(f => filters.difficulty!.includes(f.difficulty))
  }

  return features
}

export function getCategoryById(id: string): WikiCategory | undefined {
  return wikiCategories.find(cat => cat.id === id)
}

export function getFeatureById(id: string): WikiFeature | undefined {
  return getAllFeatures().find(f => f.id === id)
}
