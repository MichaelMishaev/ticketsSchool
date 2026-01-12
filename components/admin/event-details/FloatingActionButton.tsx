'use client'

import { LucideIcon } from 'lucide-react'

interface FloatingActionButtonProps {
  icon: LucideIcon
  label: string
  onClick: () => void
  variant?: 'primary' | 'success' | 'warning'
}

/**
 * Floating Action Button (FAB) for mobile devices
 *
 * Provides quick access to primary actions with a fixed position at bottom-right.
 * Hidden on desktop (≥768px), shown only on mobile for better UX.
 *
 * @example
 * ```tsx
 * <FloatingActionButton
 *   icon={Share2}
 *   label="שתף אירוע"
 *   onClick={handleShare}
 *   variant="primary"
 * />
 * ```
 */
export default function FloatingActionButton({
  icon: Icon,
  label,
  onClick,
  variant = 'primary'
}: FloatingActionButtonProps) {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 focus:ring-blue-500/50',
    success: 'bg-green-600 hover:bg-green-700 active:bg-green-800 focus:ring-green-500/50',
    warning: 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 focus:ring-amber-500/50'
  }

  return (
    <button
      onClick={onClick}
      className={`
        fixed bottom-6 left-6 z-30
        flex items-center gap-3
        px-6 py-4
        ${variants[variant]}
        text-white
        rounded-full
        shadow-2xl
        font-bold
        transition-all duration-200
        hover:scale-105
        active:scale-95
        focus:outline-none focus:ring-4
        md:hidden
      `}
      aria-label={label}
    >
      <Icon className="w-6 h-6" />
      <span className="text-base">{label}</span>
    </button>
  )
}
