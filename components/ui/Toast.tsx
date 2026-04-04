'use client'

import React, { useEffect, useState } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { createPortal } from 'react-dom'

export type ToastType = 'success' | 'error' | 'info' | 'warning'
export type ToastPosition = 'top-center' | 'top-right' | 'bottom-center' | 'bottom-right'

interface ToastProps {
  id: string
  type: ToastType
  message: string
  duration?: number
  position?: ToastPosition
  onDismiss: (id: string) => void
  dir?: 'rtl' | 'ltr'
}

const TOAST_CONFIG = {
  success: {
    icon: CheckCircle,
    bg: 'bg-green-50',
    border: 'border-green-200',
    iconColor: 'text-green-600',
    textColor: 'text-green-900'
  },
  error: {
    icon: AlertCircle,
    bg: 'bg-red-50',
    border: 'border-red-200',
    iconColor: 'text-red-600',
    textColor: 'text-red-900'
  },
  info: {
    icon: Info,
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    iconColor: 'text-blue-600',
    textColor: 'text-blue-900'
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    iconColor: 'text-yellow-600',
    textColor: 'text-yellow-900'
  }
}

const POSITION_CLASSES = {
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
  'top-right': 'top-4 right-4',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  'bottom-right': 'bottom-4 right-4'
}

function Toast({
  id,
  type,
  message,
  duration = 5000,
  position = 'top-center',
  onDismiss,
  dir = 'rtl'
}: ToastProps) {
  const [isExiting, setIsExiting] = useState(false)
  const config = TOAST_CONFIG[type]
  const Icon = config.icon

  useEffect(() => {
    if (duration && duration > 0) {
      const timer = setTimeout(() => {
        handleDismiss()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, id])

  const handleDismiss = () => {
    setIsExiting(true)
    setTimeout(() => {
      onDismiss(id)
    }, 200) // Match animation duration
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      dir={dir}
      className={`
        fixed ${POSITION_CLASSES[position]} z-50
        ${isExiting ? 'animate-slideOut' : 'animate-slideIn'}
      `}
      style={{
        maxWidth: 'calc(100vw - 2rem)',
        width: '400px'
      }}
    >
      <div
        className={`
          ${config.bg} ${config.border}
          border-2 rounded-xl shadow-lg p-4
          flex items-start gap-3
        `}
      >
        <Icon className={`w-5 h-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />

        <p className={`flex-1 text-sm font-medium ${config.textColor} leading-relaxed`}>
          {message}
        </p>

        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 rounded-lg hover:bg-black/10 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1"
          aria-label={dir === 'rtl' ? 'סגור הודעה' : 'Dismiss'}
        >
          <X className={`w-4 h-4 ${config.iconColor}`} />
        </button>
      </div>

      <style jsx global>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-100%) translateX(-50%);
          }
          to {
            opacity: 1;
            transform: translateY(0) translateX(-50%);
          }
        }

        @keyframes slideOut {
          from {
            opacity: 1;
            transform: translateY(0) translateX(-50%);
          }
          to {
            opacity: 0;
            transform: translateY(-100%) translateX(-50%);
          }
        }

        .animate-slideIn {
          animation: slideIn 200ms ease-out;
        }

        .animate-slideOut {
          animation: slideOut 200ms ease-in;
        }

        @media (prefers-reduced-motion: reduce) {
          @keyframes slideIn,
          @keyframes slideOut {
            animation-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  )
}

// Toast Container & Manager
interface ToastItem {
  id: string
  type: ToastType
  message: string
  duration?: number
}

let toastCounter = 0
const listeners = new Set<(toasts: ToastItem[]) => void>()
let toasts: ToastItem[] = []

function emitChange() {
  listeners.forEach((listener) => listener([...toasts]))
}

export const toast = {
  success: (message: string, duration?: number) => {
    const id = `toast-${++toastCounter}`
    toasts = [...toasts, { id, type: 'success', message, duration }]
    emitChange()
    return id
  },
  error: (message: string, duration?: number) => {
    const id = `toast-${++toastCounter}`
    toasts = [...toasts, { id, type: 'error', message, duration }]
    emitChange()
    return id
  },
  info: (message: string, duration?: number) => {
    const id = `toast-${++toastCounter}`
    toasts = [...toasts, { id, type: 'info', message, duration }]
    emitChange()
    return id
  },
  warning: (message: string, duration?: number) => {
    const id = `toast-${++toastCounter}`
    toasts = [...toasts, { id, type: 'warning', message, duration }]
    emitChange()
    return id
  },
  dismiss: (id: string) => {
    toasts = toasts.filter((t) => t.id !== id)
    emitChange()
  },
  dismissAll: () => {
    toasts = []
    emitChange()
  }
}

export function ToastContainer({
  position = 'top-center',
  dir = 'rtl'
}: {
  position?: ToastPosition
  dir?: 'rtl' | 'ltr'
}) {
  const [items, setItems] = useState<ToastItem[]>([])

  useEffect(() => {
    listeners.add(setItems)
    return () => {
      listeners.delete(setItems)
    }
  }, [])

  if (items.length === 0) return null

  const content = (
    <>
      {items.map((item) => (
        <Toast
          key={item.id}
          {...item}
          position={position}
          onDismiss={toast.dismiss}
          dir={dir}
        />
      ))}
    </>
  )

  if (typeof window !== 'undefined') {
    return createPortal(content, document.body)
  }

  return null
}
