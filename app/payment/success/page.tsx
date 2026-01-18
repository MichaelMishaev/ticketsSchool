'use client'

import { useSearchParams } from 'next/navigation'
import { CheckCircle, Calendar, MapPin, Download, Ticket } from 'lucide-react'
import { Suspense, useEffect, useState, useCallback } from 'react'
import { trackEvent } from '@/lib/analytics'

function isValidReturnUrl(url: string): boolean {
  if (!url || url === '/') return true

  // Only allow relative paths
  if (url.startsWith('/') && !url.startsWith('//')) {
    return true
  }

  // Or same-origin URLs
  try {
    const parsed = new URL(
      url,
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
    )
    return (
      parsed.origin ===
      (typeof window !== 'undefined' ? window.location.origin : 'http://localhost')
    )
  } catch {
    return false
  }
}

// Generate a professional ticket image using Canvas API
async function generateTicketImage(
  eventTitle: string,
  code: string,
  qrCode: string | null,
  eventDate: string | null,
  eventLocation: string | null
): Promise<string> {
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

  // Header bar
  const headerGradient = ctx.createLinearGradient(0, 0, width, 0)
  headerGradient.addColorStop(0, '#16a34a')
  headerGradient.addColorStop(1, '#059669')
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
  const maxWidth = width - 60
  const titleLines = wrapText(ctx, eventTitle, maxWidth)
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
  ctx.fillText(code, width / 2, yPos + 50)

  yPos += 120

  // QR Code
  if (qrCode) {
    const qrImg = new Image()
    qrImg.crossOrigin = 'anonymous'

    await new Promise<void>((resolve, reject) => {
      qrImg.onload = () => resolve()
      qrImg.onerror = () => reject(new Error('Failed to load QR'))
      qrImg.src = qrCode
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

  if (eventDate) {
    ctx.fillStyle = '#16a34a'
    ctx.font = '20px Arial, sans-serif'
    ctx.fillText('📅', width - 40, yPos)

    ctx.fillStyle = '#374151'
    ctx.font = '18px Arial, sans-serif'
    ctx.fillText(eventDate, width - 70, yPos)
    yPos += 35
  }

  if (eventLocation) {
    ctx.fillStyle = '#16a34a'
    ctx.font = '20px Arial, sans-serif'
    ctx.fillText('📍', width - 40, yPos)

    ctx.fillStyle = '#374151'
    ctx.font = '18px Arial, sans-serif'
    ctx.fillText(eventLocation, width - 70, yPos)
    yPos += 35
  }

  // Footer
  ctx.fillStyle = '#9ca3af'
  ctx.font = '12px Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('kartis.info', width / 2, height - 30)

  return canvas.toDataURL('image/png')
}

// Helper function to wrap text
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
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

function SuccessContent() {
  const searchParams = useSearchParams()
  const code = searchParams.get('code') || ''
  const qrCode = searchParams.get('qr')
  const eventTitle = searchParams.get('event') || 'האירוע'
  const eventDate = searchParams.get('date')
  const eventLocation = searchParams.get('location')
  const rawReturnUrl = searchParams.get('return') || '/'
  const returnUrl = isValidReturnUrl(rawReturnUrl) ? rawReturnUrl : '/'

  const [isDownloading, setIsDownloading] = useState(false)

  // Track payment completion in Google Analytics
  useEffect(() => {
    if (code) {
      trackEvent({
        action: 'payment_completed',
        category: 'payment',
        label: eventTitle,
        additionalParams: {
          confirmation_code: code,
          event_title: eventTitle,
        },
      })
    }
  }, [code, eventTitle])

  // Download full ticket as image
  const handleDownloadTicket = useCallback(async () => {
    if (!code) return

    setIsDownloading(true)
    try {
      const ticketImage = await generateTicketImage(
        eventTitle,
        code,
        qrCode,
        eventDate,
        eventLocation
      )

      // Create download link
      const link = document.createElement('a')
      link.href = ticketImage
      link.download = `כרטיס-${code}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Track download
      trackEvent({
        action: 'ticket_downloaded',
        category: 'engagement',
        label: eventTitle,
        additionalParams: {
          confirmation_code: code,
        },
      })
    } catch (error) {
      console.error('Failed to generate ticket:', error)
    } finally {
      setIsDownloading(false)
    }
  }, [code, eventTitle, qrCode, eventDate, eventLocation])

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4"
      dir="rtl"
    >
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        {/* Success Icon */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">התשלום בוצע בהצלחה!</h1>
          <p className="text-gray-600">ההזמנה שלך אושרה והמקום שלך נשמר</p>
        </div>

        {/* Confirmation Code */}
        {code && (
          <div className="bg-gray-50 rounded-xl p-6 mb-6 border-2 border-green-200">
            <p className="text-sm text-gray-500 mb-2 text-center">קוד אישור</p>
            <p className="text-3xl font-bold text-gray-900 font-mono text-center tracking-wider">
              {code}
            </p>
          </div>
        )}

        {/* QR Code */}
        {qrCode && (
          <div className="mb-6 bg-white border-2 border-gray-200 rounded-xl p-6">
            <p className="text-sm text-gray-500 mb-3 text-center">QR לכניסה לאירוע</p>
            <div className="flex justify-center mb-4">
              <img
                src={qrCode}
                alt="QR Code"
                className="w-48 h-48 border-4 border-gray-300 rounded-lg"
              />
            </div>
            <p className="text-xs text-gray-500 text-center mb-3">הצג קוד זה בכניסה לאירוע</p>
            <a
              href={qrCode}
              download={`ticket-${code}.png`}
              className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold"
            >
              <Download className="w-4 h-4" />
              הורד QR כתמונה
            </a>
          </div>
        )}

        {/* Event Details */}
        <div className="space-y-3 mb-6 text-right">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-gray-900">{eventTitle}</p>
              {eventDate && <p className="text-sm text-gray-600 mt-1">{eventDate}</p>}
            </div>
          </div>
          {eventLocation && (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-600">{eventLocation}</p>
            </div>
          )}
        </div>

        {/* Download Full Ticket */}
        {code && (
          <button
            onClick={handleDownloadTicket}
            disabled={isDownloading}
            className="flex items-center justify-center gap-2 w-full py-4 px-4 mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-bold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDownloading ? (
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
        )}

        {/* Success Tips */}
        <div className="bg-green-50 rounded-lg p-4 mb-4 border border-green-200">
          <p className="text-sm text-green-800 text-center">💡 מומלץ להוריד את הכרטיס לשמירה</p>
        </div>

        {/* Return Button */}
        <a
          href={returnUrl}
          className="block w-full py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all text-center"
        >
          חזור לדף האירוע
        </a>
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">טוען...</p>
          </div>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  )
}
