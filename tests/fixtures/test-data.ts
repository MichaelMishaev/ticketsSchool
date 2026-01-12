/**
 * Test Data Builders
 *
 * Provides factory functions for creating test data
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()

/**
 * Generate a truly unique slug for test data
 * Uses UUID to ensure uniqueness even in parallel test execution
 */
function generateUniqueSlug(prefix: string = 'test-school'): string {
  // UUID guarantees uniqueness across all parallel workers
  const uuid = randomUUID().split('-')[0] // Use first segment (8 chars)
  return `${prefix}-${uuid}`
}

/**
 * Generate unique ID for test data
 * Combines timestamp with UUID for readability and guaranteed uniqueness
 */
function generateUniqueId(): string {
  const uuid = randomUUID().split('-')[0]
  return `${Date.now()}-${uuid}`
}

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
      const baseSlug = name.toLowerCase().replace(/\s+/g, '-')
      const uuid = randomUUID().split('-')[0]
      this.data.slug = `${baseSlug}-${uuid}`
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
      const uniqueId = generateUniqueId()
      this.data.name = 'Test School ' + uniqueId
    }
    if (!this.data.slug) {
      // Generate unique slug using UUID - guaranteed unique in parallel tests
      this.data.slug = generateUniqueSlug('test-school')
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
    onboardingCompleted: true, // Skip onboarding for test admins
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
      // Generate unique email using UUID - guaranteed unique in parallel tests
      const uniqueId = generateUniqueId()
      this.data.email = `test-${uniqueId}@test.com`
    }

    // Auto-create school if not provided and not SUPER_ADMIN
    if (!this.data.schoolId && this.data.role !== 'SUPER_ADMIN') {
      const school = await new SchoolBuilder().create()
      this.data.schoolId = school.id
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
      const baseSlug = title.toLowerCase().replace(/\s+/g, '-')
      const uuid = randomUUID().split('-')[0]
      this.data.slug = `${baseSlug}-${uuid}`
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

  withMaxSpotsPerPerson(max: number) {
    this.data.maxSpotsPerPerson = max
    return this
  }

  withPayment(
    required: boolean,
    timing: 'UPFRONT' | 'POST_REGISTRATION',
    pricingModel: 'PER_GUEST' | 'FLAT_RATE',
    priceAmount: number,
    currency: string = 'ILS'
  ) {
    this.data.paymentRequired = required
    this.data.paymentTiming = timing
    this.data.pricingModel = pricingModel
    this.data.priceAmount = priceAmount
    this.data.currency = currency
    return this
  }

  async create(): Promise<TestEvent> {
    if (!this.data.title) {
      const uniqueId = generateUniqueId()
      this.data.title = 'Test Event ' + uniqueId
    }
    if (!this.data.slug) {
      this.data.slug = generateUniqueSlug('test-event')
    }
    if (!this.data.startDate) {
      this.inFuture()
    }
    if (!this.data.schoolId) {
      throw new Error('Event must have a schoolId')
    }

    // Map builder fields to schema fields
    const { startDate, startTime, ...rest } = this.data

    // Combine startDate and startTime into startAt DateTime
    let startAt = startDate
    if (startTime && startDate) {
      const [hours, minutes] = startTime.split(':')
      startAt = new Date(startDate)
      startAt.setHours(parseInt(hours), parseInt(minutes), 0, 0)
    }

    const eventData = {
      ...rest,
      startAt,
    }

    const event = await prisma.event.create({
      data: eventData as any,
    })

    return {
      ...event,
      startDate,
      startTime,
    } as TestEvent
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
    // Set defaults
    if (!this.data.name) {
      const uniqueId = generateUniqueId()
      this.data.name = 'Test User ' + uniqueId
    }
    if (!this.data.email) {
      const uniqueId = generateUniqueId()
      this.data.email = `test-user-${uniqueId}@test.com`
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

    // Map builder fields to schema fields
    const { name, email, phone, spots, customFields, ...rest } = this.data

    const registrationData = {
      ...rest,
      phoneNumber: phone, // Schema uses phoneNumber
      spotsCount: spots || 1, // Schema uses spotsCount
      data: {
        // Schema stores name/email in JSON data field
        name,
        email,
        ...(customFields || {}),
      },
    }

    const registration = await prisma.registration.create({
      data: registrationData as any,
    })

    // Return with builder field names for test convenience
    return {
      ...registration,
      name,
      email,
      phone,
      spots: registration.spotsCount,
    } as TestRegistration
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
    .withSlug(generateUniqueSlug('school-a-test'))
    .withPlan('STARTER')
    .create()

  const schoolAAdmin = await createAdmin()
    .withEmail(`school-a-admin-${randomUUID().split('-')[0]}@test.com`)
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
    .withSlug(generateUniqueSlug('school-b-test'))
    .withPlan('PRO')
    .create()

  const schoolBAdmin = await createAdmin()
    .withEmail(`school-b-admin-${randomUUID().split('-')[0]}@test.com`)
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
