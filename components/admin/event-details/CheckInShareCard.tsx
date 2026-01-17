'use client'

import { useState, useEffect } from 'react'
import { Share2, ExternalLink, Lightbulb, UserCheck } from 'lucide-react'
import ShareOptionsModal from './ShareOptionsModal'

interface CheckInShareCardProps {
  eventId: string
  eventTitle: string
}

interface CheckInLinkData {
  token: string
  url: string
  eventTitle: string
}

export default function CheckInShareCard({ eventId, eventTitle }: CheckInShareCardProps) {
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [linkData, setLinkData] = useState<CheckInLinkData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch check-in link from API
  useEffect(() => {
    const fetchCheckInLink = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch(`/api/events/${eventId}/check-in-link`)
        if (!response.ok) {
          throw new Error('Failed to fetch check-in link')
        }
        const data = await response.json()
        setLinkData(data)
      } catch (err) {
        console.error('Error fetching check-in link:', err)
        setError('Failed to load check-in link')
      } finally {
        setLoading(false)
      }
    }

    fetchCheckInLink()
  }, [eventId])

  // Loading state
  if (loading) {
    return (
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-600 via-cyan-600 to-emerald-600 rounded-2xl opacity-10 blur-lg"></div>
        <div className="relative bg-white/95 rounded-2xl border-2 border-gray-200/80 p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-32 mb-3"></div>
          <div className="h-4 bg-gray-100 rounded w-48 mb-4"></div>
          <div className="h-14 bg-gray-100 rounded-xl mb-4"></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="h-12 bg-gray-100 rounded-xl"></div>
            <div className="h-12 bg-gray-100 rounded-xl"></div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !linkData) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <p className="text-sm text-red-600 text-center">
          {error || 'לא ניתן לטעון את קישור הצ׳ק-אין'}
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Premium Check-In Share Card - Glassmorphism Inspired */}
      <div className="relative group" dir="rtl">
        {/* Gradient Background Glow */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-600 via-cyan-600 to-emerald-600 rounded-2xl opacity-20 blur-lg group-hover:opacity-30 transition-opacity duration-300"></div>

        {/* Main Card */}
        <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl border-2 border-gray-200/80 shadow-xl overflow-hidden">
          {/* Top Gradient Accent - Teal/Cyan theme for check-in */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-500"></div>

          {/* Decorative Corner Gradient */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-teal-500/5 via-cyan-500/5 to-transparent rounded-br-[200px] pointer-events-none"></div>

          <div className="relative p-6">
            {/* Header with Icon */}
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-teal-50 rounded-lg border border-teal-200">
                <UserCheck className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">קישור צ׳ק-אין</h3>
                <p className="text-sm text-gray-600">שלח לאדם שיבדוק נוכחות בכניסה</p>
              </div>
            </div>

            {/* Educational Tooltip - Key Differentiator */}
            <div className="flex items-start gap-2.5 p-3 mb-5 bg-amber-50 border border-amber-200 rounded-lg">
              <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 font-medium">
                לא צריך להתחבר למערכת - רק הקישור הזה מספיק לבדוק נוכחות!
              </p>
            </div>

            {/* Action Buttons Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Primary CTA - Share Options */}
              <button
                onClick={() => setShareModalOpen(true)}
                className="flex items-center justify-center gap-2.5 px-6 py-4
                         bg-gradient-to-r from-teal-600 via-cyan-600 to-teal-600
                         text-white rounded-xl font-bold text-sm
                         hover:from-teal-700 hover:via-cyan-700 hover:to-teal-700
                         active:scale-[0.97] transition-all duration-200
                         shadow-lg shadow-teal-500/30 hover:shadow-xl hover:shadow-cyan-500/40
                         focus:outline-none focus:ring-4 focus:ring-teal-500/30
                         group/btn overflow-hidden relative"
              >
                {/* Shine effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700"></div>

                <Share2 className="w-5 h-5 relative" />
                <span className="relative">שלח לאיש הכניסה</span>
              </button>

              {/* Secondary - Preview */}
              <button
                onClick={() => window.open(linkData.url, '_blank')}
                className="flex items-center justify-center gap-2.5 px-6 py-4
                         bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-bold text-sm
                         hover:bg-gradient-to-br hover:from-teal-50 hover:to-cyan-50 hover:border-teal-300
                         active:scale-[0.97] transition-all duration-200
                         shadow-md hover:shadow-lg
                         focus:outline-none focus:ring-4 focus:ring-teal-500/20"
              >
                <ExternalLink className="w-5 h-5" />
                <span>פתח צ׳ק-אין</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Share Options Modal */}
      <ShareOptionsModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        url={linkData.url}
        eventTitle={eventTitle}
        shareType="check-in"
      />
    </>
  )
}
