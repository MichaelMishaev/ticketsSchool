'use client'

import { Share2, Copy, ExternalLink, Check } from 'lucide-react'
import { useState } from 'react'

interface ShareLinkCardProps {
  schoolSlug: string
  eventSlug: string
}

export default function ShareLinkCard({ schoolSlug, eventSlug }: ShareLinkCardProps) {
  const [copied, setCopied] = useState(false)
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const shareUrl = `${baseUrl}/p/${schoolSlug}/${eventSlug}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleOpen = () => {
    window.open(shareUrl, '_blank')
  }

  return (
    <div className="relative overflow-hidden bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-transparent to-blue-50/30 pointer-events-none" />

      <div className="relative p-4">
        {/* Compact header */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-purple-100 rounded-lg">
              <Share2 className="w-4 h-4 text-purple-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">קישור לשיתוף</h3>
          </div>
          <p className="text-xs text-gray-600 mr-8">שתף קישור זה עם אנשים כדי שיוכלו להירשם לאירוע</p>
        </div>

        {/* Compact URL display */}
        <div className="bg-gray-50 rounded-lg px-3 py-2 mb-3">
          <p className="text-xs text-gray-600 font-mono truncate select-all">
            {shareUrl}
          </p>
        </div>

        {/* Action buttons - compact */}
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 active:scale-[0.98] transition-all min-h-[44px]"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>הועתק!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>העתק</span>
              </>
            )}
          </button>
          <button
            onClick={handleOpen}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 active:scale-[0.98] transition-all min-h-[44px] min-w-[44px]"
            aria-label="פתח בחלון חדש"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
