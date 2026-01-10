'use client'

import { useState, useEffect } from 'react'
import { QrCode, Copy, Check, RefreshCw, ExternalLink } from 'lucide-react'

interface CheckInLinkSectionProps {
  eventId: string
}

export default function CheckInLinkSection({ eventId }: CheckInLinkSectionProps) {
  const [checkInLink, setCheckInLink] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  useEffect(() => {
    fetchCheckInLink()
  }, [eventId])

  const fetchCheckInLink = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/events/${eventId}/check-in-link`)
      if (response.ok) {
        const data = await response.json()
        setCheckInLink(data.url)
      }
    } catch (error) {
      console.error('Error fetching check-in link:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyCheckInLink = async () => {
    if (!checkInLink) return

    try {
      await navigator.clipboard.writeText(checkInLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Error copying link:', error)
    }
  }

  const regenerateLink = async () => {
    if (!confirm('האם לחדש את קישור הכניסה? הקישור הישן יהפוך ללא תקף.')) {
      return
    }

    try {
      setRegenerating(true)
      const response = await fetch(`/api/events/${eventId}/check-in-link`, {
        method: 'POST'
      })
      if (response.ok) {
        const data = await response.json()
        setCheckInLink(data.url)
        alert('קישור הכניסה חודש בהצלחה! הקישור הישן כבר לא פעיל.')
      }
    } catch (error) {
      console.error('Error regenerating link:', error)
      alert('שגיאה בחידוש הקישור')
    } finally {
      setRegenerating(false)
    }
  }

  const openCheckInPage = () => {
    if (checkInLink) {
      window.open(checkInLink, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 shadow-sm rounded-lg p-4">
        <div className="text-sm text-green-700">טוען קישור כניסה...</div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 shadow-sm rounded-lg p-4">
      <div className="flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-green-600" />
            <h3 className="text-sm font-semibold text-green-900">
              📱 קישור כניסה למשתתפים (שער כניסה)
            </h3>
          </div>
          <button
            onClick={regenerateLink}
            disabled={regenerating}
            className="text-xs text-green-700 hover:text-green-900 flex items-center gap-1 underline disabled:opacity-50"
            title="חידוש קישור (יבטל את הקישור הישן)"
          >
            <RefreshCw className={`w-3 h-3 ${regenerating ? 'animate-spin' : ''}`} />
            {regenerating ? 'מחדש...' : 'חדש קישור'}
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-green-700">
          שתף קישור זה עם השוערים/צוות הכניסה. הם יוכלו לסרוק QR ולסמן משתתפים שהגיעו.
        </p>

        {/* Link Display */}
        <div className="bg-white rounded-md border border-green-300 p-2.5 font-mono text-xs text-gray-700 break-all select-all">
          {checkInLink || 'טוען...'}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={copyCheckInLink}
            disabled={!checkInLink}
            className="flex-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>הועתק!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>העתק קישור</span>
              </>
            )}
          </button>

          <button
            onClick={openCheckInPage}
            disabled={!checkInLink}
            className="flex-1 px-3 py-2 bg-white border border-green-600 text-green-700 rounded-md hover:bg-green-50 transition-colors flex items-center justify-center gap-2 text-sm font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ExternalLink className="w-4 h-4" />
            <span>פתח דף כניסה</span>
          </button>
        </div>

        {/* Info Box */}
        <div className="bg-green-100 border border-green-300 rounded-md p-2 text-xs text-green-800">
          <p className="font-semibold mb-1">💡 איך זה עובד?</p>
          <ul className="list-disc list-inside space-y-0.5 text-xs">
            <li>שתף את הקישור עם צוות השער (WhatsApp, SMS, או QR)</li>
            <li>השוערים יכולים לסרוק QR של משתתפים או לחפש ידנית</li>
            <li>סימון כניסה מתבצע בלחיצה אחת</li>
            <li>סטטיסטיקה חיה: כמה הגיעו מתוך כמה נרשמו</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
