'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, Mail, MessageCircle, Send, Copy } from 'lucide-react'

interface ShareOptionsModalProps {
  isOpen: boolean
  onClose: () => void
  url: string
  eventTitle: string
  shareType?: 'registration' | 'check-in'
}

export default function ShareOptionsModal({
  isOpen,
  onClose,
  url,
  eventTitle,
  shareType = 'registration',
}: ShareOptionsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // URL encoding for share messages (context-aware based on shareType)
  const getShareMessage = () => {
    if (shareType === 'check-in') {
      return `${eventTitle} - קישור צ׳ק-אין (לא צריך סיסמה!): ${url}`
    }
    return `${eventTitle} - הרשם כאן: ${url}`
  }
  const shareMessage = encodeURIComponent(getShareMessage())
  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(
    shareType === 'check-in' ? `${eventTitle} - קישור צ׳ק-אין` : eventTitle
  )

  // Share URLs
  const shareUrls = {
    whatsapp: `https://wa.me/?text=${shareMessage}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
    email: `mailto:?subject=${encodedTitle}&body=${shareMessage}`,
  }

  // Share options - compact list (iOS style)
  const shareOptions = [
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      icon: MessageCircle,
      color: '#25D366',
      url: shareUrls.whatsapp,
    },
    {
      id: 'telegram',
      label: 'Telegram',
      icon: Send,
      color: '#0088CC',
      url: shareUrls.telegram,
    },
    {
      id: 'email',
      label: 'Email',
      icon: Mail,
      color: '#6B7280',
      url: shareUrls.email,
    },
  ]

  // Copy URL to clipboard
  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  // Open share URL
  const handleShare = (shareUrl: string) => {
    window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=600')
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside)
      }, 100)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  // Prevent scroll when modal open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-dropdown-title"
      dir="rtl"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" aria-hidden="true" />

      {/* Compact Dropdown */}
      <div
        ref={modalRef}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden"
        style={{
          animation: 'scaleIn 200ms ease-out',
        }}
      >
        {/* Options List */}
        <div className="divide-y divide-gray-100">
          {shareOptions.map((option) => {
            const Icon = option.icon
            return (
              <button
                key={option.id}
                onClick={() => handleShare(option.url)}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors"
                aria-label={`שתף ב-${option.label}`}
              >
                {/* Icon */}
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: option.color }}
                >
                  <Icon className="w-5 h-5" />
                </div>

                {/* Label */}
                <span className="flex-1 text-right text-base font-medium text-gray-900">
                  {option.label}
                </span>
              </button>
            )
          })}

          {/* Copy URL Option */}
          <button
            onClick={handleCopyUrl}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors"
            aria-label="העתק קישור"
          >
            {/* Icon */}
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white border-2 border-blue-600 flex items-center justify-center overflow-hidden">
              <div className="relative w-5 h-5">
                <Copy
                  className={`absolute inset-0 w-5 h-5 text-blue-600 transition-all duration-200 ${
                    copied ? 'opacity-0 scale-0' : 'opacity-100 scale-100'
                  }`}
                />
                <CheckCircle2
                  className={`absolute inset-0 w-5 h-5 text-green-600 transition-all duration-200 ${
                    copied ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
                  }`}
                />
              </div>
            </div>

            {/* Label */}
            <span className="flex-1 text-right text-base font-medium text-gray-900">
              {copied ? 'הועתק!' : 'העתק טקסט'}
            </span>
          </button>

          {/* Cancel Button */}
          <button
            onClick={onClose}
            className="w-full flex items-center justify-center px-4 py-4 text-base font-semibold text-blue-600 hover:bg-gray-50 transition-colors border-t border-gray-200"
            aria-label="ביטול"
          >
            ביטול
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          @keyframes scaleIn {
            animation-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  )

  // Render in portal
  if (typeof window !== 'undefined') {
    return createPortal(modalContent, document.body)
  }

  return null
}
