'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Calendar, MapPin, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import FeedbackInline from '@/components/FeedbackInline'

interface School {
  id: string
  name: string
  slug: string
  logo?: string
  primaryColor: string
}

interface Event {
  id: string
  title: string
  description?: string
  gameType?: string
  location?: string
  startAt: string
  endAt?: string
  capacity: number
  maxSpotsPerPerson: number
  fieldsSchema: any[]
  conditions?: string
  requireAcceptance: boolean
  completionMessage?: string
  _count: { registrations: number }
  totalSpotsTaken: number
  status: string
  school: School
}

export default function EventPage() {
  const params = useParams()
  const schoolSlug = params.schoolSlug as string
  const eventSlug = params.eventSlug as string

  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState<any>({})
  const [spotsCount, setSpotsCount] = useState(1)
  const [registered, setRegistered] = useState(false)
  const [confirmationCode, setConfirmationCode] = useState('')
  const [isWaitlist, setIsWaitlist] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  useEffect(() => {
    fetchEvent()
  }, [schoolSlug, eventSlug])

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/p/${schoolSlug}/${eventSlug}`)
      if (response.ok) {
        const data = await response.json()
        setEvent(data)
        // Initialize form data
        const initialData: any = {}
        data.fieldsSchema.forEach((field: any) => {
          initialData[field.name] = ''
        })
        setFormData(initialData)
      }
    } catch (error) {
      console.error('Error fetching event:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (event?.requireAcceptance && !acceptedTerms) {
      alert('יש לאשר את תנאי ההשתתפות')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/p/${schoolSlug}/${eventSlug}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          spotsCount
        })
      })

      const result = await response.json()
      if (response.ok) {
        setRegistered(true)
        setConfirmationCode(result.confirmationCode)
        setIsWaitlist(result.status === 'WAITLIST')
      } else {
        alert(result.error || 'שגיאה בהרשמה')
      }
    } catch (error) {
      console.error('Error submitting registration:', error)
      alert('שגיאה בהרשמה')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">טוען פרטי אירוע...</p>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">האירוע אינו זמין</h1>
          <p className="text-gray-600">האירוע לא נמצא</p>
        </div>
      </div>
    )
  }

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

  const spotsLeft = event.capacity - event.totalSpotsTaken
  const isFull = spotsLeft <= 0
  const percentage = Math.min(100, (event.totalSpotsTaken / event.capacity) * 100)

  if (registered) {
    if (isWaitlist) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
            <div className="text-center">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-10 h-10 text-yellow-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">נרשמת לרשימת המתנה</h1>
              <p className="text-lg text-gray-700 mb-3">
                הבקשה שלך נקלטה בהצלחה.
              </p>
              <p className="text-lg text-gray-700 mb-6">
                אם יתפנה מקום באירוע, ניצור איתך קשר.
              </p>

              <div className="bg-yellow-50 rounded-lg p-5 border border-yellow-200">
                <p className="text-base text-gray-800">
                  📱 במידה ויתפנה מקום, נעדכן אותך באמצעות פרטי הקשר שהזנת.
                </p>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  קוד אישור לרשימת המתנה: <span className="font-mono font-bold">{confirmationCode}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">ההרשמה הושלמה בהצלחה!</h1>
            <p className="text-gray-600 mb-6">המקום שלך נשמר לאירוע</p>

            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <p className="text-sm text-gray-500 mb-2">קוד אישור</p>
              <p className="text-3xl font-bold text-gray-900 font-mono">{confirmationCode}</p>
            </div>

            <div className="text-right space-y-2">
              <div className="flex items-start gap-2">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">{event.title}</p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(event.startAt), 'EEEE, dd בMMMM yyyy בשעה HH:mm', { locale: he })}
                  </p>
                </div>
              </div>
              {event.location && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <p className="text-sm text-gray-600">{event.location}</p>
                </div>
              )}
            </div>

            {event.completionMessage && (
              <div className="mt-6 p-5 bg-red-50 rounded-lg border-2 border-red-400">
                <p className="text-lg text-red-900 font-bold mb-2">⚠️ הודעה חשובה מהמארגן:</p>
                <p className="text-base text-gray-900 font-bold whitespace-pre-wrap leading-relaxed">
                  {event.completionMessage}
                </p>
              </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 מומלץ לצלם מסך זה לשמירה
              </p>
            </div>

            <div className="mt-4">
              <FeedbackInline />
            </div>
          </div>
        </div>
      </div>
    )
  }

  const schoolColor = event?.school?.primaryColor || '#3b82f6'
  const gradientFrom = `${schoolColor}20`
  const gradientTo = `${schoolColor}10`

  return (
    <div
      className="min-h-screen py-6 sm:py-12"
      style={{
        background: `linear-gradient(to bottom right, ${gradientFrom}, ${gradientTo})`
      }}
    >
      <div className="max-w-2xl mx-auto px-4">
        {/* School Branding Header */}
        {event.school && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-white rounded-xl shadow-md">
            {event.school.logo ? (
              <img
                src={event.school.logo}
                alt={event.school.name}
                className="w-14 h-14 rounded-lg object-cover"
              />
            ) : (
              <div
                className="w-14 h-14 rounded-lg flex items-center justify-center text-white font-bold text-xl"
                style={{ backgroundColor: schoolColor }}
              >
                {event.school.name.charAt(0)}
              </div>
            )}
            <div className="flex-1">
              <div className="text-sm text-gray-500">אירוע של</div>
              <div className="font-bold text-lg" style={{ color: schoolColor }}>
                {event.school.name}
              </div>
            </div>
          </div>
        )}

        {/* Event Header */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
          <div
            className="p-6 sm:p-8 text-white"
            style={{
              background: `linear-gradient(to right, ${schoolColor}, ${schoolColor}dd)`
            }}
          >
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">{event.title}</h1>
            {event.gameType && (
              <span className="inline-block bg-white/20 text-white px-3 py-1 rounded-full text-sm">
                {event.gameType}
              </span>
            )}
          </div>

          <div className="p-6 space-y-4">
            {event.description && (
              <p className="text-gray-700">{event.description}</p>
            )}

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700">
                  {format(new Date(event.startAt), 'EEEE, dd בMMMM yyyy בשעה HH:mm', { locale: he })}
                </span>
              </div>

              {event.location && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700">{event.location}</span>
                </div>
              )}
            </div>

            {/* Capacity Indicator */}
            <div className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">מקומות פנויים</span>
                <span className={`text-sm font-bold ${isFull ? 'text-red-600' : spotsLeft < 10 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {isFull ? 'אין מקומות פנויים' : `${spotsLeft} מתוך ${event.capacity}`}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isFull ? 'bg-red-500' : percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              {isFull && (
                <p className="text-sm text-yellow-600 mt-2 font-medium">
                  ⚠️ תתבצע הרשמה לרשימת המתנה
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Registration Form */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            {isFull ? 'הרשמה לרשימת המתנה' : 'טופס הרשמה'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {event.fieldsSchema.map((field: any) => (
              <div key={field.id}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {field.label}
                  {field.required && <span className="text-red-500 mr-1">*</span>}
                </label>
                {field.type === 'dropdown' ? (
                  <select
                    required={field.required}
                    value={formData[field.name] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  >
                    <option value="">בחר...</option>
                    {field.options?.map((option: string) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                ) : field.type === 'checkbox' ? (
                  <input
                    type="checkbox"
                    checked={formData[field.name] || false}
                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                ) : (
                  <input
                    type={field.type === 'number' ? 'number' : 'text'}
                    required={field.required}
                    value={formData[field.name] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                    placeholder={field.placeholder}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  />
                )}
              </div>
            ))}

            {event.maxSpotsPerPerson > 1 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  מספר מקומות <span className="text-red-500 mr-1">*</span>
                  <span className="text-xs text-gray-500 mr-2">(מקסימום: {event.maxSpotsPerPerson})</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max={isFull ? event.maxSpotsPerPerson : Math.min(event.maxSpotsPerPerson, spotsLeft)}
                  value={spotsCount}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    const max = isFull ? event.maxSpotsPerPerson : Math.min(event.maxSpotsPerPerson, spotsLeft);
                    setSpotsCount(Math.min(Math.max(1, value), max));
                  }}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                />
              </div>
            )}

            {event.conditions && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">תנאי השתתפות</h3>
                <p className="text-sm text-gray-600 mb-3 whitespace-pre-wrap">{event.conditions}</p>
                {event.requireAcceptance && (
                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      required
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5"
                    />
                    <span className="text-sm text-gray-700">
                      אני מאשר/ת שקראתי ומסכים/ה לתנאי ההשתתפות
                    </span>
                  </label>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || (event.status !== 'OPEN')}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {submitting ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin ml-2" />
                  שולח...
                </span>
              ) : (
                isFull ? 'הרשמה לרשימת המתנה' : 'שלח הרשמה'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
