'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import {
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Check,
  X,
  Ticket,
  Download,
} from 'lucide-react'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import FeedbackInline from '@/components/FeedbackInline'
import GuestCountSelector from '@/components/GuestCountSelector'
import {
  trackRegistrationStarted,
  trackRegistrationCompleted,
  trackRegistrationFailed,
} from '@/lib/analytics'
import Modal from '@/components/ui/Modal'
import { ToastContainer, toast } from '@/components/ui/Toast'
import { DEFAULT_COVER_IMAGE } from '@/components/CoverImagePicker'

interface School {
  id: string
  name: string
  slug: string
  logo?: string
  primaryColor: string
}

interface Event {
  id: string
  title: string
  description?: string
  gameType?: string
  location?: string
  startAt: string
  endAt?: string
  capacity: number
  maxSpotsPerPerson: number
  eventType: 'CAPACITY_BASED' | 'TABLE_BASED'
  maxTableCapacity?: number | null
  fieldsSchema: any[]
  conditions?: string
  requireAcceptance: boolean
  completionMessage?: string
  coverImage?: string | null
  allowCancellation?: boolean
  paymentRequired: boolean
  paymentTiming?: 'UPFRONT' | 'POST_REGISTRATION'
  pricingModel?: 'FIXED_PRICE' | 'PER_GUEST' | 'FREE'
  priceAmount?: number
  _count: { registrations: number }
  totalSpotsTaken: number
  status: string
  school: School
}

// Field validation state
interface FieldValidation {
  isValid: boolean
  message: string
  touched: boolean
}

