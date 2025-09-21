'use client'

import Link from 'next/link'
import { Calendar, Home, Plus, Menu, X, HelpCircle } from 'lucide-react'
import { useState } from 'react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex flex-1">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">TicketCap</h1>
              </div>
              <div className="hidden sm:mr-6 sm:flex sm:space-x-reverse sm:space-x-8">
                <Link
                  href="/admin"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-gray-600"
                >
                  <Home className="w-4 h-4 ml-2" />
                  ראשי
                </Link>
                <Link
                  href="/admin/events"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
                >
                  <Calendar className="w-4 h-4 ml-2" />
                  אירועים
                </Link>
                <Link
                  href="/admin/events/new"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
                >
                  <Plus className="w-4 h-4 ml-2" />
                  אירוע חדש
                </Link>
                <Link
                  href="/admin/help"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
                >
                  <HelpCircle className="w-4 h-4 ml-2" />
                  הסבר איך להוסיף אירוע
                </Link>
              </div>
            </div>
            <div className="sm:hidden flex items-center">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-3 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 min-w-[44px] min-h-[44px]"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="sm:hidden">
            <div className="pt-2 pb-3 space-y-1">
              <Link
                href="/admin"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block pr-4 py-3 border-r-4 border-transparent text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300 min-h-[44px]"
              >
                <div className="flex items-center">
                  <Home className="w-5 h-5 ml-3" />
                  ראשי
                </div>
              </Link>
              <Link
                href="/admin/events"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block pr-4 py-3 border-r-4 border-transparent text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300 min-h-[44px]"
              >
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 ml-3" />
                  אירועים
                </div>
              </Link>
              <Link
                href="/admin/events/new"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block pr-4 py-3 border-r-4 border-transparent text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300 min-h-[44px]"
              >
                <div className="flex items-center">
                  <Plus className="w-5 h-5 ml-3" />
                  אירוע חדש
                </div>
              </Link>
              <Link
                href="/admin/help"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block pr-4 py-3 border-r-4 border-transparent text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300 min-h-[44px]"
              >
                <div className="flex items-center">
                  <HelpCircle className="w-5 h-5 ml-3" />
                  הסבר איך להוסיף אירוע
                </div>
              </Link>
            </div>
          </div>
        )}
      </nav>
      <main className="py-4 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  )
}