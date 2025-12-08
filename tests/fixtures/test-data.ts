/**
 * Test Data Builders
 *
 * Provides factory functions for creating test data
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export interface TestSchool {
  id: string
  name: string
  slug: string
  plan: string
}

export interface TestAdmin {
  id: string
  email: string
  password: string
  name: string
  role: string
  schoolId: string | null
  emailVerified: boolean
}

export interface TestEvent {
  id: string
  title: string
  slug: string
  capacity: number
  spotsReserved: number
  startDate: Date
  startTime: string
  location: string
  schoolId: string
}

export interface TestRegistration {
  id: string
  name: string
  email: string
  phone: string
  spots: number
  status: string
  confirmationCode: string
  eventId: string
  customFields?: any
}

/**
 * School Data Builder
 */
export class SchoolBuilder {
  private data: Partial<any> = {
    plan: 'STARTER',
  }

  withName(name: string) {
    this.data.name = name
    if (!this.data.slug) {
      this.data.slug = name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now()
    }
    return this
  }

  withSlug(slug: string) {
    this.data.slug = slug
    return this
  }

  withPlan(plan: 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE') {
    this.data.plan = plan
    return this
  }

  async create(): Promise<TestSchool> {
    if (!this.data.name) {
      this.data.name = 'Test School ' + Date.now()
    }
    if (!this.data.slug) {
      this.data.slug = 'test-school-' + Date.now()
    }

    const school = await prisma.school.create({
      data: this.data as any,
    })

    return school as TestSchool
  }
}

/**
 * Admin Data Builder
 */
export class AdminBuilder {
  private data: Partial<any> = {
    name: 'Test Admin',
    emailVerified: true,
    role: 'ADMIN',
  }

  withEmail(email: string) {
    this.data.email = email
    return this
  }

  withPassword(password: string) {
    this.data.password = password
    return this
  }

  withName(name: string) {
    this.data.name = name
    return this
  }

  withRole(role: 'SUPER_ADMIN' | 'OWNER' | 'ADMIN' | 'MANAGER' | 'VIEWER') {
    this.data.role = role
    return this
  }

  withSchool(schoolId: string | null) {
    this.data.schoolId = schoolId
    return this
  }

  emailVerified(verified: boolean) {
    this.data.emailVerified = verified
    return this
  }

  async create(): Promise<TestAdmin> {
    if (!this.data.email) {
      this.data.email = `test-${Date.now()}@test.com`
    }

    const password = this.data.password || 'TestPassword123!'
    const hashedPassword = await bcrypt.hash(password, 10)

    // Remove password from data (it's not a field in the schema)
    const { password: _, ...adminData } = this.data

    const admin = await prisma.admin.create({
      data: {
        ...adminData,
        passwordHash: hashedPassword,
      },
    })

    return {
      ...admin,
      password, // Return plain password for testing
    } as TestAdmin
  }
}

/**
 * Event Data Builder
 */
export class EventBuilder {
  private data: Partial<any> = {
    capacity: 50,
    spotsReserved: 0,
    location: 'Test Location',
    description: 'Test event description',
  }

  withTitle(title: string) {
    this.data.title = title
    if (!this.data.slug) {
      this.data.slug = title.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now()
    }
    return this
  }

  withSlug(slug: string) {
    this.data.slug = slug
    return this
  }

  withCapacity(capacity: number) {
    this.data.capacity = capacity
    return this
  }

  withSpotsReserved(spots: number) {
    this.data.spotsReserved = spots
    return this
  }

  withSchool(schoolId: string) {
    this.data.schoolId = schoolId
    return this
  }

  withDate(date: Date) {
    this.data.startDate = date
    return this
  }

  withTime(time: string) {
    this.data.startTime = time
    return this
  }

  withLocation(location: string) {
    this.data.location = location
    return this
  }

  withCustomFields(fieldsSchema: any) {
    this.data.fieldsSchema = fieldsSchema
    return this
  }

  inFuture() {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    this.data.startDate = tomorrow
    this.data.startTime = '18:00'
    return this
  }

  inPast() {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    this.data.startDate = yesterday
    this.data.startTime = '18:00'
    return this
  }

  full() {
    this.data.spotsReserved = this.data.capacity
    return this
  }

