'use client'

import React, { useEffect, useRef, useState } from 'react'
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react'
import { createPortal } from 'react-dom'

export type ModalType = 'info' | 'error' | 'success' | 'warning' | 'confirmation'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm?: () => void
  type?: ModalType
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  showCancel?: boolean
  autoClose?: number // Auto-close after N milliseconds
  dir?: 'rtl' | 'ltr'
}

const MODAL_CONFIG = {
  info: {
    icon: Info,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    buttonBg: 'bg-blue-600 hover:bg-blue-700',
    borderColor: 'border-blue-200'
  },
  success: {
    icon: CheckCircle,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    buttonBg: 'bg-green-600 hover:bg-green-700',
    borderColor: 'border-green-200'
  },
  error: {
    icon: AlertCircle,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    buttonBg: 'bg-red-600 hover:bg-red-700',
    borderColor: 'border-red-200'
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    buttonBg: 'bg-yellow-600 hover:bg-yellow-700',
    borderColor: 'border-yellow-200'
  },
  confirmation: {
    icon: AlertTriangle,
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    buttonBg: 'bg-orange-600 hover:bg-orange-700',
    borderColor: 'border-orange-200'
  }
}

export default function Modal({
  isOpen,
  onClose,
  onConfirm,
  type = 'info',
  title,
  message,
  confirmText,
  cancelText,
  showCancel = true,
  autoClose,
  dir = 'rtl'
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const config = MODAL_CONFIG[type]
  const Icon = config.icon

  // Auto-close timer
  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose()
      }, autoClose)
      return () => clearTimeout(timer)
    }
  }, [isOpen, autoClose, onClose])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'Enter' && type === 'confirmation' && onConfirm) {
        onConfirm()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, onConfirm, type])

  // Focus trap
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      const handleTab = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement?.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement?.focus()
          }
        }
      }

      document.addEventListener('keydown', handleTab)
      firstElement?.focus()

      return () => document.removeEventListener('keydown', handleTab)
    }
  }, [isOpen])

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

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm()
    } else {
      onClose()
    }
  }

  // Default texts based on direction
  const defaultConfirmText = dir === 'rtl' ? 'אישור' : 'Confirm'
  const defaultCancelText = dir === 'rtl' ? 'ביטול' : 'Cancel'

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
      dir={dir}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scaleIn"
        style={{
          animation: 'scaleIn 200ms ease-out'
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className={`absolute top-4 ${dir === 'rtl' ? 'left-4' : 'right-4'} p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-4 focus:ring-gray-300`}
          aria-label={dir === 'rtl' ? 'סגור' : 'Close'}
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* Content */}
        <div className="p-6 sm:p-8">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className={`w-16 h-16 ${config.iconBg} rounded-full flex items-center justify-center`}>
              <Icon className={`w-8 h-8 ${config.iconColor}`} />
            </div>
          </div>

          {/* Title */}
          <h2
            id="modal-title"
            className="text-xl sm:text-2xl font-bold text-gray-900 text-center mb-3"
          >
            {title}
          </h2>

          {/* Message */}
          <p
            id="modal-description"
            className="text-base text-gray-700 text-center leading-relaxed whitespace-pre-wrap"
          >
            {message}
          </p>

          {/* Actions */}
          <div className={`mt-6 flex gap-3 ${dir === 'rtl' ? 'flex-row-reverse' : 'flex-row'}`}>
            {type === 'confirmation' ? (
              <>
                <button
                  onClick={handleConfirm}
                  className={`flex-1 px-6 py-3 ${config.buttonBg} text-white font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-offset-2 active:scale-95`}
                  style={{ minHeight: '44px' }}
                >
                  {confirmText || defaultConfirmText}
                </button>
                {showCancel && (
                  <button
                    onClick={onClose}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-gray-300 active:scale-95"
                    style={{ minHeight: '44px' }}
                  >
                    {cancelText || defaultCancelText}
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={onClose}
                className={`w-full px-6 py-3 ${config.buttonBg} text-white font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-offset-2 active:scale-95`}
                style={{ minHeight: '44px' }}
              >
                {confirmText || (dir === 'rtl' ? 'סגור' : 'Close')}
              </button>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          @keyframes fadeIn,
          @keyframes scaleIn {
            animation-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  )

  // Render in portal for proper z-index stacking
  if (typeof window !== 'undefined') {
    return createPortal(modalContent, document.body)
  }

  return null
}

// Helper hooks for common modal patterns
export function useModal() {
  const [isOpen, setIsOpen] = useState(false)

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((prev) => !prev)
  }
}
