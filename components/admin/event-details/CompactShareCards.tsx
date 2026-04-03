'use client'

import { useState, useEffect } from 'react'
import { Share2, ExternalLink, Users, UserCheck } from 'lucide-react'
import ShareOptionsModal from './ShareOptionsModal'

interface CompactShareCardsProps {
  eventId: string
  eventSlug: string
  schoolSlug: string
  eventTitle: string
}

export default function CompactShareCards({
  eventId,
  eventSlug,
  schoolSlug,
  eventTitle,
}: CompactShareCardsProps) {
  const [regShareModalOpen, setRegShareModalOpen] = useState(false)
  const [checkInShareModalOpen, setCheckInShareModalOpen] = useState(false)
  const [checkInLink, setCheckInLink] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Generate public registration URL
  const publicUrl = `${process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/p/${schoolSlug}/${eventSlug}`

  // Fetch check-in link on mount
  useEffect(() => {
    const fetchCheckInLink = async () => {
      try {
        const response = await fetch(`/api/events/${eventId}/check-in-link`)
        if (response.ok) {
          const data = await response.json()
          setCheckInLink(data.url)
        }
      } catch (err) {
        console.error('Error fetching check-in link:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchCheckInLink()
  }, [eventId])

  return (
    <>
      {/* Compact Share Cards - Side by side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" dir="rtl">
        {/* Registration Share Card - Compact */}
        <div className="group relative">
          {/* Gradient accent line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-t-xl" />

          <div className="relative bg-white rounded-xl border-2 border-gray-200/80 shadow-md overflow-hidden pt-1 hover:shadow-xl transition-all duration-300">
            <div className="p-5">
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-50 rounded-lg border border-blue-200 flex-shrink-0">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-gray-900">קישור הרשמה</h3>
                  <p className="text-xs text-gray-600">שתף כדי שמשתתפים יירשמו</p>
                </div>
              </div>

              {/* Action Buttons - Stacked */}
              <div className="flex gap-2">
                <button
                  onClick={() => setRegShareModalOpen(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5
                           bg-gradient-to-r from-emerald-500 to-teal-500
                           text-white rounded-lg font-bold text-sm
                           hover:from-emerald-600 hover:to-teal-600
                           active:scale-[0.98] transition-all duration-200
                           shadow-lg shadow-emerald-500/25
                           focus:outline-none focus:ring-4 focus:ring-emerald-500/30
                           overflow-hidden relative group/btn"
                  aria-label="שתף קישור להרשמה"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-500" />
                  <Share2 className="w-4 h-4 relative" />
                  <span className="relative">שתף</span>
                </button>

                <button
                  onClick={() => window.open(publicUrl, '_blank')}
                  className="flex items-center justify-center gap-2 px-4 py-2.5
                           bg-white border-2 border-gray-200 text-gray-600 rounded-lg font-semibold text-sm
                           hover:bg-gray-50 hover:border-gray-300
                           active:scale-[0.98] transition-all duration-200
                           focus:outline-none focus:ring-4 focus:ring-gray-200"
                  aria-label="תצוגה מקדימה"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Check-In Share Card - Compact */}
        <div className="group relative">
          {/* Gradient accent line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-500 rounded-t-xl" />

          <div className="relative bg-white rounded-xl border-2 border-gray-200/80 shadow-md overflow-hidden pt-1 hover:shadow-xl transition-all duration-300">
            {loading ? (
              <div className="p-5 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-32 mb-3" />
                <div className="h-4 bg-gray-100 rounded w-48 mb-4" />
                <div className="h-10 bg-gray-100 rounded-lg" />
              </div>
            ) : (
              <div className="p-5">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-teal-50 rounded-lg border border-teal-200 flex-shrink-0">
                    <UserCheck className="w-5 h-5 text-teal-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-gray-900"> קישור אישורי הגעה</h3>
                    <p className="text-xs text-gray-600">שלח לאדם שיבדוק נוכחות</p>
                  </div>
                </div>

                {/* Action Buttons - Stacked */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setCheckInShareModalOpen(true)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5
                             bg-gradient-to-r from-teal-600 to-cyan-600
                             text-white rounded-lg font-bold text-sm
                             hover:from-teal-700 hover:to-cyan-700
                             active:scale-[0.98] transition-all duration-200
                             shadow-lg shadow-teal-500/25
                             focus:outline-none focus:ring-4 focus:ring-teal-500/30
                             overflow-hidden relative group/btn"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
                    <Share2 className="w-4 h-4 relative" />
                    <span className="relative">שלח</span>
                  </button>

                  {checkInLink && (
                    <button
                      onClick={() => window.open(checkInLink, '_blank')}
                      className="flex items-center justify-center gap-2 px-4 py-2.5
                               bg-white border-2 border-gray-200 text-gray-600 rounded-lg font-semibold text-sm
                               hover:bg-gray-50 hover:border-gray-300
                               active:scale-[0.98] transition-all duration-200
                               focus:outline-none focus:ring-4 focus:ring-gray-200"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Share Options Modals */}
      <ShareOptionsModal
        isOpen={regShareModalOpen}
        onClose={() => setRegShareModalOpen(false)}
        url={publicUrl}
        eventTitle={eventTitle}
        shareType="registration"
      />

      {checkInLink && (
        <ShareOptionsModal
          isOpen={checkInShareModalOpen}
          onClose={() => setCheckInShareModalOpen(false)}
          url={checkInLink}
          eventTitle={eventTitle}
          shareType="check-in"
        />
      )}
    </>
  )
}
