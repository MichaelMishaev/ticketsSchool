'use client'

import { useState } from 'react'
import { Share2, ExternalLink, Users } from 'lucide-react'
import ShareOptionsModal from './ShareOptionsModal'

interface RegistrationShareCardProps {
  eventSlug: string
  schoolSlug: string
  eventTitle: string
}

export default function RegistrationShareCard({
  eventSlug,
  schoolSlug,
  eventTitle,
}: RegistrationShareCardProps) {
  const [shareModalOpen, setShareModalOpen] = useState(false)

  // Generate public registration URL
  const publicUrl = `${process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/p/${schoolSlug}/${eventSlug}`

  return (
    <>
      {/* Registration Share Card */}
      <div className="relative group" dir="rtl">
        {/* Main Card */}
        <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl border-2 border-gray-200/80 shadow-xl overflow-hidden">
          {/* Top Gradient Accent - Blue/Purple theme for registration */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

          <div className="relative p-6">
            {/* Header with Icon */}
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">קישור הרשמה</h3>
                <p className="text-sm text-gray-600">שתף כדי שמשתתפים יוכלו להירשם</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {/* Primary CTA - Share */}
              <button
                onClick={() => setShareModalOpen(true)}
                className="flex-1 flex items-center justify-center gap-3 px-6 py-3.5
                         bg-gradient-to-r from-emerald-500 to-teal-500
                         text-white rounded-xl font-bold text-base
                         hover:from-emerald-600 hover:to-teal-600
                         active:scale-[0.98] transition-all duration-200
                         shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-teal-500/30
                         focus:outline-none focus:ring-4 focus:ring-emerald-500/30
                         group/btn overflow-hidden relative"
                aria-label="שתף קישור להרשמה"
              >
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-500"></div>
                <Share2 className="w-5 h-5 relative" />
                <span className="relative">שתף קישור</span>
              </button>

              {/* Secondary - Preview */}
              <button
                onClick={() => window.open(publicUrl, '_blank')}
                className="flex items-center justify-center gap-2 px-5 py-3.5
                         bg-white border-2 border-gray-200 text-gray-600 rounded-xl font-semibold text-base
                         hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700
                         active:scale-[0.98] transition-all duration-200
                         focus:outline-none focus:ring-4 focus:ring-gray-200"
                aria-label="תצוגה מקדימה"
              >
                <ExternalLink className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Share Options Modal */}
      <ShareOptionsModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        url={publicUrl}
        eventTitle={eventTitle}
        shareType="registration"
      />
    </>
  )
}
