'use client'

import { useEffect, useRef } from 'react'
import { X, AlertTriangle, AlertCircle, Info } from 'lucide-react'

export type ConfirmationVariant = 'danger' | 'warning' | 'info'

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: ConfirmationVariant
  loading?: boolean
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'אישור',
  cancelText = 'ביטול',
  variant = 'info',
  loading = false,
}: ConfirmationModalProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  // Variant configurations
  const variantConfig = {
    danger: {
      icon: AlertTriangle,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      confirmBg: 'bg-red-600 hover:bg-red-700 focus:ring-red-500/40',
      title: 'text-red-900',
    },
    warning: {
      icon: AlertCircle,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      confirmBg: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500/40',
      title: 'text-amber-900',
    },
    info: {
      icon: Info,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      confirmBg: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500/40',
      title: 'text-blue-900',
    },
  }

  const config = variantConfig[variant]
  const Icon = config.icon

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Focus confirm button when modal opens
      confirmButtonRef.current?.focus()

      // Prevent body scroll
      document.body.style.overflow = 'hidden'
    } else {
      // Restore body scroll
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      // Escape to close
      if (e.key === 'Escape') {
        onClose()
      }

      // Enter to confirm (only if confirm button has focus)
      if (e.key === 'Enter' && document.activeElement === confirmButtonRef.current) {
        e.preventDefault()
        onConfirm()
      }

      // Tab trap (keep focus inside modal)
      if (e.key === 'Tab') {
        const focusableElements = modalRef.current?.querySelectorAll(
          'button:not(:disabled), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (!focusableElements || focusableElements.length === 0) return

        const firstElement = focusableElements[0] as HTMLElement
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

        if (e.shiftKey) {
          // Shift+Tab
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement.focus()
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, onConfirm])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-title"
      aria-describedby={description ? 'confirmation-description' : undefined}
      dir="rtl"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full
                   animate-in fade-in zoom-in-95 duration-200
                   border border-gray-200"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-lg
                     hover:bg-gray-100 transition-colors
                     focus:outline-none focus:ring-2 focus:ring-gray-300"
          aria-label="סגור"
          disabled={loading}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="p-6">
          {/* Icon */}
          <div
            className={`w-12 h-12 rounded-full ${config.iconBg} flex items-center justify-center mb-4`}
          >
            <Icon className={`w-6 h-6 ${config.iconColor}`} />
          </div>

          {/* Title */}
          <h2 id="confirmation-title" className={`text-xl font-bold mb-2 ${config.title}`}>
            {title}
          </h2>

          {/* Description */}
          {description && (
            <p id="confirmation-description" className="text-sm text-gray-600 leading-relaxed mb-6">
              {description}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {/* Cancel Button - Secondary */}
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-white border-2 border-gray-300 text-gray-700
                       rounded-lg font-semibold text-sm
                       hover:bg-gray-50 hover:border-gray-400
                       active:scale-[0.98] transition-all
                       focus:outline-none focus:ring-2 focus:ring-gray-400/40
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>

            {/* Confirm Button - Primary */}
            <button
              ref={confirmButtonRef}
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 px-4 py-2.5 text-white rounded-lg font-bold text-sm
                       active:scale-[0.98] transition-all
                       focus:outline-none focus:ring-2
                       disabled:opacity-50 disabled:cursor-not-allowed
                       ${config.confirmBg}`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>מעבד...</span>
                </span>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
