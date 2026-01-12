'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  LayoutGrid,
  Users,
  ClipboardCheck,
  BarChart3,
} from 'lucide-react'

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
    ariaLabel: 'Event overview and sharing',
  },
  {
    id: 'registrations',
    label: 'הרשמות',
    icon: Users,
    ariaLabel: 'Registration management',
  },
  {
    id: 'checkin',
    label: 'כניסה',
    icon: ClipboardCheck,
    ariaLabel: 'Check-in and attendance',
  },
  {
    id: 'reports',
    label: 'דוחות',
    icon: BarChart3,
    ariaLabel: 'Analytics and exports',
  },
]

interface EventTabNavigationProps {
  eventId: string
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}

export default function EventTabNavigation({
  eventId,
  activeTab,
  onTabChange,
}: EventTabNavigationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const tabListRef = useRef<HTMLDivElement>(null)

  // Handle URL query param changes
  useEffect(() => {
    const urlTab = searchParams.get('tab') as TabId | null
    if (urlTab && tabs.find(t => t.id === urlTab)) {
      onTabChange(urlTab)
    }
  }, [searchParams, onTabChange])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!tabListRef.current?.contains(document.activeElement)) return

      const currentIndex = tabs.findIndex(t => t.id === activeTab)
      let nextIndex = currentIndex

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowLeft':
          e.preventDefault()
          // RTL: ArrowRight goes to previous tab (right to left)
          if (e.key === 'ArrowRight') {
            nextIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1
          } else {
            nextIndex = currentIndex === tabs.length - 1 ? 0 : currentIndex + 1
          }
          handleTabChange(tabs[nextIndex].id)
          break
        case 'Home':
          e.preventDefault()
          handleTabChange(tabs[0].id)
          break
        case 'End':
          e.preventDefault()
          handleTabChange(tabs[tabs.length - 1].id)
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [activeTab])

  // Touch/swipe handling for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return

    const touchEnd = e.changedTouches[0].clientX
    const diff = touchStart - touchEnd

    // Minimum swipe distance (50px)
    if (Math.abs(diff) < 50) return

    const currentIndex = tabs.findIndex(t => t.id === activeTab)

    // Swipe left = next tab (RTL: swipe left = move right in content)
    if (diff > 0 && currentIndex < tabs.length - 1) {
      handleTabChange(tabs[currentIndex + 1].id)
    }
    // Swipe right = previous tab
    else if (diff < 0 && currentIndex > 0) {
      handleTabChange(tabs[currentIndex - 1].id)
    }

    setTouchStart(null)
  }

  const handleTabChange = (tab: TabId) => {
    onTabChange(tab)

    // Update URL with query param
    const newParams = new URLSearchParams(searchParams.toString())
    newParams.set('tab', tab)
    router.push(`/admin/events/${eventId}?${newParams.toString()}`, { scroll: false })
  }

  return (
    <nav
      ref={tabListRef}
      role="tablist"
      aria-label="ניהול אירוע - קטגוריות"
      className="hidden md:block border-b border-gray-200 bg-white sticky top-0 z-40 shadow-sm"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex -mb-px overflow-x-auto hide-scrollbar" dir="rtl">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`${tab.id}-panel`}
                id={`${tab.id}-tab`}
                aria-label={tab.ariaLabel}
                tabIndex={isActive ? 0 : -1}
                data-tab-id={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`
                  group inline-flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm
                  transition-all duration-200 ease-out whitespace-nowrap
                  focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:z-10
                  min-h-[48px]
                  ${
                    isActive
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-110' : 'group-hover:scale-105'
                  }`}
                />
                <span>{tab.label}</span>

                {/* Active indicator (pulsing dot) */}
                {isActive && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>


      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </nav>
  )
}
