/**
 * @LOCKED
 * Reason: Business-critical public registration UI (server component)
 * Scope:
 *   - Event data fetching via Prisma (server-side)
 *   - Static screens (not found, CLOSED, PAUSED, ended)
 *   - SEO metadata via generateMetadata
 *   - fieldsSchema normalization
 * See: /docs/infrastructure/GOLDEN_PATHS.md#REGISTRATION_SUBMIT_V1
 *
 * Invariants Protected:
 *   - INVARIANT_MT_001: Multi-tenant isolation (schoolSlug + eventSlug)
 *   - INVARIANT_DATA_001: Phone normalization
 */
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { Calendar, MapPin, Clock, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import { prisma } from '@/lib/prisma'
import EventPageClient from './EventPageClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata({
  params,
}: {
  params: Promise<{ schoolSlug: string; eventSlug: string }>
}): Promise<Metadata> {
  const { schoolSlug, eventSlug } = await params

  const event = await prisma.event.findFirst({
    where: { slug: eventSlug, school: { slug: schoolSlug } },
    select: {
      title: true,
      description: true,
      coverImage: true,
      school: { select: { name: true } },
    },
  })

  if (!event) return { title: 'אירוע לא נמצא' }

  const title = `${event.title} | ${event.school.name}`
  const description = event.description || `הרשמה לאירוע ${event.title}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: event.coverImage ? [event.coverImage] : [],
    },
  }
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ schoolSlug: string; eventSlug: string }>
}) {
  const { schoolSlug, eventSlug } = await params

  // Single query: school + event + confirmed registration count
  const event = await prisma.event.findFirst({
    where: {
      slug: eventSlug,
      school: { slug: schoolSlug },
    },
    include: {
      school: {
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
          primaryColor: true,
        },
      },
      _count: {
        select: {
          registrations: {
            where: {
              status: 'CONFIRMED',
            },
          },
        },
      },
    },
  })

  if (!event) {
    notFound()
  }

  // Parallel: aggregate spots + table capacity (if TABLE_BASED)
  const [aggregateResult, tables] = await Promise.all([
    prisma.registration.aggregate({
      where: {
        eventId: event.id,
        status: 'CONFIRMED',
      },
      _sum: { spotsCount: true },
    }),
    event.eventType === 'TABLE_BASED'
      ? prisma.table.findMany({
          where: { eventId: event.id },
          select: { capacity: true },
        })
      : Promise.resolve([]),
  ])

  const totalSpotsTaken = aggregateResult._sum.spotsCount ?? 0
  const maxTableCapacity =
    event.eventType === 'TABLE_BASED'
      ? tables.length > 0
        ? Math.max(...tables.map((t) => t.capacity))
        : 12
      : null

  // Normalize fieldsSchema — ensure required phone/name/email fields exist
  const fieldsSchema: any[] = Array.isArray(event.fieldsSchema)
    ? [...(event.fieldsSchema as any[])]
    : []

  const hasPhoneField = fieldsSchema.some((f: any) => f.name === 'phone')
  const hasNameField = fieldsSchema.some((f: any) => f.name === 'name')
  const hasEmailField = fieldsSchema.some((f: any) => f.name === 'email')

  if (!hasPhoneField) {
    fieldsSchema.unshift({
      id: 'phone',
      name: 'phone',
      label: 'טלפון',
      type: 'text',
      required: true,
      placeholder: '05X-XXX-XXXX',
    })
  }

  if (!hasNameField) {
    fieldsSchema.unshift({
      id: 'name',
      name: 'name',
      label: 'שם מלא',
      type: 'text',
      required: true,
      placeholder: 'שם פרטי ומשפחה',
    })
  }

  // CRITICAL: Email is REQUIRED for payment events (YaadPay API requirement)
  if (event.paymentRequired && !hasEmailField) {
    fieldsSchema.splice(2, 0, {
      id: 'email',
      name: 'email',
      label: 'אימייל',
      type: 'email',
      required: true,
      placeholder: 'your@email.com',
    })
  }

  // --- Static screens (zero JS, server-rendered) ---

  // CLOSED
  if (event.status === 'CLOSED') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">ההרשמה סגורה</h1>
          <p className="text-gray-600">ההרשמה לאירוע זה הסתיימה</p>
        </div>
      </div>
    )
  }

  // PAUSED
  if (event.status === 'PAUSED') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">ההרשמה מושהית</h1>
          <p className="text-gray-600">ההרשמה לאירוע זה מושהית זמנית</p>
          <p className="text-sm text-gray-500 mt-2">נא לבדוק שוב מאוחר יותר</p>
        </div>
      </div>
    )
  }

  // Check event timing state
  const now = new Date()
  const eventStart = new Date(event.startAt)
  const eventEnd = event.endAt
    ? new Date(event.endAt)
    : new Date(eventStart.getTime() + 2 * 60 * 60 * 1000) // Default: startAt + 2 hours

  const hasEventStarted = now >= eventStart
  const hasEventEnded = now >= eventEnd

  // Event has ended
  if (hasEventEnded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">האירוע הסתיים</h1>
          <p className="text-gray-600 mb-6">לא ניתן להירשם לאירוע שכבר התקיים</p>

          {/* Event details for transparency */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex items-center justify-center gap-2 text-gray-700">
              <Calendar className="w-4 h-4" />
              <span>{format(eventStart, "EEEE, d בMMMM yyyy 'בשעה' HH:mm", { locale: he })}</span>
            </div>
            {event.location && (
              <div className="flex items-center justify-center gap-2 text-gray-700">
                <MapPin className="w-4 h-4" />
                <span>{event.location}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Event has started but not ended
  if (hasEventStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <Clock className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">האירוע התחיל</h1>
          <p className="text-gray-600 mb-6">ההרשמה נסגרה - האירוע מתקיים כעת</p>

          {/* Event details for context */}
          <div className="bg-amber-50 rounded-lg p-4 space-y-2 text-sm border border-amber-200">
            <div className="flex items-center justify-center gap-2 text-gray-700">
              <Calendar className="w-4 h-4" />
              <span>{format(eventStart, "EEEE, d בMMMM yyyy 'בשעה' HH:mm", { locale: he })}</span>
            </div>
            {event.location && (
              <div className="flex items-center justify-center gap-2 text-gray-700">
                <MapPin className="w-4 h-4" />
                <span>{event.location}</span>
              </div>
            )}
            <div className="pt-2 border-t border-amber-200 text-amber-800 font-medium">
              הרשמה אפשרית רק לפני תחילת האירוע
            </div>
          </div>
        </div>
      </div>
    )
  }

  // --- OPEN event: serialize and pass to client component ---
  const serializedEvent = {
    id: event.id,
    title: event.title,
    description: event.description ?? undefined,
    gameType: event.gameType ?? undefined,
    location: event.location ?? undefined,
    startAt: event.startAt.toISOString(),
    endAt: event.endAt ? event.endAt.toISOString() : undefined,
    capacity: event.capacity,
    maxSpotsPerPerson: event.maxSpotsPerPerson,
    eventType: event.eventType as 'CAPACITY_BASED' | 'TABLE_BASED',
    maxTableCapacity,
    fieldsSchema,
    conditions: event.conditions ?? undefined,
    requireAcceptance: event.requireAcceptance,
    completionMessage: event.completionMessage ?? undefined,
    coverImage: event.coverImage,
    allowCancellation: event.allowCancellation ?? undefined,
    paymentRequired: event.paymentRequired,
    paymentTiming: (event.paymentTiming as 'UPFRONT' | 'POST_REGISTRATION') ?? undefined,
    pricingModel: (event.pricingModel as 'FIXED_PRICE' | 'PER_GUEST' | 'FREE') ?? undefined,
    priceAmount: event.priceAmount ? Number(event.priceAmount) : undefined,
    currency: event.currency ?? undefined,
    _count: event._count,
    totalSpotsTaken,
    status: event.status,
    school: {
      id: event.school.id,
      name: event.school.name,
      slug: event.school.slug,
      logo: event.school.logo ?? undefined,
      primaryColor: event.school.primaryColor,
    },
    schoolSlug,
    eventSlug,
  }

  return <EventPageClient event={serializedEvent} />
}
