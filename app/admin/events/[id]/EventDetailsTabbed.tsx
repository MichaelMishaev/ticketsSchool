'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useParams, useSearchParams } from 'next/navigation'
import { Loader2, AlertCircle } from 'lucide-react'
import EventTabNavigation, { TabId } from '@/components/admin/event-details/EventTabNavigation'
import MobileBottomTabBar from '@/components/admin/event-details/MobileBottomTabBar'
import FloatingCheckInMenu, {
  CheckInButton,
} from '@/components/admin/event-details/FloatingCheckInMenu'
import OverviewTab from '@/components/admin/event-details/tabs/OverviewTab'
import DevFeatureLabel from '@/components/dev/DevFeatureLabel'

const TabSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
  </div>
)

const RegistrationsTab = dynamic(
  () => import('@/components/admin/event-details/tabs/RegistrationsTab'),
  { loading: TabSpinner }
)
const CheckInTab = dynamic(() => import('@/components/admin/event-details/tabs/CheckInTab'), {
  loading: TabSpinner,
})
const ReportsTab = dynamic(() => import('@/components/admin/event-details/tabs/ReportsTab'), {
  loading: TabSpinner,
})

const TAB_FEATURE_MAP: Record<TabId, string> = {
  overview: 'event-management',
  registrations: 'registration',
  checkin: 'check-in',
  reports: 'reporting',
}

interface Registration {
  id: string
  data: Record<string, unknown>
  phoneNumber: string
  spotsCount: number
  status: 'CONFIRMED' | 'WAITLIST' | 'CANCELLED'
  confirmationCode: string
  createdAt: Date
}

interface Event {
  id: string
  slug: string
  title: string
  description: string | null
  gameType: string | null
  location: string | null
  startAt: Date
  endAt: Date | null
  capacity: number
  status: 'OPEN' | 'PAUSED' | 'CLOSED'
  school: {
    slug: string
  }
  _count?: {
    registrations: number
  }
  spotsReserved: number
}

export default function EventDetailsTabbed() {
  const params = useParams()
  const searchParams = useSearchParams()
  const eventId = params.id as string

  const [activeTab, setActiveTab] = useState<TabId>(() => {
    const urlTab = searchParams.get('tab') as TabId | null
    if (urlTab && ['overview', 'registrations', 'checkin', 'reports'].includes(urlTab)) {
      return urlTab
    }
    return 'overview'
  })
  const [event, setEvent] = useState<Event | null>(null)
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [checkInLink, setCheckInLink] = useState<string | null>(null)
  const tabContentRef = useRef<HTMLDivElement>(null)

  // Check if check-in is available (same logic as CheckInTab)
  // Check-in should only show when it's the event day AND event hasn't ended
  const isCheckInAvailable = event
    ? (() => {
        const now = new Date()
        const eventDateObj = new Date(event.startAt)
        const isEventDay = now.toDateString() === eventDateObj.toDateString()
        const isPastEvent = now > eventDateObj

        // Show check-in when: it's event day AND event hasn't passed
        // This matches CheckInTab logic: else if (isEventDay) shows interface
        // The if (isPastEvent) check happens first, so we need !isPastEvent
        return !isPastEvent && isEventDay
      })()
    : false

  // Sync URL when tab changes (replaceState bypasses Next.js navigation — no re-render)
  useEffect(() => {
    const url = new URL(window.location.href)
    url.searchParams.set('tab', activeTab)
    window.history.replaceState(null, '', url.toString())
  }, [activeTab])

  // Scroll to top of tab content when tab changes
  useEffect(() => {
    requestAnimationFrame(() => {
      if (tabContentRef.current) {
        tabContentRef.current.scrollIntoView({ behavior: 'instant', block: 'start' })
      } else {
        window.scrollTo({ top: 0, behavior: 'instant' })
      }
    })
  }, [activeTab])

  // Fetch event data
  useEffect(() => {
    fetchEvent()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}`)
      if (response.ok) {
        const data = await response.json()
        setEvent(data)
        setRegistrations(data.registrations || [])

        // Fetch check-in link
        if (data.checkInToken) {
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin
          setCheckInLink(`${baseUrl}/check-in/${eventId}/${data.checkInToken}`)
        }
      }
    } catch (error) {
      console.error('Error fetching event:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-base text-gray-600">טוען פרטי אירוע...</p>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">האירוע לא נמצא</h2>
      </div>
    )
  }

  // Floating menu handlers
  const handleScanQR = () => {
    // Navigate to check-in tab and trigger QR scanner
    setActiveTab('checkin')
    // You can add additional logic here to auto-open QR scanner
  }

  const handleManualCheckIn = () => {
    // Navigate to check-in tab and focus on manual input
    setActiveTab('checkin')
  }

  const handleViewReport = () => {
    // Navigate to reports tab
    setActiveTab('reports')
  }

  return (
    <div className="bg-gray-50 -mx-4 -mt-4 -mb-24 sm:-mx-6 lg:-mx-8 sm:-mt-10 sm:-mb-10">
      {/* Desktop top navigation - hidden on mobile */}
      <EventTabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content - Add padding for bottom bars */}
      <div
        ref={tabContentRef}
        role="tabpanel"
        id={`${activeTab}-panel`}
        aria-labelledby={`${activeTab}-tab`}
        className={`${
          activeTab === 'overview' && isCheckInAvailable && event.status === 'OPEN' && checkInLink
            ? 'pb-32 md:pb-20' // Mobile: extra padding for check-in button + tabs, Desktop: padding for footer
            : 'pb-20 md:pb-0' // Mobile: normal tab bar padding, Desktop: no padding
        }`}
      >
        {activeTab === 'overview' && (
          <OverviewTab
            event={event}
            onEventUpdate={fetchEvent}
            onTabChange={(tab) => setActiveTab(tab as TabId)}
          />
        )}
        {activeTab === 'registrations' && (
          <RegistrationsTab
            eventId={eventId}
            registrations={registrations}
            onRegistrationUpdate={fetchEvent}
          />
        )}
        {activeTab === 'checkin' && <CheckInTab eventId={eventId} eventDate={event.startAt} />}
        {activeTab === 'reports' && <ReportsTab eventId={eventId} />}
      </div>

      {/* Floating Check-In Menu - Desktop only, only on overview tab, only on event day */}
      {activeTab === 'overview' && isCheckInAvailable && event.status === 'OPEN' && (
        <FloatingCheckInMenu
          eventId={eventId}
          onScanQR={handleScanQR}
          onManualCheckIn={handleManualCheckIn}
          onViewReport={handleViewReport}
          checkInLink={checkInLink}
        />
      )}

      {/* Mobile bottom navigation - hidden on desktop */}
      <MobileBottomTabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        checkInButton={
          activeTab === 'overview' &&
          isCheckInAvailable &&
          event.status === 'OPEN' &&
          checkInLink ? (
            <CheckInButton checkInLink={checkInLink} />
          ) : undefined
        }
      />
      <DevFeatureLabel feature={TAB_FEATURE_MAP[activeTab]} />
    </div>
  )
}
