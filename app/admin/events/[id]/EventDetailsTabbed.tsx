'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Loader2, AlertCircle } from 'lucide-react'
import EventTabNavigation, { TabId } from '@/components/admin/event-details/EventTabNavigation'
import MobileBottomTabBar from '@/components/admin/event-details/MobileBottomTabBar'
import OverviewTab from '@/components/admin/event-details/tabs/OverviewTab'
import RegistrationsTab from '@/components/admin/event-details/tabs/RegistrationsTab'
import CheckInTab from '@/components/admin/event-details/tabs/CheckInTab'
import ReportsTab from '@/components/admin/event-details/tabs/ReportsTab'

interface FieldSchema {
  id: string
  label: string
  type: string
  required?: boolean
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

  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [event, setEvent] = useState<Event | null>(null)
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)

  // Initialize active tab from URL query param
  useEffect(() => {
    const urlTab = searchParams.get('tab') as TabId | null
    if (urlTab && ['overview', 'registrations', 'checkin', 'reports'].includes(urlTab)) {
      setActiveTab(urlTab)
    }
  }, [searchParams])

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop top navigation - hidden on mobile */}
      <EventTabNavigation
        eventId={eventId}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Tab Content - Add padding for mobile bottom bar */}
      <div
        role="tabpanel"
        id={`${activeTab}-panel`}
        aria-labelledby={`${activeTab}-tab`}
        className="pb-20 md:pb-0"
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
        {activeTab === 'checkin' && (
          <CheckInTab eventId={eventId} eventDate={event.startAt} />
        )}
        {activeTab === 'reports' && (
          <ReportsTab eventId={eventId} />
        )}
      </div>

      {/* Mobile bottom navigation - hidden on desktop */}
      <MobileBottomTabBar
        eventId={eventId}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  )
}
