'use client'

import { useState } from 'react'
import { Link2, CheckCircle } from 'lucide-react'

interface FloatingCheckInMenuProps {
  eventId: string
  onScanQR?: () => void
  onManualCheckIn?: () => void
  onViewReport?: () => void
  checkInLink?: string | null
}

// Shared button component
export function CheckInButton({ checkInLink }: { checkInLink?: string | null }) {
  const [copiedLink, setCopiedLink] = useState(false)

  const handleCopyLink = async () => {
    if (!checkInLink) return

    try {
      await navigator.clipboard.writeText(checkInLink)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } catch (error) {
      console.error('Failed to copy link:', error)
    }
  }

  if (!checkInLink) return null

  return (
    <button
      onClick={handleCopyLink}
      className={`
        relative flex items-center justify-center gap-2
        min-h-[44px] px-5 py-2
        ${
          copiedLink
            ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 active:from-green-700 active:to-green-600'
            : 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 active:from-purple-700 active:to-purple-600'
        }
        text-white rounded-full font-semibold text-sm
        shadow-md hover:shadow-lg active:shadow-lg
        transition-all duration-150 ease-out
        hover:scale-[1.03] active:scale-[0.97]
        focus:outline-none focus:ring-3 focus:ring-purple-400/50
        border border-white/20
        whitespace-nowrap
      `}
      aria-label={copiedLink ? 'הקישור הועתק' : "העתק קישור צ'ק אין"}
    >
      {/* Icon */}
      <div className="flex-shrink-0">
        {copiedLink ? (
          <CheckCircle className="w-4 h-4" strokeWidth={2.5} />
        ) : (
          <Link2 className="w-4 h-4" strokeWidth={2.5} />
        )}
      </div>

      {/* Text */}
      <span className="font-bold">{copiedLink ? 'הועתק!' : "ביצוע צ'ק אין"}</span>

      <style jsx>{`
        @media (prefers-reduced-motion: reduce) {
          button {
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </button>
  )
}

export default function FloatingCheckInMenu({ checkInLink }: FloatingCheckInMenuProps) {
  if (!checkInLink) return null

  return (
    <>
      {/* Desktop only: Attached to bottom footer */}
      <div
        className="hidden md:block fixed bottom-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-sm border-t border-gray-200"
        dir="rtl"
      >
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex justify-center">
          <CheckInButton checkInLink={checkInLink} />
        </div>
      </div>
    </>
  )
}
