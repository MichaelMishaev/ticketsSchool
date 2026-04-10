'use client'

import { useState, useCallback } from 'react'
import { Ticket } from 'lucide-react'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import { toast } from '@/components/ui/Toast'

interface TicketGeneratorProps {
  event: {
    title: string
    startAt: string
    location?: string
    completionMessage?: string
    school: {
      name: string
      primaryColor: string
    }
  }
  confirmationCode: string
  qrCodeImage: string | null
  variant: 'confirmed' | 'waitlist'
}

export default function TicketGenerator({
  event,
  confirmationCode,
  qrCodeImage,
  variant,
}: TicketGeneratorProps) {
  const [isDownloadingTicket, setIsDownloadingTicket] = useState(false)

  const generateTicketImage = useCallback(async (): Promise<string> => {
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
    ctx.fillText(
      '\u{1F3AB} \u05DB\u05E8\u05D8\u05D9\u05E1 \u05DB\u05E0\u05D9\u05E1\u05D4',
      width / 2,
      60
    )

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
    ctx.fillText('\u05E7\u05D5\u05D3 \u05D0\u05D9\u05E9\u05D5\u05E8', width / 2, yPos)

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
      ctx.fillText(
        '\u05D4\u05E6\u05D2 \u05E7\u05D5\u05D3 \u05D6\u05D4 \u05D1\u05DB\u05E0\u05D9\u05E1\u05D4 \u05DC\u05D0\u05D9\u05E8\u05D5\u05E2',
        width / 2,
        yPos + qrSize + 30
      )

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
    ctx.fillText('\u{1F4C5}', width - 40, yPos)

    ctx.fillStyle = '#374151'
    ctx.font = '18px Arial, sans-serif'
    ctx.fillText(eventDate, width - 70, yPos)
    yPos += 35

    // Location
    if (event.location) {
      ctx.fillStyle = schoolColor
      ctx.font = '20px Arial, sans-serif'
      ctx.fillText('\u{1F4CD}', width - 40, yPos)

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

    // Special Message
    if (event.completionMessage) {
      yPos += 25
      ctx.fillStyle = '#1e3a8a'
      ctx.font = 'bold 20px Arial, sans-serif'
      ctx.textAlign = 'center'

      const messageLines = wrapText(event.completionMessage, width - 60)
      messageLines.forEach((line) => {
        ctx.fillText(line, width / 2, yPos)
        yPos += 30
      })
      yPos += 5
    }

    // Footer
    ctx.fillStyle = '#9ca3af'
    ctx.font = '12px Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('kartis.info', width / 2, height - 30)

    return canvas.toDataURL('image/png')
  }, [event, confirmationCode, qrCodeImage])

  const handleDownloadTicket = useCallback(async () => {
    if (!confirmationCode) return

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
  }, [confirmationCode, generateTicketImage])

  const buttonClass =
    variant === 'waitlist'
      ? 'mt-4 flex items-center justify-center gap-2 w-full py-3 px-4 bg-gradient-to-r from-yellow-500 to-amber-500 text-white rounded-lg hover:from-yellow-600 hover:to-amber-600 transition-all font-bold shadow-md disabled:opacity-50 disabled:cursor-not-allowed'
      : 'mt-6 flex items-center justify-center gap-2 w-full py-4 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-bold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed'

  const buttonLabel = variant === 'waitlist' ? 'הורד כרטיס המתנה' : 'הורד כרטיס מלא'

  return (
    <button onClick={handleDownloadTicket} disabled={isDownloadingTicket} className={buttonClass}>
      {isDownloadingTicket ? (
        <>
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          מכין כרטיס...
        </>
      ) : (
        <>
          <Ticket className="w-5 h-5" />
          {buttonLabel}
        </>
      )}
    </button>
  )
}
