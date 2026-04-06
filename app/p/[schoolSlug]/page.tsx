'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Calendar, MapPin, AlertCircle, Loader2, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'

interface School {
  id: string
  name: string
  slug: string
  logo?: string
  primaryColor: string
}

interface SchoolEvent {
  id: string
  slug: string
  title: string
  description?: string
  gameType?: string
  location?: string
  startAt: string
  endAt?: string
  capacity: number
  status: string
  totalSpotsTaken: number
  spotsLeft: number
}

interface SchoolLandingData {
  type: 'school'
  school: School
  events: SchoolEvent[]
}

interface EventPageData {
  type: 'event'
  id: string
  title: string
  description?: string
  gameType?: string
  location?: string
  startAt: string
  endAt?: string
  capacity: number
  status: string
  maxSpotsPerPerson: number
  fieldsSchema: any[]
  conditions?: string
  requireAcceptance: boolean
  completionMessage?: string
  school: School
  _count: { registrations: number }
  totalSpotsTaken: number
}

// School Landing Page Component
function SchoolLandingPage({ data }: { data: SchoolLandingData }) {
  const router = useRouter()
  const { school, events } = data
  const schoolColor = school.primaryColor || '#3b82f6'

  return (
    <div
      className="min-h-screen py-12"
      style={{
        background: `linear-gradient(to bottom right, ${schoolColor}20, ${schoolColor}10)`,
      }}
    >
      <div className="max-w-6xl mx-auto px-4">
        {/* School Header */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          <div
            className="p-8 sm:p-12 text-white text-center"
            style={{
              background: `linear-gradient(135deg, ${schoolColor}, ${schoolColor}dd)`,
            }}
          >
            <div className="flex flex-col items-center gap-4">
              {school.logo ? (
                <img
                  src={school.logo}
                  alt={school.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center text-4xl font-bold border-4 border-white shadow-lg">
                  {school.name.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="text-4xl font-bold mb-2">{school.name}</h1>
                <p className="text-white/90 text-lg">כל האירועים שלנו במקום אחד</p>
              </div>
            </div>
          </div>
        </div>

        {/* Events Grid */}
        {events.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">אין אירועים פעילים כרגע</h2>
            <p className="text-gray-600">בקרו שוב בקרוב לראות אירועים חדשים</p>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              אירועים פתוחים להרשמה ({events.length})
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => {
                const spotsLeft = event.spotsLeft
                const isFull = spotsLeft <= 0
                const percentage = Math.min(100, (event.totalSpotsTaken / event.capacity) * 100)

                return (
                  <div
                    key={event.id}
                    className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow overflow-hidden cursor-pointer"
                    onClick={() => router.push(`/p/${school.slug}/${event.slug}`)}
                  >
                    {/* Event Header */}
                    <div
                      className="p-6 text-white"
                      style={{
                        background: `linear-gradient(to right, ${schoolColor}, ${schoolColor}dd)`,
                      }}
                    >
                      <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                      {event.gameType && (
                        <span className="inline-block bg-white/20 px-3 py-1 rounded-full text-sm">
                          {event.gameType}
                        </span>
                      )}
                    </div>

                    {/* Event Details */}
                    <div className="p-6 space-y-3">
                      {event.description && (
                        <p className="text-gray-600 text-sm line-clamp-2">{event.description}</p>
                      )}

                      <div className="flex items-start gap-2">
                        <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">
                          {format(new Date(event.startAt), 'EEEE, dd בMMMM', { locale: he })}
                          <br />
                          {format(new Date(event.startAt), 'HH:mm', { locale: he })}
                        </span>
                      </div>

                      {event.location && (
                        <div className="flex items-start gap-2">
                          <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-700">{event.location}</span>
                        </div>
                      )}

                      {/* Availability */}
                      <div className="pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-600">זמינות</span>
                          <span
                            className={`text-xs font-bold ${
                              isFull
                                ? 'text-red-600'
                                : spotsLeft < 10
                                  ? 'text-yellow-600'
                                  : 'text-green-600'
                            }`}
                          >
                            {isFull ? 'מלא' : `${spotsLeft} מקומות`}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isFull
                                ? 'bg-red-500'
                                : percentage > 80
                                  ? 'bg-yellow-500'
                                  : 'bg-green-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>

                      {/* CTA Button */}
                      <button
                        className="w-full mt-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2"
                        style={{
                          background: `linear-gradient(to right, ${schoolColor}, ${schoolColor}dd)`,
                        }}
                      >
                        {isFull ? 'הרשמה לרשימת המתנה' : 'להרשמה'}
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 text-sm">
            מערכת ניהול אירועים של <span className="font-bold">{school.name}</span>
          </p>
        </div>
      </div>
    </div>
  )
}

// Main component that determines which page to show
export default function PublicPage() {
  const params = useParams()
  const schoolSlug = params.schoolSlug as string

  const [data, setData] = useState<SchoolLandingData | EventPageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetchData()
  }, [schoolSlug])

  const fetchData = async () => {
    try {
      const response = await fetch(`/api/p/${schoolSlug}`)
      if (response.ok) {
        const result = await response.json()
        setData(result)
      } else {
        setError(true)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">טוען...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">הדף לא נמצא</h1>
          <p className="text-gray-600">הדף המבוקש לא קיים או לא זמין</p>
        </div>
      </div>
    )
  }

  // This route now ONLY handles school landing pages
  // Events use /p/[schoolSlug]/[eventSlug] format
  if (data.type === 'school') {
    return <SchoolLandingPage data={data as SchoolLandingData} />
  }

  // If not a school type, show error
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">הדף לא נמצא</h1>
        <p className="text-gray-600">אירועים נמצאים כעת בכתובת הארגון שלהם</p>
      </div>
    </div>
  )
}
