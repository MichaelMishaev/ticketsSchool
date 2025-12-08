'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Calendar, UtensilsCrossed, ChevronDown } from 'lucide-react'

interface CreateEventDropdownProps {
  variant?: 'header' | 'page'
  className?: string
  onEventTypeClick?: (type: 'regular' | 'restaurant') => void
}

export default function CreateEventDropdown({
  variant = 'header',
  className = '',
  onEventTypeClick
}: CreateEventDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const handleLinkClick = (type: 'regular' | 'restaurant') => {
    setIsOpen(false)
    if (onEventTypeClick) {
      onEventTypeClick(type)
    }
  }

  if (variant === 'header') {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="צור אירוע חדש"
          aria-expanded={isOpen}
          className={`group inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-blue-600 bg-gradient-to-r from-blue-50 to-sky-50 hover:from-blue-100 hover:to-sky-100 rounded-xl border border-blue-200/50 hover:border-blue-300 shadow-sm hover:shadow transition-all duration-200 ${className}`}
        >
          <div className="w-5 h-5 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <span className="font-semibold">אירוע חדש</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div
            className="fixed sm:absolute left-4 right-4 sm:right-0 sm:left-auto top-[60px] sm:top-auto mt-0 sm:mt-2 w-auto sm:w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-[100] overflow-hidden"
            role="menu"
            aria-orientation="vertical"
          >
            <Link
              href="/admin/events/new"
              onClick={() => handleLinkClick('regular')}
              className="block px-4 py-4 hover:bg-blue-50 transition-colors border-b border-gray-100 group"
              role="menuitem"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 text-right">
                  <div className="font-bold text-gray-900 mb-1">אירוע רגיל</div>
                  <div className="text-xs text-gray-600 leading-relaxed">
                    מושלם לספורט, בתי ספר וכל אירוע עם מגבלת משתתפים
                  </div>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/events/new-restaurant"
              onClick={() => handleLinkClick('restaurant')}
              className="block px-4 py-4 hover:bg-purple-50 transition-colors group"
              role="menuitem"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-200 transition-colors">
                  <UtensilsCrossed className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1 text-right">
                  <div className="font-bold text-gray-900 mb-1">אירוע מסעדה</div>
                  <div className="text-xs text-gray-600 leading-relaxed">
                    ניהול שולחנות והזמנות למסעדות ובתי קפה
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}
      </div>
    )
  }

  // Page variant - larger, more prominent
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="צור אירוע חדש"
        aria-expanded={isOpen}
        className={`inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm hover:shadow transition-all ${className}`}
      >
        <Plus className="w-5 h-5" />
        <span>צור אירוע חדש</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className="fixed sm:absolute left-4 right-4 sm:left-0 sm:right-auto top-[60px] sm:top-auto mt-0 sm:mt-2 w-auto sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-[100] overflow-hidden"
          role="menu"
          aria-orientation="vertical"
        >
          <div className="p-3 bg-gray-50 border-b border-gray-200">
            <p className="text-sm font-semibold text-gray-700 text-center">בחר סוג אירוע</p>
          </div>

          <Link
            href="/admin/events/new"
            onClick={() => handleLinkClick('regular')}
            className="block px-5 py-4 hover:bg-blue-50 transition-colors border-b border-gray-100 group"
            role="menuitem"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors shadow-sm">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1 text-right min-w-0">
                <div className="font-bold text-gray-900 mb-1.5 text-base">📅 אירוע רגיל (כרטיסים)</div>
                <div className="text-sm text-gray-600 leading-relaxed mb-2">
                  מושלם לאירועי ספורט, בתי ספר וטיולים
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded whitespace-nowrap">✓ מגבלת קיבולת</span>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded whitespace-nowrap">✓ רשימת המתנה</span>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded whitespace-nowrap">✓ כרטיסים</span>
                </div>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/events/new-restaurant"
            onClick={() => handleLinkClick('restaurant')}
            className="block px-5 py-4 hover:bg-purple-50 transition-colors group"
            role="menuitem"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-200 transition-colors shadow-sm">
                <UtensilsCrossed className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1 text-right min-w-0">
                <div className="font-bold text-gray-900 mb-1.5 text-base">🍽️ אירוע מסעדה (שולחנות)</div>
                <div className="text-sm text-gray-600 leading-relaxed mb-2">
                  ניהול שולחנות והזמנות למסעדות ובתי קפה
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded whitespace-nowrap">✓ ניהול שולחנות</span>
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded whitespace-nowrap">✓ מינימום הזמנה</span>
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded whitespace-nowrap">✓ קיבולת</span>
                </div>
              </div>
            </div>
          </Link>
        </div>
      )}
    </div>
  )
}
