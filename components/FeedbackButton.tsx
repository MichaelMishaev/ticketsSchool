'use client'

import { useState } from 'react'
import { MessageSquare, X, Send } from 'lucide-react'

export default function FeedbackButton() {
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
        }, 2000)
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

  return (
    <>
      {/* Floating Button - Always visible with text */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 py-3 sm:px-5 sm:py-3 shadow-lg transition-all hover:shadow-xl flex items-center gap-2"
        aria-label="שלח משוב"
      >
        <span className="text-sm sm:text-base font-medium">משוב</span>
        <MessageSquare className="h-5 w-5" />
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 left-4 text-gray-400 hover:text-gray-600"
              aria-label="סגור"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100 mb-3">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">שלח לנו משוב</h2>
              <p className="text-sm text-gray-600 mt-2">
                נשמח לשמוע את דעתך, הצעות או דיווחים על בעיות
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-gray-700 text-right mb-1"
                >
                  הודעה <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="message"
                  rows={5}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-right"
                  placeholder="ספר לנו מה בראש שלך..."
                  maxLength={5000}
                />
                <p className="text-xs text-gray-500 text-right mt-1">
                  {message.length}/5000 תווים
                </p>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 text-right mb-1"
                >
                  אימייל או מספר טלפון (אופציונלי)
                </label>
                <input
                  id="email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-right"
                  placeholder="your@email.com או 050-1234567"
                />
                <p className="text-xs text-gray-500 text-right mt-1">
                  אם תרצה שנחזור אליך
                </p>
              </div>

              {/* Status message */}
              {submitStatus.type && (
                <div
                  className={`p-3 rounded-md text-right ${
                    submitStatus.type === 'success'
                      ? 'bg-green-50 text-green-800 border border-green-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {submitStatus.message}
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={isSubmitting || !message.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  'שולח...'
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    שלח משוב
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
