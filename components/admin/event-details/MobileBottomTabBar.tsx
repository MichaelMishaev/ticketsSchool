'use client'

import { LayoutGrid, Users, ClipboardCheck, BarChart3 } from 'lucide-react'
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
  activeTab: TabId
  onTabChange?: (tab: TabId) => void
  checkInButton?: React.ReactNode
}

export default function MobileBottomTabBar({
  activeTab,
  onTabChange,
  checkInButton,
}: MobileBottomTabBarProps) {
  const handleTabChange = (tab: TabId) => {
    onTabChange?.(tab)
  }

  return (
    <nav
      role="tablist"
      aria-label="ניווט תחתון - ניהול אירוע"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50"
    >
      {/* Check-in Button - Transparent background */}
      {checkInButton && (
        <div className="px-3 py-2 flex justify-center bg-transparent" dir="rtl">
          {checkInButton}
        </div>
      )}

      {/* Tab Navigation */}
      <div
        className="flex items-stretch justify-around bg-white/95 backdrop-blur-lg border-t border-gray-200 pb-safe shadow-lg"
        dir="rtl"
      >
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
                'relative flex-1 flex flex-col items-center justify-center py-2 px-1',
                'min-h-[64px]', // Touch target (exceeds 44px minimum)
                'transition-all duration-200',
                'active:scale-[0.98]', // Touch feedback
                'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-400/30',
                isActive
                  ? 'text-blue-600'
                  : 'text-gray-400 hover:text-gray-600 active:text-gray-700'
              )}
            >
              {/* Active indicator - top bar */}
              {isActive && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-blue-600 rounded-b-full"
                  aria-hidden="true"
                />
              )}

              {/* Icon with background pill for active state */}
              <span
                className={cn(
                  'flex items-center justify-center w-12 h-8 rounded-full mb-0.5 transition-colors duration-200',
                  isActive ? 'bg-blue-100' : 'bg-transparent'
                )}
              >
                <Icon
                  className={cn(
                    'w-5 h-5 transition-transform duration-200',
                    isActive && 'scale-110'
                  )}
                />
              </span>

              {/* Label */}
              <span
                className={cn(
                  'text-xs transition-all duration-200',
                  isActive ? 'font-semibold text-blue-600' : 'font-medium text-gray-400'
                )}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
