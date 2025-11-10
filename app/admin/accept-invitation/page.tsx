'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, AlertCircle, UserPlus } from 'lucide-react'

interface InvitationDetails {
  email: string
  role: string
  status: string
  expiresAt: string
  schoolName: string
  invitedBy: string
}

function AcceptInvitationContent() {
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setError('Missing invitation token')
      setLoading(false)
      return
    }

    verifyToken()
  }, [token])

  const verifyToken = async () => {
    try {
      const response = await fetch(`/api/team/accept-invitation?token=${token}`)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Invalid invitation')
      }

      const data = await response.json()
      setInvitation(data.invitation)
    } catch (error) {
      console.error('Error verifying invitation:', error)
      setError(error instanceof Error ? error.message : 'Failed to verify invitation')
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    // Validate password strength
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/team/accept-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          name,
          password
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept invitation')
      }

      setSuccess(true)

      // Redirect to admin dashboard after 2 seconds
      setTimeout(() => {
        router.push('/admin')
      }, 2000)
    } catch (error) {
      console.error('Error accepting invitation:', error)
      setError(error instanceof Error ? error.message : 'Failed to accept invitation')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center text-gray-500">מאמת הזמנה...</div>
        </div>
      </div>
    )
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="flex items-center justify-center mb-4">
              <AlertCircle className="w-12 h-12 text-red-500" />
            </div>
            <h2 className="text-center text-2xl font-bold text-gray-900 mb-4">
              הזמנה לא תקפה
            </h2>
            <p className="text-center text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push('/admin/login')}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              חזרה להתחברות
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <h2 className="text-center text-2xl font-bold text-gray-900 mb-4">
              ברוכים הבאים!
            </h2>
            <p className="text-center text-gray-600 mb-6">
              חשבונך נוצר בהצלחה. מעביר אותך ללוח הבקרה...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!invitation) {
    return null
  }

  // Check if invitation is not pending
  if (invitation.status !== 'PENDING') {
    const statusMessages = {
      ACCEPTED: 'הזמנה זו כבר התקבלה',
      EXPIRED: 'הזמנה זו פגה תוקף',
      REVOKED: 'הזמנה זו בוטלה'
    }

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="flex items-center justify-center mb-4">
              <AlertCircle className="w-12 h-12 text-yellow-500" />
            </div>
            <h2 className="text-center text-2xl font-bold text-gray-900 mb-4">
              הזמנה לא זמינה
            </h2>
            <p className="text-center text-gray-600 mb-6">
              {statusMessages[invitation.status as keyof typeof statusMessages] || 'הזמנה זו לא זמינה יותר'}
            </p>
            <button
              onClick={() => router.push('/admin/login')}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              חזרה להתחברות
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <UserPlus className="w-12 h-12 text-purple-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          הזמנה לצוות {invitation.schoolName}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          הוזמנת על ידי {invitation.invitedBy} להצטרף כ{invitation.role}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={handleAccept} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600">
                <strong>אימייל:</strong> {invitation.email}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                <strong>בית ספר:</strong> {invitation.schoolName}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                <strong>תפקיד:</strong> {invitation.role}
              </p>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                שם מלא
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                placeholder="הזן את שמך המלא"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                סיסמה
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                placeholder="לפחות 6 תווים"
                minLength={6}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                אימות סיסמה
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                placeholder="הזן סיסמה שוב"
                minLength={6}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'מייצר חשבון...' : 'קבל הזמנה וצור חשבון'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center text-gray-500">טוען...</div>
        </div>
      </div>
    }>
      <AcceptInvitationContent />
    </Suspense>
  )
}
