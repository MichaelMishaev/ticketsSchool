'use client'

import { useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  LayoutGrid,
  Users,
  ClipboardCheck,
  BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type TabId = 'overview' | 'registrations' | 'checkin' | 'reports'

interface Tab {
  id: TabId
  label: string
  icon: React.ComponentType<{ className?: string }>
  ariaLabel: string
}

const tabs: Tab[] = [
  {
    id: 'overview',
    label: 'סקירה',
    icon: LayoutGrid,
    ariaLabel: 'סקירת אירוע ושיתוף',
  },
  {
    id: 'registrations',
    label: 'רשימות',
    icon: Users,
    ariaLabel: 'ניהול הרשמות',
  },
  {
    id: 'checkin',
    label: 'כניסה',
    icon: ClipboardCheck,
    ariaLabel: 'צ׳ק-אין ונוכחות',
  },
  {
    id: 'reports',
    label: 'דוחות',
    icon: BarChart3,
    ariaLabel: 'ניתוח וייצוא נתונים',
  },
]

interface MobileBottomTabBarProps {
  eventId: string
  activeTab: TabId
  onTabChange?: (tab: TabId) => void
}

export default function MobileBottomTabBar({
  eventId,
  activeTab,
  onTabChange,
}: MobileBottomTabBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Stable callback reference
  const stableOnTabChange = useCallback((tab: TabId) => {
    if (onTabChange) {
      onTabChange(tab)
    }
  }, [onTabChange])

  const handleTabChange = (tab: TabId) => {
    // Update state immediately
    stableOnTabChange(tab)

    // Update URL
    const newParams = new URLSearchParams(searchParams.toString())
    newParams.set('tab', tab)
    router.push(`/admin/events/${eventId}?${newParams.toString()}`, {
      scroll: false,
    })
  }

  return (
    <nav
      role="tablist"
      aria-label="ניווט תחתון - ניהול אירוע"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-gray-200 pb-safe shadow-lg"
    >
      <div className="flex items-stretch justify-around" dir="rtl">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              role="tab"
              id={`${tab.id}-tab-mobile`}
              aria-selected={isActive}
              aria-controls={`${tab.id}-panel`}
              aria-label={tab.ariaLabel}
              tabIndex={isActive ? 0 : -1}
              data-tab-id={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                'flex-1 flex flex-col items-center justify-center py-2 px-1',
                'min-h-[64px]', // Touch target (exceeds 44px minimum)
                'transition-all duration-200',
                'active:scale-95', // Touch feedback
                'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500',
                isActive
                  ? 'text-blue-600'
                  : 'text-gray-500 active:text-gray-700'
              )}
            >
              {/* Icon */}
              <Icon
                className={cn(
                  'w-6 h-6 mb-1 transition-transform duration-200',
                  isActive && 'scale-110'
                )}
              />

              {/* Label */}
              <span
                className={cn(
                  'text-xs font-medium transition-colors duration-200',
                  isActive ? 'text-blue-600' : 'text-gray-500'
                )}
              >
                {tab.label}
              </span>

              {/* Active indicator (pulsing dot) */}
              {isActive && (
                <span className="absolute bottom-1 inline-flex items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-600"></span>
                </span>
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
