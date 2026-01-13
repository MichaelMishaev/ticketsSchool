'use client'

import { useState } from 'react'
import { Share2, ExternalLink, CheckCircle2 } from 'lucide-react'
import Image from 'next/image'
import ShareOptionsModal from './ShareOptionsModal'

interface EventHeroHeaderProps {
  event: {
    id: string
    title: string
    status: 'OPEN' | 'PAUSED' | 'CLOSED'
    slug: string
    school: {
      slug: string
    }
  }
}

export default function EventHeroHeader({ event }: EventHeroHeaderProps) {
  const [copiedLink, setCopiedLink] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)

  // Generate public registration URL
  const publicUrl = `${process.env.NEXT_PUBLIC_BASE_URL || window.location.origin}/p/${event.school.slug}/${event.slug}`

  // Status badge styling (semantic colors)
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'PAUSED':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'CLOSED':
        return 'bg-red-50 text-red-700 border-red-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'פעיל'
      case 'PAUSED':
        return 'מושהה'
      case 'CLOSED':
        return 'סגור'
      default:
        return status
    }
  }

  // Copy link to clipboard
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  return (
    <header
      className="bg-gradient-to-b from-white via-gray-50/20 to-transparent border-b border-gray-200/80"
      role="banner"
      dir="rtl"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Event Title + Status */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${getStatusColor(event.status)}`}
              >
                {getStatusLabel(event.status)}
              </span>
            </div>
            <p className="text-sm text-gray-600">שתף את קישור ההרשמה כדי להתחיל לקבל משתתפים</p>
          </div>
        </div>

        {/* Premium Sharing Card - Glassmorphism Inspired */}
        <div className="relative group">
          {/* Gradient Background Glow */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl opacity-20 blur-lg group-hover:opacity-30 transition-opacity duration-300"></div>

          {/* Main Card */}
          <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl border-2 border-gray-200/80 shadow-xl overflow-hidden">
            {/* Top Gradient Accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

            {/* Decorative Corner Gradient */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-transparent rounded-br-[200px] pointer-events-none"></div>

            <div className="relative p-6">
              {/* URL Display Section */}
              <div className="mb-5">
                <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                  <Share2 className="w-3.5 h-3.5" />
                  קישור ההרשמה שלך
                </label>

                {/* URL Card with Enhanced Design */}
                <div className="group/url relative">
                  <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 rounded-xl border-2 border-gray-200/80 hover:border-blue-300/50 transition-all duration-200 group-hover/url:shadow-md">
                    <code className="flex-1 text-sm text-gray-800 font-mono font-semibold truncate">
                      {publicUrl}
                    </code>

                    {/* Inline Copy Button with Animation */}
                    <button
                      onClick={handleCopyLink}
                      className="relative flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg
                               hover:bg-gray-50 hover:border-blue-400 hover:shadow-sm
                               active:scale-95 transition-all duration-150
                               focus:outline-none focus:ring-3 focus:ring-blue-500/30
                               group/copy"
                      aria-label="העתק קישור"
                    >
                      {/* Icon with smooth transition */}
                      <div className="relative w-4 h-4">
                        <Image
                          src="/icons/copy-icon.png"
                          alt="Copy"
                          width={16}
                          height={16}
                          className={`absolute inset-0 w-4 h-4 object-contain transition-all duration-200 ${
                            copiedLink
                              ? 'opacity-0 scale-0 rotate-180'
                              : 'opacity-100 scale-100 rotate-0'
                          }`}
                        />
                        <CheckCircle2
                          className={`absolute inset-0 w-4 h-4 text-green-600 transition-all duration-200 ${
                            copiedLink
                              ? 'opacity-100 scale-100 rotate-0'
                              : 'opacity-0 scale-0 -rotate-180'
                          }`}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-700 group-hover/copy:text-blue-600 transition-colors">
                        {copiedLink ? 'הועתק!' : 'העתק'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Primary CTA - Share Options */}
                <button
                  onClick={() => setShareModalOpen(true)}
                  className="flex items-center justify-center gap-2.5 px-6 py-4
                           bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600
                           text-white rounded-xl font-bold text-sm
                           hover:from-green-700 hover:via-emerald-700 hover:to-teal-700
                           active:scale-[0.97] transition-all duration-200
                           shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-emerald-500/40
                           focus:outline-none focus:ring-4 focus:ring-green-500/30
                           group/btn overflow-hidden relative"
                >
                  {/* Shine effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700"></div>

                  <Share2 className="w-5 h-5 relative" />
                  <span className="relative">שלח קישור להרשמה</span>
                </button>

                {/* Secondary - Preview */}
                <button
                  onClick={() => window.open(publicUrl, '_blank')}
                  className="flex items-center justify-center gap-2.5 px-6 py-4
                           bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-bold text-sm
                           hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 hover:border-purple-300
                           active:scale-[0.97] transition-all duration-200
                           shadow-md hover:shadow-lg
                           focus:outline-none focus:ring-4 focus:ring-purple-500/20"
                >
                  <ExternalLink className="w-5 h-5" />
                  <span>תצוגה מקדימה</span>
                </button>
              </div>

              {/* Enhanced Success Feedback */}
              {copiedLink && (
                <div className="mt-4 flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 border-2 border-green-200 rounded-xl animate-[fadeIn_200ms_ease-out]">
                  <div className="flex-shrink-0 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
                    <CheckCircle2 className="w-6 h-6 text-white animate-[scaleIn_200ms_ease-out]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-green-900">הקישור הועתק בהצלחה!</p>
                    <p className="text-xs text-green-700 mt-0.5">כעת תוכל להדביק אותו בכל מקום</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Share Options Modal */}
      <ShareOptionsModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        url={publicUrl}
        eventTitle={event.title}
      />
    </header>
  )
}