  async create(): Promise<TestEvent> {
    if (!this.data.title) {
      this.data.title = 'Test Event ' + Date.now()
    }
    if (!this.data.slug) {
      this.data.slug = 'test-event-' + Date.now()
    }
    if (!this.data.startDate) {
      this.inFuture()
    }
    if (!this.data.schoolId) {
      throw new Error('Event must have a schoolId')
    }

    const event = await prisma.event.create({
      data: this.data as any,
    })

    return event as TestEvent
  }
}

/**
 * Registration Data Builder
 */
export class RegistrationBuilder {
  private data: Partial<any> = {
    spots: 1,
    status: 'CONFIRMED',
  }

  withName(name: string) {
    this.data.name = name
    return this
  }

  withEmail(email: string) {
    this.data.email = email
    return this
  }

  withPhone(phone: string) {
    this.data.phone = phone
    return this
  }

  withSpots(spots: number) {
    this.data.spots = spots
    return this
  }

  withStatus(status: 'CONFIRMED' | 'WAITLIST' | 'CANCELLED') {
    this.data.status = status
    return this
  }

  withEvent(eventId: string) {
    this.data.eventId = eventId
    return this
  }

  withCustomFields(customFields: any) {
    this.data.customFields = customFields
    return this
  }

  confirmed() {
    this.data.status = 'CONFIRMED'
    return this
  }

  waitlist() {
    this.data.status = 'WAITLIST'
    return this
  }

  cancelled() {
    this.data.status = 'CANCELLED'
    return this
  }

  async create(): Promise<TestRegistration> {
    if (!this.data.name) {
      this.data.name = 'Test User ' + Date.now()
    }
    if (!this.data.email) {
      this.data.email = `test-user-${Date.now()}@test.com`
    }
    if (!this.data.phone) {
      this.data.phone = `050${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`
    }
    if (!this.data.eventId) {
      throw new Error('Registration must have an eventId')
    }
    if (!this.data.confirmationCode) {
      this.data.confirmationCode = this.generateConfirmationCode()
    }

    const registration = await prisma.registration.create({
      data: this.data as any,
    })

    return registration as TestRegistration
  }

  private generateConfirmationCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Exclude confusing chars
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }
}

/**
 * Convenience factory functions
 */
export const createSchool = () => new SchoolBuilder()
export const createAdmin = () => new AdminBuilder()
export const createEvent = () => new EventBuilder()
export const createRegistration = () => new RegistrationBuilder()

/**
 * Cleanup function for tests
 */
export async function cleanupTestData() {
  // Delete in order to respect foreign keys
  await prisma.registration.deleteMany({
    where: {
      email: {
        contains: '@test.com',
      },
    },
  })

  await prisma.event.deleteMany({
    where: {
      slug: {
        startsWith: 'test-',
      },
    },
  })

  await prisma.admin.deleteMany({
    where: {
      email: {
        contains: '@test.com',
      },
    },
  })

  await prisma.school.deleteMany({
    where: {
      slug: {
        startsWith: 'test-',
      },
    },
  })
}

/**
 * Create complete test scenario
 */
export async function createCompleteTestScenario() {
  // School A
  const schoolA = await createSchool()
    .withName('School A Test')
    .withSlug('school-a-test-' + Date.now())
    .withPlan('STARTER')
    .create()

  const schoolAAdmin = await createAdmin()
    .withEmail(`school-a-admin-${Date.now()}@test.com`)
    .withPassword('TestPassword123!')
    .withRole('ADMIN')
    .withSchool(schoolA.id)
    .create()

  const schoolAEvent = await createEvent()
    .withTitle('School A Event')
    .withCapacity(50)
    .withSchool(schoolA.id)
    .inFuture()
    .create()

  // School B
  const schoolB = await createSchool()
    .withName('School B Test')
    .withSlug('school-b-test-' + Date.now())
    .withPlan('PRO')
    .create()

  const schoolBAdmin = await createAdmin()
    .withEmail(`school-b-admin-${Date.now()}@test.com`)
    .withPassword('TestPassword123!')
    .withRole('ADMIN')
    .withSchool(schoolB.id)
    .create()

  const schoolBEvent = await createEvent()
    .withTitle('School B Event')
    .withCapacity(30)
    .withSchool(schoolB.id)
    .inFuture()
    .create()

  return {
    schoolA,
    schoolAAdmin,
    schoolAEvent,
    schoolB,
    schoolBAdmin,
    schoolBEvent,
  }
}

export { prisma }
