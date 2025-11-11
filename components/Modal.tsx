'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react'

export type ModalType = 'info' | 'success' | 'warning' | 'error' | 'custom'

export interface ModalButton {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'danger' | 'success'
  icon?: React.ReactNode
  disabled?: boolean
}

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  type?: ModalType
  icon?: React.ReactNode
  children?: React.ReactNode
  buttons?: ModalButton[]
  showCloseButton?: boolean
  closeOnBackdropClick?: boolean
  closeOnEsc?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  headerGradient?: string
}

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  type = 'custom',
  icon,
  children,
  buttons = [],
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEsc = true,
  size = 'md',
  headerGradient,
}: ModalProps) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, closeOnEsc, onClose])

  // Prevent body scroll when modal is open
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

  // Get modal size classes
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  // Get type-specific styling
  const typeConfig = {
    info: {
      icon: <Info className="w-8 h-8" />,
      gradient: 'from-blue-600 to-cyan-600',
      iconColor: 'text-blue-600',
    },
    success: {
      icon: <CheckCircle2 className="w-8 h-8" />,
      gradient: 'from-green-600 to-emerald-600',
      iconColor: 'text-green-600',
    },
    warning: {
      icon: <AlertTriangle className="w-8 h-8" />,
      gradient: 'from-amber-600 to-orange-600',
      iconColor: 'text-amber-600',
    },
    error: {
      icon: <AlertCircle className="w-8 h-8" />,
      gradient: 'from-red-600 to-rose-600',
      iconColor: 'text-red-600',
    },
    custom: {
      icon: null,
      gradient: 'from-blue-600 to-purple-600',
      iconColor: 'text-gray-600',
    },
  }

  const config = typeConfig[type]
  const displayIcon = icon || config.icon
  const gradient = headerGradient || config.gradient

  // Get button variant styles
  const getButtonStyles = (variant: ModalButton['variant'] = 'secondary') => {
    const variants = {
      primary:
        'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-[1.02]',
      secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-300',
      danger:
        'bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-700 hover:to-rose-700 shadow-lg hover:shadow-xl transform hover:scale-[1.02]',
      success:
        'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transform hover:scale-[1.02]',
    }
    return variants[variant]
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          onClick={handleBackdropClick}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className={`bg-white rounded-2xl shadow-2xl ${sizeClasses[size]} w-full overflow-hidden max-h-[90vh] flex flex-col`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`bg-gradient-to-r ${gradient} p-6 text-white relative`}>
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="absolute top-4 left-4 p-2 rounded-full hover:bg-white/20 transition-colors"
                  aria-label="סגור"
                >
                  <X className="w-5 h-5" />
                </button>
              )}

              <div className="flex items-center gap-3 mb-2">
                {displayIcon && <div className="flex-shrink-0">{displayIcon}</div>}
                <h2 className="text-2xl font-bold">{title}</h2>
              </div>

              {description && <p className="text-white/90 text-sm mt-2">{description}</p>}
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1">{children}</div>

            {/* Footer with Buttons */}
            {buttons.length > 0 && (
              <div className="p-6 pt-0">
                <div className="flex flex-col sm:flex-row gap-3">
                  {buttons.map((button, index) => (
                    <button
                      key={index}
                      onClick={button.onClick}
                      disabled={button.disabled}
                      className={`
                        flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium
                        transition-all disabled:opacity-50 disabled:cursor-not-allowed
                        ${getButtonStyles(button.variant)}
                      `}
                    >
                      {button.icon}
                      {button.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Preset Modal Components for Common Use Cases
export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'אישור',
  cancelText = 'ביטול',
  type = 'warning',
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  type?: 'warning' | 'error' | 'info'
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      type={type}
      buttons={[
        {
          label: cancelText,
          onClick: onClose,
          variant: 'secondary',
        },
        {
          label: confirmText,
          onClick: () => {
            onConfirm()
            onClose()
          },
          variant: type === 'error' ? 'danger' : 'primary',
        },
      ]}
    />
  )
}

export function AlertModal({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  buttonText = 'הבנתי',
}: {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  type?: ModalType
  buttonText?: string
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      type={type}
      buttons={[
        {
          label: buttonText,
          onClick: onClose,
          variant: 'primary',
        },
      ]}
    >
      <p className="text-gray-700">{message}</p>
    </Modal>
  )
}
