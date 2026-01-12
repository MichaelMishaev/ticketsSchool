'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { track404Error } from '@/lib/analytics'

/**
 * Custom 404 Page
 *
 * Tracks which URLs result in 404 errors with full context:
 * - Attempted URL (the broken link)
 * - Referrer (where the user came from)
 * - User agent (device/browser info)
 *
 * This data helps identify and fix broken links.
 */
export default function NotFound() {
  useEffect(() => {
    // Track 404 error with full context
    const attemptedUrl = window.location.pathname + window.location.search
    const referrer = document.referrer

    track404Error(attemptedUrl, referrer)

    // Log to console for debugging
    console.warn('404 Error:', {
      attemptedUrl,
      referrer,
      timestamp: new Date().toISOString(),
    })
  }, [])

  return (
    <div
      dir="rtl"
      className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100"
    >
      <div className="max-w-md w-full px-6 text-center">
        {/* 404 Icon */}
        <div className="mb-8">
          <div className="text-8xl font-bold text-gray-300">404</div>
          <div className="text-2xl font-semibold text-gray-700 mt-4">הדף לא נמצא</div>
        </div>

        {/* Error Message */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <p className="text-gray-600 mb-4">מצטערים, הדף שחיפשת לא קיים במערכת.</p>
          <p className="text-sm text-gray-500">ייתכן שהקישור שבו השתמשת שגוי או שהדף הוסר.</p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            חזרה לדף הבית
          </Link>

          <button
            onClick={() => window.history.back()}
            className="block w-full px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
          >
            חזרה לדף הקודם
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-8 text-sm text-gray-500">
          <p>זקוק לעזרה?</p>
          <Link
            href="/admin"
            className="text-blue-600 hover:text-blue-700 underline mt-1 inline-block"
          >
            עבור לדף הניהול
          </Link>
        </div>
      </div>
    </div>
  )
}
