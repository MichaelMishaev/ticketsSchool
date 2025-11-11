'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus, Mail, Clock, CheckCircle, XCircle, Trash2 } from 'lucide-react'

interface Invitation {
  id: string
  email: string
  role: string
  status: string
  expiresAt: string
  createdAt: string
  invitedBy: string
  schoolName?: string
}

export default function TeamManagementPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('ADMIN')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetchInvitations()
  }, [])

  const fetchInvitations = async () => {
    try {
      const response = await fetch('/api/admin/team/invitations')
      if (response.status === 401) {
        router.push('/admin/login')
        return
      }
      if (response.status === 403) {
        setError('You do not have permission to manage team invitations')
        setLoading(false)
        return
      }
      if (!response.ok) throw new Error('Failed to fetch invitations')

      const data = await response.json()
      setInvitations(data.invitations || [])
    } catch (error) {
      console.error('Error fetching invitations:', error)
      setError('Failed to load invitations')
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/admin/team/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation')
      }

      setSuccess(`Invitation sent to ${email}`)
      setEmail('')
      setRole('ADMIN')
      setShowInviteForm(false)

      // Refresh invitations list
      await fetchInvitations()
    } catch (error) {
      console.error('Error sending invitation:', error)
      setError(error instanceof Error ? error.message : 'Failed to send invitation')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRevoke = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this invitation?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/team/invitations/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to revoke invitation')
      }

      setSuccess('Invitation revoked successfully')
      await fetchInvitations()
    } catch (error) {
      console.error('Error revoking invitation:', error)
      setError(error instanceof Error ? error.message : 'Failed to revoke invitation')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-5 h-5 text-yellow-500" />
      case 'ACCEPTED':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'EXPIRED':
      case 'REVOKED':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      ACCEPTED: 'bg-green-100 text-green-800',
      EXPIRED: 'bg-gray-100 text-gray-800',
      REVOKED: 'bg-red-100 text-red-800'
    }

    const labels = {
      PENDING: 'ממתין',
      ACCEPTED: 'התקבל',
      EXPIRED: 'פג תוקף',
      REVOKED: 'בוטל'
    }

    return (
      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${colors[status as keyof typeof colors]}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    )
  }

  const getRoleLabel = (role: string) => {
    const roleLabels: Record<string, string> = {
      'ADMIN': 'מנהל',
      'MANAGER': 'מנהל אירועים',
      'VIEWER': 'צופה',
      'SCHOOL_ADMIN': 'מנהל בית ספר',
      'OWNER': 'בעלים',
      'SUPER_ADMIN': 'מנהל על'
    }
    return roleLabels[role] || role
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">טוען...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">ניהול צוות</h1>
          <p className="mt-2 text-base text-gray-600">הזמן חברי צוות חדשים לבית הספר שלך</p>
        </div>
        <button
          disabled
          className="inline-flex items-center justify-center gap-2 px-5 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-gray-400 cursor-not-allowed opacity-60"
        >
          <UserPlus className="w-5 h-5" />
          הזמן חבר צוות
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-yellow-400 text-gray-900">
            בקרוב
          </span>
        </button>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 text-red-700 px-5 py-4 rounded-lg text-base font-medium">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border-2 border-green-200 text-green-700 px-5 py-4 rounded-lg text-base font-medium">
          {success}
        </div>
      )}

      {/* Invite Form */}
      {showInviteForm && (
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">הזמן חבר צוות חדש</h2>
          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                כתובת אימייל
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                תפקיד
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="ADMIN">מנהל</option>
                <option value="MANAGER">מנהל אירועים</option>
                <option value="VIEWER">צופה בלבד</option>
                <option value="SCHOOL_ADMIN">מנהל בית ספר</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Mail className="w-5 h-5 ml-2" />
                {submitting ? 'שולח...' : 'שלח הזמנה'}
              </button>
              <button
                type="button"
                onClick={() => setShowInviteForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                ביטול
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Invitations List */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">הזמנות</h2>
        </div>

        {invitations.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            אין הזמנות עדיין. לחץ על &quot;הזמן חבר צוות&quot; כדי להתחיל.
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                      אימייל
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                      תפקיד
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                      סטטוס
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                      הוזמן על ידי
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                      פעולות
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invitations.map((invitation) => (
                    <tr key={invitation.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(invitation.status)}
                          <span className="text-base font-medium text-gray-900">{invitation.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className="text-base text-gray-700">{getRoleLabel(invitation.role)}</span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        {getStatusBadge(invitation.status)}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className="text-sm text-gray-500">{invitation.invitedBy}</span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-right">
                        {invitation.status === 'PENDING' && (
                          <button
                            onClick={() => handleRevoke(invitation.id)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-colors"
                            title="בטל הזמנה"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-200">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(invitation.status)}
                      <span className="text-base font-medium text-gray-900">{invitation.email}</span>
                    </div>
                    {invitation.status === 'PENDING' && (
                      <button
                        onClick={() => handleRevoke(invitation.id)}
                        className="text-red-600 hover:text-red-800 p-2 -m-2"
                        title="בטל הזמנה"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">תפקיד:</span>
                      <span className="text-gray-900 font-medium">{getRoleLabel(invitation.role)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">סטטוס:</span>
                      {getStatusBadge(invitation.status)}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">הוזמן על ידי:</span>
                      <span className="text-gray-700">{invitation.invitedBy}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