export default function EventPage() {
  const params = useParams()
  const schoolSlug = params.schoolSlug as string
  const eventSlug = params.eventSlug as string

  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState<any>({})
  const [spotsCount, setSpotsCount] = useState(1)
  const [guestsCount, setGuestsCount] = useState(2) // For table-based events
  const [registered, setRegistered] = useState(false)
  const [confirmationCode, setConfirmationCode] = useState('')
  const [cancellationToken, setCancellationToken] = useState('')
  const [isWaitlist, setIsWaitlist] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null)

  // 2026 UX: Real-time validation state
  const [fieldValidation, setFieldValidation] = useState<Record<string, FieldValidation>>({})

  // Ticket download state
  const [isDownloadingTicket, setIsDownloadingTicket] = useState(false)

  // Modal state
  const [modalState, setModalState] = useState<{
    isOpen: boolean
    type: 'info' | 'error' | 'success' | 'warning' | 'confirmation'
    title: string
    message: string
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
  })

  // Generate a professional ticket image using Canvas API
  const generateTicketImage = useCallback(async (): Promise<string> => {
    if (!event) throw new Error('No event data')

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!

    // Ticket dimensions (standard ticket ratio)
    const width = 600
    const height = 900
    canvas.width = width
    canvas.height = height

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, '#ffffff')
    gradient.addColorStop(1, '#f8fafc')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    // Header bar with school color
    const schoolColor = event.school?.primaryColor || '#16a34a'
    const headerGradient = ctx.createLinearGradient(0, 0, width, 0)
    headerGradient.addColorStop(0, schoolColor)
    headerGradient.addColorStop(1, `${schoolColor}dd`)
    ctx.fillStyle = headerGradient
    ctx.fillRect(0, 0, width, 100)

    // Header text
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 28px Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('🎫 כרטיס כניסה', width / 2, 60)

    // Event title
    ctx.fillStyle = '#111827'
    ctx.font = 'bold 32px Arial, sans-serif'
    ctx.textAlign = 'center'

    // Handle long event titles with word wrap
    const wrapText = (text: string, maxWidth: number): string[] => {
      const words = text.split(' ')
      const lines: string[] = []
      let currentLine = words[0]

      for (let i = 1; i < words.length; i++) {
        const testLine = currentLine + ' ' + words[i]
        const metrics = ctx.measureText(testLine)
        if (metrics.width > maxWidth) {
          lines.push(currentLine)
          currentLine = words[i]
        } else {
          currentLine = testLine
        }
      }
      lines.push(currentLine)
      return lines
    }

    const maxWidth = width - 60
    const titleLines = wrapText(event.title, maxWidth)
    let yPos = 160
    titleLines.forEach((line) => {
      ctx.fillText(line, width / 2, yPos)
      yPos += 40
    })

    // Confirmation code section
    yPos += 20
    ctx.fillStyle = '#f3f4f6'
    ctx.fillRect(30, yPos - 30, width - 60, 100)

    ctx.fillStyle = '#6b7280'
    ctx.font = '18px Arial, sans-serif'
    ctx.fillText('קוד אישור', width / 2, yPos)

    ctx.fillStyle = '#111827'
    ctx.font = 'bold 42px monospace'
    ctx.fillText(confirmationCode, width / 2, yPos + 50)

    yPos += 120

    // QR Code
    if (qrCodeImage) {
      const qrImg = new Image()
      qrImg.crossOrigin = 'anonymous'

      await new Promise<void>((resolve, reject) => {
        qrImg.onload = () => resolve()
        qrImg.onerror = () => reject(new Error('Failed to load QR'))
        qrImg.src = qrCodeImage
      })

      const qrSize = 200
      const qrX = (width - qrSize) / 2

      // QR border
      ctx.strokeStyle = '#d1d5db'
      ctx.lineWidth = 2
      ctx.strokeRect(qrX - 10, yPos - 10, qrSize + 20, qrSize + 20)

      ctx.drawImage(qrImg, qrX, yPos, qrSize, qrSize)

      ctx.fillStyle = '#6b7280'
      ctx.font = '14px Arial, sans-serif'
      ctx.fillText('הצג קוד זה בכניסה לאירוע', width / 2, yPos + qrSize + 30)

      yPos += qrSize + 60
    }

    // Dashed separator line
    ctx.setLineDash([8, 4])
    ctx.strokeStyle = '#d1d5db'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(30, yPos)
    ctx.lineTo(width - 30, yPos)
    ctx.stroke()
    ctx.setLineDash([])

    yPos += 40

    // Event details section
    ctx.textAlign = 'right'

    // Date
    const eventDate = format(new Date(event.startAt), 'EEEE, dd בMMMM yyyy בשעה HH:mm', {
      locale: he,
    })
    ctx.fillStyle = schoolColor
    ctx.font = '20px Arial, sans-serif'
    ctx.fillText('📅', width - 40, yPos)

    ctx.fillStyle = '#374151'
    ctx.font = '18px Arial, sans-serif'
    ctx.fillText(eventDate, width - 70, yPos)
    yPos += 35

    // Location
    if (event.location) {
      ctx.fillStyle = schoolColor
      ctx.font = '20px Arial, sans-serif'
      ctx.fillText('📍', width - 40, yPos)

      ctx.fillStyle = '#374151'
      ctx.font = '18px Arial, sans-serif'
      ctx.fillText(event.location, width - 70, yPos)
      yPos += 35
    }

    // School name
    if (event.school?.name) {
      yPos += 10
      ctx.fillStyle = '#9ca3af'
      ctx.font = '16px Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(event.school.name, width / 2, yPos)
    }

    // Footer
    ctx.fillStyle = '#9ca3af'
    ctx.font = '12px Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('kartis.info', width / 2, height - 30)

    return canvas.toDataURL('image/png')
  }, [event, confirmationCode, qrCodeImage])

  // Download full ticket as image
  const handleDownloadTicket = useCallback(async () => {
    if (!confirmationCode || !event) return

    setIsDownloadingTicket(true)
    try {
      const ticketImage = await generateTicketImage()

      // Create download link
      const link = document.createElement('a')
      link.href = ticketImage
      link.download = `כרטיס-${confirmationCode}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Failed to generate ticket:', error)
      toast.error('שגיאה ביצירת הכרטיס')
    } finally {
      setIsDownloadingTicket(false)
    }
  }, [confirmationCode, event, generateTicketImage])

  useEffect(() => {
    fetchEvent()
  }, [schoolSlug, eventSlug])

  const fetchEvent = async () => {
    try {
      // Add timeout to prevent hanging
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const response = await fetch(`/api/p/${schoolSlug}/${eventSlug}`, {
        signal: controller.signal,
        cache: 'no-store', // Disable browser caching
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()

        // CRITICAL: Ensure fieldsSchema always has required phone and name fields
        // This is a safety fallback in case an event was created without proper fields
        if (!data.fieldsSchema || !Array.isArray(data.fieldsSchema)) {
          data.fieldsSchema = []
        }

        const hasPhoneField = data.fieldsSchema.some((f: any) => f.name === 'phone')
        const hasNameField = data.fieldsSchema.some((f: any) => f.name === 'name')
        const hasEmailField = data.fieldsSchema.some((f: any) => f.name === 'email')

        // Add missing required fields at the beginning
        if (!hasPhoneField) {
          data.fieldsSchema.unshift({
            id: 'phone',
            name: 'phone',
            label: 'טלפון',
            type: 'text',
            required: true,
            placeholder: '05X-XXX-XXXX',
          })
        }

        if (!hasNameField) {
          data.fieldsSchema.unshift({
            id: 'name',
            name: 'name',
            label: 'שם מלא',
            type: 'text',
            required: true,
            placeholder: 'שם פרטי ומשפחה',
          })
        }

        // CRITICAL: Email is REQUIRED for payment events (YaadPay API requirement)
        // Add email field if payment is required and email field is not present
        if (data.paymentRequired && !hasEmailField) {
          data.fieldsSchema.splice(2, 0, {
            // Insert after name and phone
            id: 'email',
            name: 'email',
            label: 'אימייל',
            type: 'email',
            required: true,
            placeholder: 'your@email.com',
          })
        }

        setEvent(data)
        // Initialize form data and validation state
        const initialData: any = {}
        const initialValidation: Record<string, FieldValidation> = {}
        if (data.fieldsSchema && Array.isArray(data.fieldsSchema)) {
          data.fieldsSchema.forEach((field: any) => {
            initialData[field.name] = ''
            initialValidation[field.name] = {
              isValid: !field.required,
              message: '',
              touched: false,
            }
          })
        }
        setFormData(initialData)
        setFieldValidation(initialValidation)
      } else {
        // Handle non-OK responses
        let errorData
        try {
          errorData = await response.json()
        } catch {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` }
        }
        console.error('Error fetching event:', response.status, errorData)
        setEvent(null) // Explicitly set to null to show error message
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('Request timeout while fetching event')
      } else {
        console.error('Error fetching event:', error)
      }
      setEvent(null) // Explicitly set to null to show error message
    } finally {
      setLoading(false)
    }
  }

  // 2026 UX: Real-time field validation
  const validateField = (name: string, value: any, field: any): FieldValidation => {
    // Required field validation
    if (field.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return {
        isValid: false,
        message: `${field.label} הוא שדה חובה`,
        touched: true,
      }
    }

    // Email validation
    if (field.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) {
        return {
          isValid: false,
          message: 'כתובת אימייל לא תקינה',
          touched: true,
        }
      }
    }

    // Phone validation (Israeli format)
    if (name === 'phone' && value) {
      const cleanPhone = value.replace(/[\s\-]/g, '')

      // Check if starts with 05
      if (!cleanPhone.startsWith('05')) {
        return {
          isValid: false,
          message: 'מספר טלפון חייב להתחיל ב-05',
          touched: true,
        }
      }

      // Check length (must be exactly 10 digits)
      if (cleanPhone.length < 10) {
        return {
          isValid: false,
          message: `מספר טלפון קצר מדי (${cleanPhone.length}/10 ספרות)`,
          touched: true,
        }
      }

      if (cleanPhone.length > 10) {
        return {
          isValid: false,
          message: `מספר טלפון ארוך מדי (${cleanPhone.length}/10 ספרות)`,
          touched: true,
        }
      }

      // Check all digits
      if (!/^\d+$/.test(cleanPhone)) {
        return {
          isValid: false,
          message: 'מספר טלפון יכול להכיל רק ספרות',
          touched: true,
        }
      }
    }

    return {
      isValid: true,
      message: '',
      touched: true,
    }
  }

  // Handle field change with validation
  const handleFieldChange = (name: string, value: any, field: any) => {
    setFormData({ ...formData, [name]: value })

    // Validate after a short delay (debounced)
    setTimeout(() => {
      const validation = validateField(name, value, field)
      setFieldValidation((prev) => ({ ...prev, [name]: validation }))
    }, 300)
  }

  // Get missing required fields for validation
  const getMissingFields = () => {
    if (!event) return []

    const missing: string[] = []

    // Check all required fields in schema
    event.fieldsSchema.forEach((field: any) => {
      if (field.required) {
        const value = formData[field.name]
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          missing.push(field.label)
        }
      }
    })

    // Check terms acceptance if required
    if (event.requireAcceptance && !acceptedTerms) {
      missing.push('אישור תנאי השתתפות')
    }

    return missing
  }

  const missingFields = getMissingFields()
  const isFormValid = missingFields.length === 0

  // Calculate total price based on pricing model
  const calculateTotalPrice = (): number => {
    if (!event?.paymentRequired || !event.priceAmount) return 0

    if (event.pricingModel === 'FIXED_PRICE') {
      return event.priceAmount
    }

    if (event.pricingModel === 'PER_GUEST') {
      const count = event.eventType === 'TABLE_BASED' ? guestsCount : spotsCount
      return event.priceAmount * count
    }

    return 0
  }

  const totalPrice = calculateTotalPrice()

  const showModal = (type: typeof modalState.type, title: string, message: string) => {
    setModalState({ isOpen: true, type, title, message })
  }

  const closeModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (event?.requireAcceptance && !acceptedTerms) {
      showModal('warning', 'נדרש אישור', 'יש לאשר את תנאי ההשתתפות כדי להמשיך')
      return
    }

    // Track registration started
    trackRegistrationStarted(eventSlug)

    setSubmitting(true)
    try {
      // Build request body based on event type
      const requestBody =
        event?.eventType === 'TABLE_BASED'
          ? { ...formData, guestsCount } // Table-based: send guestsCount
          : { ...formData, spotsCount } // Capacity-based: send spotsCount

      // Handle upfront payment flow
      // CRITICAL: Skip payment for WAITLIST registrations - only pay when confirmed!
      // If event is full (isFull = true), user joins waitlist without payment first
      if (event?.paymentRequired && event?.paymentTiming === 'UPFRONT' && !isFull) {
        // Create payment session (redirect to YaadPay)
        const response = await fetch('/api/payment/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            schoolSlug,
            eventSlug,
            registrationData: requestBody,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          showModal('error', 'שגיאה בתשלום', error.error || 'שגיאה ביצירת תשלום. אנא נסה שוב.')
          trackRegistrationFailed(eventSlug, error.error || 'Payment creation failed')
          return
        }

        // Payment endpoint returns JSON with redirect info
        const paymentData = await response.json()

        if (paymentData.type === 'mock') {
          // Mock mode: simple GET redirect to callback
          window.location.href = paymentData.redirectUrl
        } else {
          // Real payment: create a DOM form and POST to HYP gateway
          // (blob: URLs are blocked by CSP; native form submit is not a script)
          const form = document.createElement('form')
          form.method = 'POST'
          form.action = paymentData.redirectUrl
          form.style.display = 'none'
          for (const [key, value] of Object.entries(
            paymentData.formParams as Record<string, string>
          )) {
            const input = document.createElement('input')
            input.type = 'hidden'
            input.name = key
            input.value = value
            form.appendChild(input)
          }
          document.body.appendChild(form)
          form.submit()
        }

        return // Don't proceed with normal flow
      }

      // Normal registration flow (free or post-registration payment)
      const response = await fetch(`/api/p/${schoolSlug}/${eventSlug}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      // Check if response is JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Server returned non-JSON response:', await response.text())
        showModal('error', 'שגיאת שרת', 'שגיאה בשרת. אנא נסה שוב מאוחר יותר.')
        trackRegistrationFailed(eventSlug, 'Server error - non-JSON response')
        return
      }

      const result = await response.json()
      if (response.ok) {
        // Track successful registration
        const status = result.status === 'WAITLIST' ? 'waitlist' : 'confirmed'
        trackRegistrationCompleted(eventSlug, spotsCount, status)

        setRegistered(true)
        setConfirmationCode(result.confirmationCode)
        setCancellationToken(result.cancellationToken || '')
        setIsWaitlist(result.status === 'WAITLIST')
        setQrCodeImage(result.qrCodeImage || null)

        // Show success toast
        toast.success('ההרשמה הושלמה בהצלחה!')
      } else {
        trackRegistrationFailed(eventSlug, result.error || 'Unknown error')
        showModal('error', 'שגיאה בהרשמה', result.error || 'שגיאה בהרשמה. אנא נסה שוב.')
      }
    } catch (error) {
      console.error('Error submitting registration:', error)
      trackRegistrationFailed(eventSlug, error instanceof Error ? error.message : 'Unknown error')
      showModal('error', 'שגיאת חיבור', 'שגיאה בהרשמה. אנא בדוק את החיבור לאינטרנט ונסה שוב.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">טוען פרטי אירוע...</p>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">האירוע אינו זמין</h1>
          <p className="text-gray-600">האירוע לא נמצא</p>
        </div>
      </div>
    )
  }

  if (event.status === 'CLOSED') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">ההרשמה סגורה</h1>
          <p className="text-gray-600">ההרשמה לאירוע זה הסתיימה</p>
        </div>
      </div>
    )
  }

  if (event.status === 'PAUSED') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">ההרשמה מושהית</h1>
          <p className="text-gray-600">ההרשמה לאירוע זה מושהית זמנית</p>
          <p className="text-sm text-gray-500 mt-2">נא לבדוק שוב מאוחר יותר</p>
        </div>
      </div>
    )
  }

  // Check event timing state
  const now = new Date()
  const eventStart = new Date(event.startAt)
  const eventEnd = event.endAt
    ? new Date(event.endAt)
    : new Date(eventStart.getTime() + 2 * 60 * 60 * 1000) // Default: startAt + 2 hours

  const hasEventStarted = now >= eventStart
  const hasEventEnded = now >= eventEnd

  // Event has ended - show informational message
  if (hasEventEnded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">האירוע הסתיים</h1>
          <p className="text-gray-600 mb-6">לא ניתן להירשם לאירוע שכבר התקיים</p>

          {/* Event details for transparency */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex items-center justify-center gap-2 text-gray-700">
              <Calendar className="w-4 h-4" />
              <span>{format(eventStart, "EEEE, d בMMMM yyyy 'בשעה' HH:mm", { locale: he })}</span>
            </div>
            {event.location && (
              <div className="flex items-center justify-center gap-2 text-gray-700">
                <MapPin className="w-4 h-4" />
                <span>{event.location}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Event has started but not ended - registration closed
  if (hasEventStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <Clock className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">האירוע התחיל</h1>
          <p className="text-gray-600 mb-6">ההרשמה נסגרה - האירוע מתקיים כעת</p>

          {/* Event details for context */}
          <div className="bg-amber-50 rounded-lg p-4 space-y-2 text-sm border border-amber-200">
            <div className="flex items-center justify-center gap-2 text-gray-700">
              <Calendar className="w-4 h-4" />
              <span>{format(eventStart, "EEEE, d בMMMM yyyy 'בשעה' HH:mm", { locale: he })}</span>
            </div>
            {event.location && (
              <div className="flex items-center justify-center gap-2 text-gray-700">
                <MapPin className="w-4 h-4" />
                <span>{event.location}</span>
              </div>
            )}
            <div className="pt-2 border-t border-amber-200 text-amber-800 font-medium">
              הרשמה אפשרית רק לפני תחילת האירוע
            </div>
          </div>
        </div>
      </div>
    )
  }

  // For TABLE_BASED events, don't check capacity (backend handles table availability)
  // For CAPACITY_BASED events, check if spots are available
  const spotsLeft =
    event.eventType === 'TABLE_BASED' ? Infinity : event.capacity - event.totalSpotsTaken
  const isFull = event.eventType === 'TABLE_BASED' ? false : spotsLeft <= 0
  const percentage =
    event.eventType === 'TABLE_BASED'
      ? 0
      : Math.min(100, (event.totalSpotsTaken / event.capacity) * 100)

  if (registered) {
    if (isWaitlist) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
            <div className="text-center">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-10 h-10 text-yellow-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">נרשמת לרשימת המתנה</h1>
              <p className="text-lg text-gray-700 mb-3">הבקשה שלך נקלטה בהצלחה.</p>
              <p className="text-lg text-gray-700 mb-6">אם יתפנה מקום באירוע, ניצור איתך קשר.</p>

              <div className="bg-yellow-50 rounded-lg p-5 border border-yellow-200">
                <p className="text-base text-gray-800">
                  📱 במידה ויתפנה מקום, נעדכן אותך באמצעות פרטי הקשר שהזנת.
                </p>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  קוד אישור לרשימת המתנה:{' '}
                  <span className="font-mono font-bold">{confirmationCode}</span>
                </p>
              </div>

              {qrCodeImage && (
                <div className="mt-6 bg-white border-2 border-gray-200 rounded-lg p-6">
                  <p className="text-sm text-gray-500 mb-3 text-center">
                    📱 QR לכניסה (אם יתפנה מקום)
                  </p>
                  <div className="flex justify-center">
                    <img
                      src={qrCodeImage}
                      alt="QR Code"
                      className="w-48 h-48 border-4 border-gray-300 rounded-lg"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-3 text-center">
                    שמור קוד זה למקרה שיתפנה מקום
                  </p>
                  <a
                    href={qrCodeImage}
                    download={`waitlist-${confirmationCode}.png`}
                    className="mt-3 block w-full text-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-semibold"
                  >
                    💾 הורד QR כתמונה
                  </a>
                </div>
              )}

              {/* Download Full Ticket Button */}
              <button
                onClick={handleDownloadTicket}
                disabled={isDownloadingTicket}
                className="mt-4 flex items-center justify-center gap-2 w-full py-3 px-4 bg-gradient-to-r from-yellow-500 to-amber-500 text-white rounded-lg hover:from-yellow-600 hover:to-amber-600 transition-all font-bold shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDownloadingTicket ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    מכין כרטיס...
                  </>
                ) : (
                  <>
                    <Ticket className="w-5 h-5" />
                    הורד כרטיס המתנה
                  </>
                )}
              </button>

              {cancellationToken && event?.allowCancellation && (
                <div className="mt-4">
                  <a
                    href={`/cancel/${cancellationToken}`}
                    className="block text-center text-sm text-red-600 hover:text-red-700 underline"
                  >
                    לביטול ההזמנה לחץ כאן
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">ההרשמה הושלמה בהצלחה!</h1>
            <p className="text-gray-600 mb-6">המקום שלך נשמר לאירוע</p>

            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <p className="text-sm text-gray-500 mb-2">קוד אישור</p>
              <p className="text-3xl font-bold text-gray-900 font-mono">{confirmationCode}</p>
            </div>

            {qrCodeImage && (
              <div className="mb-6 bg-white border-2 border-gray-200 rounded-lg p-6">
                <p className="text-sm text-gray-500 mb-3 text-center">📱 QR לכניסה לאירוע</p>
                <div className="flex justify-center">
                  <img
                    src={qrCodeImage}
                    alt="QR Code"
                    className="w-48 h-48 border-4 border-gray-300 rounded-lg"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-3 text-center">הצג קוד זה בכניסה לאירוע</p>
                <a
                  href={qrCodeImage}
                  download={`ticket-${confirmationCode}.png`}
                  className="mt-3 block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
                >
                  💾 הורד QR כתמונה
                </a>
              </div>
            )}

            <div className="text-right space-y-2">
              <div className="flex items-start gap-2">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">{event.title}</p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(event.startAt), 'EEEE, dd בMMMM yyyy בשעה HH:mm', {
                      locale: he,
                    })}
                  </p>
                </div>
              </div>
              {event.location && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <p className="text-sm text-gray-600">{event.location}</p>
                </div>
              )}
            </div>

            {event.completionMessage && (
              <div className="mt-6 p-5 bg-blue-50 rounded-lg border-2 border-blue-300">
                <p className="text-lg text-blue-900 font-bold mb-2">📌 הודעה חשובה מהמארגן:</p>
                <p className="text-base text-gray-900 font-bold whitespace-pre-wrap leading-relaxed">
                  {event.completionMessage}
                </p>
              </div>
            )}

            {/* Download Full Ticket Button */}
            <button
              onClick={handleDownloadTicket}
              disabled={isDownloadingTicket}
              className="mt-6 flex items-center justify-center gap-2 w-full py-4 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-bold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDownloadingTicket ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  מכין כרטיס...
                </>
              ) : (
                <>
                  <Ticket className="w-5 h-5" />
                  הורד כרטיס מלא
                </>
              )}
            </button>

            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">💡 מומלץ להוריד את הכרטיס לשמירה במכשיר</p>
            </div>

            {cancellationToken && event.allowCancellation && (
              <div className="mt-4">
                <a
                  href={`/cancel/${cancellationToken}`}
                  className="block text-center text-sm text-red-600 hover:text-red-700 underline"
                >
                  לביטול ההזמנה לחץ כאן
                </a>
              </div>
            )}

            <div className="mt-4">
              <FeedbackInline />
            </div>
          </div>
        </div>
      </div>
    )
  }

  const schoolColor = event?.school?.primaryColor || '#3b82f6'
  const gradientFrom = `${schoolColor}20`
  const gradientTo = `${schoolColor}10`

  // Visual mode: warm amber-light for TABLE_BASED, bright blue for CAPACITY_BASED
  const isTableBased = event.eventType === 'TABLE_BASED'

  const theme = isTableBased
    ? {
        page: 'bg-amber-50',
        headerBg: 'bg-white',
        overlayClass: 'from-gray-900/50 to-gray-900/75',
        formCard: 'bg-white border border-amber-100',
        inputBorder: 'border-amber-300 focus:border-amber-500',
        inputText: 'text-gray-900 bg-white',
        label: 'text-gray-700',
        submitBtn: 'from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600',
        chip: 'bg-amber-50 text-amber-800 border border-amber-200',
        cardText: 'text-gray-900',
        mutedText: 'text-gray-500',
        sectionCard: 'bg-white border border-amber-100 rounded-2xl shadow-xl',
        checkboxColor: 'text-amber-600',
        missingBg: 'bg-red-50 border-2 border-red-200',
        missingText: 'text-red-700',
      }
    : {
        page: 'bg-gray-50',
        headerBg: '',
        overlayClass: 'from-blue-900/40 to-blue-900/70',
        formCard: 'bg-white',
        inputBorder: 'border-gray-300 focus:border-blue-500',
        inputText: 'text-gray-900 bg-white',
        label: 'text-gray-700',
        submitBtn: 'from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700',
        chip: 'bg-gray-100 text-gray-700',
        cardText: 'text-gray-900',
        mutedText: 'text-gray-600',
        sectionCard: 'bg-white rounded-2xl shadow-xl',
        checkboxColor: 'text-blue-600',
        missingBg: 'bg-red-50 border-2 border-red-200',
        missingText: 'text-red-700',
      }

  return (
    <div
      className={`min-h-screen py-6 sm:py-12 pb-32 md:pb-12 ${theme.page}`}
      style={{ background: `linear-gradient(to bottom right, ${gradientFrom}, ${gradientTo})` }}
    >
      <div className="max-w-2xl mx-auto px-4">
        {/* School Branding Header */}
        {event.school && (
          <div className="mb-6 flex items-center gap-3 p-4 rounded-xl shadow-md bg-white">
            {event.school.logo ? (
              <img
                src={event.school.logo}
                alt={event.school.name}
                className="w-14 h-14 rounded-lg object-cover"
              />
            ) : (
              <div
                className="w-14 h-14 rounded-lg flex items-center justify-center text-white font-bold text-xl"
                style={{ backgroundColor: schoolColor }}
              >
                {event.school.name.charAt(0)}
              </div>
            )}
            <div className="flex-1">
              <div className="text-sm text-gray-500">אירוע של</div>
              <div className="font-bold text-lg" style={{ color: schoolColor }}>
                {event.school.name}
              </div>
            </div>
          </div>
        )}

        {/* Event Header — Hero */}
        <div className={`${theme.sectionCard} overflow-hidden mb-6`}>
          {/* Hero: cover image (custom or default) */}
          <div className="relative h-40 sm:h-56">
            {/* Kartis Logo Watermark / Brand in the Top Corner */}
            <div className="absolute top-4 left-4 z-10">
              <a
                href="https://kartis.info"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-white/80 backdrop-blur-sm shadow-md px-3 py-1.5 rounded-full hover:bg-white transition-colors"
              >
                <div className="w-6 h-6 bg-red-600 rounded flex items-center justify-center">
                  <Ticket className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-sm font-bold text-gray-900 font-headline">kartis.info</span>
              </a>
            </div>

            <img
              src={event.coverImage ?? DEFAULT_COVER_IMAGE}
              alt={event.title}
              loading="lazy"
              className="w-full h-full object-cover"
            />
            {/* Dark overlay for text legibility */}
            <div className={`absolute inset-0 bg-gradient-to-t ${theme.overlayClass}`} />
            {/* Title on hero */}
            <div className="absolute bottom-0 inset-x-0 p-6" dir="rtl">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 drop-shadow-lg">
                {event.title}
              </h1>
              {event.gameType && (
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${theme.chip}`}
                >
                  {event.gameType}
                </span>
              )}
            </div>
          </div>

          {/* Info chips row */}
          {(() => {
            const infoChipClass =
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium'
            const infoChipStyle = { backgroundColor: `${schoolColor}15`, color: schoolColor }
            return (
              <div className="px-5 py-4 flex flex-wrap gap-2 border-b border-gray-100" dir="rtl">
                {/* Date chip */}
                <span className={infoChipClass} style={infoChipStyle}>
                  <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                  {format(new Date(event.startAt), 'EEEE, d בMMMM בשעה HH:mm', { locale: he })}
                </span>
                {/* Location chip */}
                {event.location && (
                  <span className={infoChipClass} style={infoChipStyle}>
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    {event.location}
                  </span>
                )}
                {/* Spots chip */}
                {event.eventType === 'CAPACITY_BASED' && (
                  <span
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                      isFull
                        ? 'bg-red-100 text-red-700'
                        : spotsLeft <= 5
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {isFull
                      ? '⚠️ רשימת המתנה'
                      : spotsLeft <= 5
                        ? `🔥 נותרו ${spotsLeft} מקומות!`
                        : `✓ ${spotsLeft} מקומות פנויים`}
                  </span>
                )}
                {event.eventType === 'TABLE_BASED' && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-700">
                    ✓ פתוח להזמנות
                  </span>
                )}
              </div>
            )
          })()}

          <div className="p-6 space-y-4">
            {event.description && (
              <p className={`text-sm leading-relaxed ${theme.mutedText}`}>{event.description}</p>
            )}

            {/* 2026 UX: Improved Pricing Display */}
            {event.paymentRequired && (
              <div className="pt-4 pb-4 border-t border-gray-200">
                <div className="bg-white rounded-xl p-5 border-2 border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                        <span className="text-xl">💳</span>
                      </div>
                      <span className="text-base font-semibold text-gray-700">מחיר האירוע</span>
                    </div>
                    <div className="text-left">
                      {event.pricingModel === 'FREE' && (
                        <span className="text-2xl font-black text-green-600">חינמי</span>
                      )}
                      {event.pricingModel === 'FIXED_PRICE' && event.priceAmount && (
                        <div className="text-left">
                          <div className="text-3xl font-black text-gray-900">
                            ₪{event.priceAmount}
                          </div>
                          <div className="text-xs text-gray-500">מחיר קבוע</div>
                        </div>
                      )}
                      {event.pricingModel === 'PER_GUEST' && event.priceAmount && (
                        <div>
                          <div className="text-xl font-bold text-gray-600 line-through">
                            ₪{event.priceAmount} למשתתף
                          </div>
                          {(event.eventType === 'TABLE_BASED' ? guestsCount : spotsCount) > 1 && (
                            <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="text-sm text-gray-600">
                                {event.eventType === 'TABLE_BASED' ? guestsCount : spotsCount}{' '}
                                משתתפים × ₪{event.priceAmount}
                              </div>
                              <div className="text-2xl font-black text-gray-900 mt-1">
                                ₪{totalPrice}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {event.paymentTiming === 'UPFRONT' && (
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                      <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
                        <span className="text-sm text-blue-800 font-semibold">
                          💳 תשלום מקוון מאובטח
                        </span>
                      </div>
                    </div>
                  )}
                  {event.paymentTiming === 'POST_REGISTRATION' && (
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                      <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg">
                        <span className="text-sm text-green-800 font-semibold">
                          📧 קישור לתשלום יישלח לאימייל
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Capacity progress bar (CAPACITY_BASED only) */}
            {event.eventType === 'CAPACITY_BASED' && (
              <div className="pt-2">
                <div className="w-full rounded-full h-2 overflow-hidden bg-gray-100">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isFull ? 'bg-red-500' : percentage > 80 ? 'bg-orange-400' : 'bg-green-400'
                    }`}
                    style={{ width: `${Math.max(percentage, 3)}%` }}
                  />
                </div>
                <p className="text-xs mt-1.5 text-left text-gray-400">
                  {event.totalSpotsTaken} / {event.capacity} מקומות נתפסו
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Registration Form - 2026 UX Enhanced */}
        <div className={`${theme.sectionCard} p-6 sm:p-8 mb-6`}>
          <h2 className={`text-xl font-bold mb-6 ${theme.cardText}`}>
            {event.eventType === 'TABLE_BASED'
              ? 'הרשמה לאירוע'
              : isFull
                ? 'הרשמה לרשימת המתנה'
                : 'טופס הרשמה'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 2026 UX: Enhanced field spacing from 16px to 24px */}
            {event.fieldsSchema.map((field: any) => (
              <div key={field.id}>
                <label className={`block text-sm font-medium mb-2 ${theme.label}`}>
                  {field.label}
                  {field.required && <span className="text-red-500 mr-1">*</span>}
                </label>
                {field.type === 'dropdown' ? (
                  <select
                    name={field.name}
                    required={field.required}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleFieldChange(field.name, e.target.value, field)}
                    onBlur={() => {
                      const validation = validateField(field.name, formData[field.name], field)
                      setFieldValidation((prev) => ({ ...prev, [field.name]: validation }))
                    }}
                    className={`w-full px-4 py-4 border-2 rounded-lg transition-all duration-200 ${theme.inputText}
                      ${
                        fieldValidation[field.name]?.touched &&
                        !fieldValidation[field.name]?.isValid
                          ? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/20'
                          : fieldValidation[field.name]?.isValid &&
                              fieldValidation[field.name]?.touched
                            ? 'border-green-500 focus:border-green-500 focus:ring-4 focus:ring-green-500/20'
                            : `${theme.inputBorder} focus:ring-4 focus:ring-blue-500/20`
                      }`}
                  >
                    <option value="">בחר...</option>
                    {field.options?.map((option: string) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : field.type === 'checkbox' ? (
                  <div className="flex items-center gap-3">
                    <input
                      name={field.name}
                      type="checkbox"
                      checked={formData[field.name] || false}
                      onChange={(e) => handleFieldChange(field.name, e.target.checked, field)}
                      className={`w-5 h-5 rounded border-gray-300 ${theme.checkboxColor} focus:ring-4 focus:ring-blue-500/20`}
                    />
                    <span className={`text-sm ${theme.label}`}>
                      {field.placeholder || field.label}
                    </span>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      name={field.name}
                      type={
                        field.type === 'number'
                          ? 'number'
                          : field.type === 'email'
                            ? 'email'
                            : 'text'
                      }
                      required={field.required}
                      value={formData[field.name] || ''}
                      onChange={(e) => handleFieldChange(field.name, e.target.value, field)}
                      onBlur={() => {
                        const validation = validateField(field.name, formData[field.name], field)
                        setFieldValidation((prev) => ({ ...prev, [field.name]: validation }))
                      }}
                      placeholder={field.placeholder}
                      className={`w-full px-4 py-4 pr-12 border-2 rounded-lg transition-all duration-200 ${theme.inputText} text-base
                        ${
                          fieldValidation[field.name]?.touched &&
                          !fieldValidation[field.name]?.isValid
                            ? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/20'
                            : fieldValidation[field.name]?.isValid &&
                                fieldValidation[field.name]?.touched
                              ? 'border-green-500 focus:border-green-500 focus:ring-4 focus:ring-green-500/20'
                              : `${theme.inputBorder} focus:ring-4 focus:ring-blue-500/20`
                        }`}
                    />
                    {/* 2026 UX: Real-time validation icon */}
                    {fieldValidation[field.name]?.touched && (
                      <div className="absolute left-4 top-1/2 -translate-y-1/2">
                        {fieldValidation[field.name]?.isValid ? (
                          <Check className="w-5 h-5 text-green-600" />
                        ) : (
                          <X className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                    )}
                  </div>
                )}
                {/* 2026 UX: Inline validation message */}
                {fieldValidation[field.name]?.touched && fieldValidation[field.name]?.message && (
                  <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {fieldValidation[field.name]?.message}
                  </p>
                )}
              </div>
            ))}

            {/* Table-based events: Guest count selector */}
            {event.eventType === 'TABLE_BASED' && (
              <div className="rounded-xl p-6 border-2 bg-amber-50 border-amber-200">
                <GuestCountSelector
                  value={guestsCount}
                  onChange={setGuestsCount}
                  min={1}
                  max={event.maxTableCapacity || 12}
                  label="כמה אורחים?"
                  colorScheme="amber"
                />
                <p className="text-center text-xs mt-4 text-gray-600">
                  נמצא עבורך את השולחן המתאים ביותר
                </p>
              </div>
            )}

            {/* Capacity-based events: Spots selector */}
            {event.eventType === 'CAPACITY_BASED' &&
              (() => {
                // Calculate max selectable spots
                const maxSelectable = isFull
                  ? event.maxSpotsPerPerson // Waitlist: use full event limit
                  : Math.min(event.maxSpotsPerPerson, spotsLeft) // Normal: available spots only

                return (
                  <div>
                    <label className={`block text-base font-semibold mb-3 ${theme.cardText}`}>
                      מספר מקומות <span className="text-red-500 mr-1">*</span>
                    </label>
                    <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                      <div className="flex items-center gap-3" dir="rtl">
                        {/* Decrement Button (Right side in RTL) */}
                        <button
                          type="button"
                          onClick={() => {
                            if (spotsCount > 1) {
                              setSpotsCount(spotsCount - 1)
                            }
                          }}
                          disabled={spotsCount <= 1}
                          className="w-14 h-14 flex items-center justify-center bg-white border-2 border-gray-300 rounded-xl hover:bg-blue-50 hover:border-blue-400 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 transition-all text-gray-700 font-bold text-2xl shadow-sm active:scale-95 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
                          aria-label="הפחת מספר מקומות"
                        >
                          −
                        </button>

                        {/* Dropdown Selector */}
                        <select
                          value={spotsCount}
                          onChange={(e) => setSpotsCount(parseInt(e.target.value))}
                          required
                          style={{ backgroundColor: schoolColor }}
                          className="flex-1 px-4 py-4 rounded-xl focus:ring-4 focus:ring-blue-500/30 text-white text-center font-bold text-xl shadow-md border-0 appearance-none cursor-pointer"
                        >
                          {Array.from({ length: maxSelectable }, (_, i) => i + 1).map((num) => (
                            <option key={num} value={num} className="bg-white text-gray-900">
                              {num}
                            </option>
                          ))}
                        </select>

                        {/* Increment Button (Left side in RTL) */}
                        <button
                          type="button"
                          onClick={() => {
                            if (spotsCount < maxSelectable) {
                              setSpotsCount(spotsCount + 1)
                            }
                          }}
                          disabled={spotsCount >= maxSelectable}
                          className="w-14 h-14 flex items-center justify-center bg-white border-2 border-gray-300 rounded-xl hover:bg-blue-50 hover:border-blue-400 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 transition-all text-gray-700 font-bold text-2xl shadow-sm active:scale-95 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
                          aria-label="הוסף מספר מקומות"
                        >
                          +
                        </button>
                      </div>

                      {/* Info Text */}
                      <div className="text-center mt-3">
                        <p className="text-sm text-gray-600">
                          {isFull
                            ? `ניתן לבחור עד ${maxSelectable} מקומות לרשימת המתנה`
                            : `זמינים ${spotsLeft} מקומות • מקסימום ${maxSelectable} לאדם`}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })()}

            {event.conditions && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">תנאי השתתפות</h3>
                <p className="text-sm text-gray-600 mb-3 whitespace-pre-wrap">{event.conditions}</p>
                {event.requireAcceptance && (
                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      required
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-4 focus:ring-blue-500/20 mt-0.5 w-5 h-5"
                    />
                    <span className="text-sm text-gray-700">
                      אני מאשר/ת שקראתי ומסכים/ה לתנאי ההשתתפות
                    </span>
                  </label>
                )}
              </div>
            )}

            {/* Missing Fields Indicator */}
            {!isFormValid && (
              <div className={`${theme.missingBg} rounded-xl p-4`}>
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className={`text-sm font-semibold mb-2 ${theme.missingText}`}>
                      יש למלא את השדות הבאים כדי להמשיך:
                    </p>
                    <ul className={`text-sm space-y-1 ${theme.missingText}`}>
                      {missingFields.map((field, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
                          {field}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* 2026 UX: Desktop submit button (hidden on mobile) */}
            <button
              type="submit"
              disabled={submitting || event.status !== 'OPEN' || !isFormValid}
              className={`hidden md:flex w-full h-14 items-center justify-center bg-gradient-to-r ${theme.submitBtn} text-white font-bold rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg active:scale-[0.98]`}
            >
              {submitting ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin ml-2" />
                  {event.paymentRequired && event.paymentTiming === 'UPFRONT'
                    ? 'מעביר לתשלום...'
                    : 'שולח...'}
                </span>
              ) : !isFormValid ? (
                'נא למלא את כל השדות החובה'
              ) : event.paymentRequired && event.paymentTiming === 'UPFRONT' ? (
                totalPrice > 0 ? (
                  `המשך לתשלום (₪${totalPrice})`
                ) : (
                  'המשך לתשלום'
                )
              ) : event.eventType === 'TABLE_BASED' ? (
                'אשר הזמנה'
              ) : isFull ? (
                'הרשמה לרשימת המתנה'
              ) : (
                'שלח הרשמה'
              )}
            </button>
          </form>
        </div>
      </div>

      {/* 2026 UX: Sticky CTA Button (Mobile Only) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 shadow-2xl z-50 border-t-2 bg-white border-gray-200">
        <button
          type="submit"
          form="registration-form"
          onClick={handleSubmit}
          disabled={submitting || event.status !== 'OPEN' || !isFormValid}
          className={`w-full h-14 flex items-center justify-center bg-gradient-to-r ${theme.submitBtn} text-white font-bold rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg active:scale-[0.98]`}
        >
          {submitting ? (
            <span className="flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin ml-2" />
              {event.paymentRequired && event.paymentTiming === 'UPFRONT'
                ? 'מעביר לתשלום...'
                : 'שולח...'}
            </span>
          ) : !isFormValid ? (
            'נא למלא את כל השדות החובה'
          ) : event.paymentRequired && event.paymentTiming === 'UPFRONT' ? (
            totalPrice > 0 ? (
              `המשך לתשלום (₪${totalPrice})`
            ) : (
              'המשך לתשלום'
            )
          ) : event.eventType === 'TABLE_BASED' ? (
            'אשר הזמנה'
          ) : isFull ? (
            'הרשמה לרשימת המתנה'
          ) : (
            'שלח הרשמה'
          )}
        </button>
      </div>

      {/* Modal for errors and confirmations */}
      <Modal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        dir="rtl"
      />

      {/* Toast notifications */}
      <ToastContainer position="top-center" dir="rtl" />
    </div>
  )
}
