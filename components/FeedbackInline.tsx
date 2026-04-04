'use client'

import { useState } from 'react'
import { MessageSquare, Send } from 'lucide-react'

export default function FeedbackInline() {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({ type: null, message: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus({ type: null, message: '' })

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, email }),
      })

      const data = await response.json()

      if (response.ok) {
        setSubmitStatus({
          type: 'success',
          message: data.message || 'המשוב נשלח בהצלחה!',
        })
        setMessage('')
        setEmail('')
        setTimeout(() => {
          setIsOpen(false)
          setSubmitStatus({ type: null, message: '' })
        }, 2500)
      } else {
        setSubmitStatus({
          type: 'error',
          message: data.error || 'שגיאה בשליחת המשוב',
        })
      }
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: 'שגיאה בשליחת המשוב. אנא נסה שוב.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) {
    return (
      <div className="w-full">
        <div className="text-center mb-3">
          <p className="text-sm text-gray-600 mb-2">איך הייתה החוויה שלך?</p>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 md:py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <span className="font-bold text-lg">💬 נשמח למשוב</span>
        </button>
        <p className="text-xs text-center text-gray-500 mt-2">
          עוזר לנו להשתפר ולתת לך חוויה טובה יותר
        </p>
      </div>
    )
  }

  return (
    <div className="w-full bg-white border-2 border-blue-500 rounded-lg p-4 shadow-lg">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="h-5 w-5 text-blue-600" />
        <h3 className="font-bold text-gray-900">שלח לנו משוב</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <textarea
            rows={3}
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right text-sm"
            placeholder="ספר לנו מה דעתך על החוויה..."
            maxLength={5000}
          />
        </div>

        <div>
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right text-sm"
            placeholder="אימייל או טלפון (אופציונלי)"
          />
        </div>

        {submitStatus.type && (
          <div
            className={`p-2 rounded-md text-right text-sm ${
              submitStatus.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {submitStatus.message}
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSubmitting || !message.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isSubmitting ? (
              'שולח...'
            ) : (
              <>
                <Send className="h-4 w-4" />
                שלח
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm"
          >
            ביטול
          </button>
        </div>
      </form>
    </div>
  )
}
