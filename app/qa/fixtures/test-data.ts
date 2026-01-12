/**
 * Test data and constants for QA tests
 */

export const TEST_USERS = {
  superAdmin: {
    email: 'admin@beeri.com',
    password: 'beeri123',
    name: 'Super Admin',
    role: 'SUPER_ADMIN',
    schoolSlug: 'beeri'
  },

  // These will be created during tests
  schoolAdmin1: {
    email: 'admin1@testschool1.com',
    password: 'test123456',
    name: 'School 1 Admin',
    role: 'ADMIN',
    schoolName: 'Test School 1',
    schoolSlug: 'test-school-1'
  },

  schoolAdmin2: {
    email: 'admin2@testschool2.com',
    password: 'test123456',
    name: 'School 2 Admin',
    role: 'ADMIN',
    schoolName: 'Test School 2',
    schoolSlug: 'test-school-2'
  },

  teamMember: {
    email: 'team@testschool1.com',
    password: 'test123456',
    name: 'Team Member',
    role: 'MANAGER'
  }
}

export const TEST_EVENTS = {
  school1Event: {
    title: 'Test Event for School 1',
    description: 'This event belongs to Test School 1',
    location: 'School 1 Location',
    capacity: 50,
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
    startTime: '10:00'
  },

  school2Event: {
    title: 'Test Event for School 2',
    description: 'This event belongs to Test School 2',
    location: 'School 2 Location',
    capacity: 30,
    startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days from now
    startTime: '14:00'
  }
}

/**
 * Generate unique email for testing
 */
export function generateTestEmail(prefix: string = 'test') {
  const timestamp = Date.now()
  return `${prefix}-${timestamp}@playwright-test.com`
}

/**
 * Generate unique school slug
 */
export function generateSchoolSlug(name: string) {
  return name.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    + '-' + Date.now()
}
