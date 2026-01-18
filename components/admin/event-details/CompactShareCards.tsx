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
      {/* Simple Share Cards - Side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:max-w-2xl md:mx-auto" dir="rtl">
        {/* Registration Share Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-gray-900">קישור הרשמה</h3>
              <p className="text-xs text-gray-500">שתף למשתתפים</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setRegShareModalOpen(true)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2
                       bg-emerald-600 text-white rounded-lg font-semibold text-sm
                       hover:bg-emerald-700 active:scale-[0.98] transition-all
                       focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              aria-label="שתף קישור להרשמה"
            >
              <Share2 className="w-4 h-4" />
              <span>שתף</span>
            </button>

            <button
              onClick={() => window.open(publicUrl, '_blank')}
              className="p-2 bg-gray-100 text-gray-600 rounded-lg
                       hover:bg-gray-200 active:scale-[0.98] transition-all
                       focus:outline-none focus:ring-2 focus:ring-gray-300"
              aria-label="תצוגה מקדימה"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Check-In Share Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          {loading ? (
            <div className="animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-24 mb-2" />
              <div className="h-4 bg-gray-100 rounded w-32 mb-3" />
              <div className="h-9 bg-gray-100 rounded-lg" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-teal-50 rounded-lg">
                  <UserCheck className="w-4 h-4 text-teal-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-gray-900">קישור צ׳ק-אין</h3>
                  <p className="text-xs text-gray-500">שלח לאיש הכניסה</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setCheckInShareModalOpen(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2
                           bg-teal-600 text-white rounded-lg font-semibold text-sm
                           hover:bg-teal-700 active:scale-[0.98] transition-all
                           focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                >
                  <Share2 className="w-4 h-4" />
                  <span>שלח</span>
                </button>

                {checkInLink && (
                  <button
                    onClick={() => window.open(checkInLink, '_blank')}
                    className="p-2 bg-gray-100 text-gray-600 rounded-lg
                             hover:bg-gray-200 active:scale-[0.98] transition-all
                             focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                )}
              </div>
            </>
          )}
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
