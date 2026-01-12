/**
 * Test Data Factory
 * Generates consistent test data for all test suites
 */

export const TEST_SCHOOLS = {
  schoolA: {
    name: 'Test School Alpha',
    slug: 'test-school-alpha',
    plan: 'FREE' as const,
  },
  schoolB: {
    name: 'Test School Beta',
    slug: 'test-school-beta',
    plan: 'PRO' as const,
  },
  schoolC: {
    name: 'Super Admin School',
    slug: 'super-admin-school',
    plan: 'ENTERPRISE' as const,
  },
}

export const TEST_ADMINS = {
  adminA: {
    email: 'admin-a@playwright-test.com',
    password: 'TestPass123!',
    name: 'Admin Alpha',
    role: 'ADMIN' as const,
    school: TEST_SCHOOLS.schoolA,
  },
  adminB: {
    email: 'admin-b@playwright-test.com',
    password: 'TestPass123!',
    name: 'Admin Beta',
    role: 'ADMIN' as const,
    school: TEST_SCHOOLS.schoolB,
  },
  superAdmin: {
    email: 'super@playwright-test.com',
    password: 'SuperPass123!',
    name: 'Super Administrator',
    role: 'SUPER_ADMIN' as const,
    school: null,
  },
  owner: {
    email: 'owner@playwright-test.com',
    password: 'OwnerPass123!',
    name: 'School Owner',
    role: 'OWNER' as const,
    school: TEST_SCHOOLS.schoolA,
  },
}

export const TEST_EVENTS = {
  soccerGame: {
    title: 'משחק כדורגל - גמר הליגה',
    description: 'משחק גמר ליגת הכיתות. הביאו נעלי ספורט ומים!',
    gameType: 'כדורגל 11 נגד 11',
    location: 'מגרש עירוני, תל אביב',
    capacity: 50,
    maxSpotsPerPerson: 2,
  },
  basketballTournament: {
    title: 'טורניר כדורסל',
    description: 'טורניר בין-כיתתי',
    gameType: 'כדורסל',
    location: 'אולם ספורט',
    capacity: 100,
    maxSpotsPerPerson: 1,
  },
  smallEvent: {
    title: 'אירוע קטן - בדיקת תור המתנה',
    description: 'אירוע לבדיקת רשימת המתנה',
    gameType: 'אחר',
    location: 'חדר ישיבות',
    capacity: 5,
    maxSpotsPerPerson: 1,
  },
}

export const TEST_REGISTRATIONS = {
  student1: {
    fullName: 'יוסי כהן',
    phone: '0501234567',
    childName: 'דני כהן',
    grade: 'כיתה ה',
  },
  student2: {
    fullName: 'שרה לוי',
    phone: '0507654321',
    childName: 'נועה לוי',
    grade: 'כיתה ו',
  },
  student3: {
    fullName: 'משה ישראלי',
    phone: '0521112222',
    childName: 'אריאל ישראלי',
    grade: 'כיתה ז',
  },
}

/**
 * Generate unique test data with timestamp to avoid conflicts
 */
export function generateUniqueTestData() {
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(7)

  return {
    school: {
      name: `Test School ${timestamp}`,
      slug: `test-school-${randomId}`,
    },
    admin: {
      email: `test-admin-${randomId}@playwright.com`,
      password: 'TestPass123!',
      name: `Test Admin ${timestamp}`,
    },
    event: {
      title: `Test Event ${timestamp}`,
      description: `Test event created at ${new Date().toISOString()}`,
      capacity: 30,
    },
  }
}

/**
 * Generate future date for event testing
 */
export function getFutureDate(daysFromNow: number = 7): string {
  const date = new Date()
  date.setDate(date.getDate() + daysFromNow)
  return date.toISOString()
}

/**
 * Generate past date for testing
 */
export function getPastDate(daysAgo: number = 7): string {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return date.toISOString()
}

/**
 * Phone number test cases (Israeli format)
 */
export const PHONE_TEST_CASES = {
  valid: [
    '0501234567',
    '050-123-4567',
    '050 123 4567',
    '+972501234567',
    '+972-50-123-4567',
  ],
  invalid: [
    '1234567',          // Too short
    '12345678901',      // Too long
    '0401234567',       // Invalid prefix
    'abc1234567',       // Contains letters
    '',                 // Empty
  ],
}

/**
 * Email test cases
 */
export const EMAIL_TEST_CASES = {
  valid: [
    'test@example.com',
    'user+tag@domain.co.il',
    'first.last@company.com',
  ],
  invalid: [
    'notanemail',
    '@example.com',
    'user@',
    'user @example.com',
    '',
  ],
}
