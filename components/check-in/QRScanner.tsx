'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

interface QRScannerProps {
  isOpen: boolean
  onClose: () => void
  onScan: (qrCode: string) => void
}

export function QRScanner({ isOpen, onClose, onScan }: QRScannerProps) {
  const [error, setError] = useState<string | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const hasScanned = useRef(false)

  useEffect(() => {
    if (!isOpen) {
      // Cleanup when modal closes
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .then(() => {
            scannerRef.current?.clear()
            scannerRef.current = null
          })
          .catch((err) => {
            console.error('Error stopping scanner:', err)
          })
      }
      setError(null)
      hasScanned.current = false
      return
    }

    // Initialize scanner when modal opens
    const initScanner = async () => {
      try {
        setError(null)
        hasScanned.current = false

        const scanner = new Html5Qrcode('qr-reader')
        scannerRef.current = scanner

        await scanner.start(
          { facingMode: 'environment' }, // Use back camera
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            // Only process first scan
            if (!hasScanned.current) {
              hasScanned.current = true
              onScan(decodedText)

              // Stop scanner after successful scan
              scanner
                .stop()
                .then(() => {
                  scanner.clear()
                  scannerRef.current = null
                  onClose()
                })
                .catch((err) => console.error('Error stopping after scan:', err))
            }
          },
          () => {
            // Ignore continuous scanning errors
          }
        )
      } catch (err: unknown) {
        console.error('Error initializing scanner:', err)

        if (err instanceof Error && err.name === 'NotAllowedError') {
          setError('נא לאפשר גישה למצלמה כדי לסרוק QR')
        } else if (err instanceof Error && err.name === 'NotFoundError') {
          setError('לא נמצאה מצלמה במכשיר')
        } else {
          setError('שגיאה בפתיחת המצלמה. נסה שוב.')
        }
      }
    }

    initScanner()

    return () => {
      // Cleanup on unmount
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .then(() => {
            scannerRef.current?.clear()
            scannerRef.current = null
          })
          .catch((err) => {
            console.error('Error cleaning up scanner:', err)
          })
      }
    }
  }, [isOpen, onScan, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90">
      <div className="relative w-full h-full flex flex-col">
        {/* Header */}
        <div className="bg-white bg-opacity-10 backdrop-blur-sm p-4 flex items-center justify-between" dir="rtl">
          <div className="text-white text-lg font-medium">סריקת QR</div>
          <button
            onClick={onClose}
            className="text-white text-2xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
            aria-label="סגור"
          >
            ×
          </button>
        </div>

        {/* Scanner area */}
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          {error ? (
            <div className="bg-red-500 text-white rounded-lg p-6 max-w-md text-center" dir="rtl">
              <div className="text-4xl mb-3">⚠️</div>
              <div className="text-lg font-medium mb-2">שגיאה</div>
              <div className="text-sm">{error}</div>
              <button
                onClick={onClose}
                className="mt-4 px-6 py-2 bg-white text-red-500 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                סגור
              </button>
            </div>
          ) : (
            <>
              <div
                id="qr-reader"
                className="w-full max-w-md rounded-lg overflow-hidden shadow-2xl"
              />
              <div className="text-white text-center mt-6 px-4" dir="rtl">
                <div className="text-lg font-medium mb-2">מכוון את המצלמה לקוד QR</div>
                <div className="text-sm opacity-80">
                  הסריקה תתבצע אוטומטית
                </div>
              </div>
            </>
          )}
        </div>

        {/* Instructions */}
        {!error && (
          <div className="bg-white bg-opacity-10 backdrop-blur-sm p-4 text-center text-white text-sm" dir="rtl">
            <div className="opacity-80">
              💡 טיפ: ודא תאורה טובה ומרחק של 10-30 ס״מ מהקוד
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
