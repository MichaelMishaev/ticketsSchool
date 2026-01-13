'use client'

import { useState, useEffect, useRef } from 'react'
import { QrCode, UserCheck, FileText, Link2, X, CheckCircle } from 'lucide-react'

interface FloatingCheckInMenuProps {
  eventId: string
  onScanQR?: () => void
  onManualCheckIn?: () => void
  onViewReport?: () => void
  checkInLink?: string | null
}

export default function FloatingCheckInMenu({
  eventId,
  onScanQR,
  onManualCheckIn,
  onViewReport,
  checkInLink
}: FloatingCheckInMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Menu options with icons and actions
  const menuOptions = [
    {
      id: 'scan-qr',
      label: 'סרוק QR',
      icon: QrCode,
      color: 'from-blue-600 to-blue-700',
      hoverColor: 'hover:from-blue-700 hover:to-blue-800',
      action: () => {
        onScanQR?.()
        setIsOpen(false)
      }
    },
    {
      id: 'manual-checkin',
      label: 'הכנס ידנית',
      icon: UserCheck,
      color: 'from-green-600 to-green-700',
      hoverColor: 'hover:from-green-700 hover:to-green-800',
      action: () => {
        onManualCheckIn?.()
        setIsOpen(false)
      }
    },
    {
      id: 'view-report',
      label: 'דוח נוכחות',
      icon: FileText,
      color: 'from-purple-600 to-purple-700',
      hoverColor: 'hover:from-purple-700 hover:to-purple-800',
      action: () => {
        onViewReport?.()
        setIsOpen(false)
      }
    },
    ...(checkInLink ? [{
      id: 'copy-link',
      label: 'העתק קישור',
      icon: copiedLink ? CheckCircle : Link2,
      color: copiedLink ? 'from-green-600 to-green-700' : 'from-orange-600 to-orange-700',
      hoverColor: copiedLink ? 'hover:from-green-700 hover:to-green-800' : 'hover:from-orange-700 hover:to-orange-800',
      action: async () => {
        try {
          await navigator.clipboard.writeText(checkInLink)
          setCopiedLink(true)
          setTimeout(() => setCopiedLink(false), 2000)
        } catch (error) {
          console.error('Failed to copy link:', error)
        }
      }
    }] : [])
  ]

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Keyboard navigation (ESC to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  return (
    <div
      ref={menuRef}
      className="fixed bottom-24 md:bottom-6 right-6 z-[9999]"
      dir="rtl"
    >
      {/* Speed Dial Menu Options */}
      <div
        className={`absolute bottom-20 right-0 flex flex-col gap-3 transition-all duration-300 ease-out ${
          isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
        }`}
      >
        {menuOptions.map((option, index) => {
          const Icon = option.icon
          return (
            <button
              key={option.id}
              onClick={option.action}
              className={`group flex items-center gap-3 bg-gradient-to-r ${option.color} ${option.hoverColor} text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-blue-500/30 justify-end`}
              style={{
                animation: isOpen ? `slideInUp 300ms ease-out ${index * 50}ms both` : 'none'
              }}
              aria-label={option.label}
            >
              {/* Icon */}
              <div className="w-14 h-14 flex items-center justify-center">
                <Icon className="w-6 h-6" />
              </div>

              {/* Label (expands on hover) */}
              <div className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-out">
                <span className="pl-4 text-sm font-semibold whitespace-nowrap">
                  {option.label}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Main FAB Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 ease-out flex items-center justify-center group focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-purple-500/50 ${
          isOpen ? 'rotate-45 scale-110' : 'rotate-0 scale-100 hover:scale-110'
        }`}
        aria-label={isOpen ? 'סגור תפריט' : 'ניהול כניסה ונוכחות'}
        aria-expanded={isOpen}
      >
        {/* Animated icon transition */}
        <div className="relative w-7 h-7">
          <UserCheck className={`absolute inset-0 transition-all duration-300 ${
            isOpen ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'
          }`} />
          <X className={`absolute inset-0 transition-all duration-300 ${
            isOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'
          }`} />
        </div>

        {/* Pulsing ring effect when closed */}
        {!isOpen && (
          <div className="absolute inset-0 rounded-full bg-purple-600 animate-ping opacity-20" />
        )}

        {/* Shimmer effect on hover */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      </button>

      {/* Backdrop overlay on mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10 md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Animations */}
      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          @keyframes slideInUp {
            animation-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  )
}
