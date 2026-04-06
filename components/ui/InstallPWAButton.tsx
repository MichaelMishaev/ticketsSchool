'use client'

import React, { useState, useEffect } from 'react'
import { Download, X, Share, ArrowUp } from 'lucide-react'
import { iconButton } from '@/lib/design-tokens'

// The browser's BeforeInstallPromptEvent is not in standard TypeScript lib.
// This interface is intentionally not exported — the test file declares its own
// copy for the same reason (can't import a non-exported interface).
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface InstallPWAButtonProps {
  variant?: 'full' | 'icon-only'
  className?: string
}

const LS_KEY = 'pwa-can-install'

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isInStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in window.navigator &&
      (window.navigator as { standalone?: boolean }).standalone === true)
  )
}

export function InstallPWAButton({ variant = 'full', className = '' }: InstallPWAButtonProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalling, setIsInstalling] = useState(false)
  const [showIOSModal, setShowIOSModal] = useState(false)
  // null = SSR / not yet determined
  const [installable, setInstallable] = useState<'android' | 'ios' | 'installed' | null>(null)

  useEffect(() => {
    // Already running as installed PWA — hide everywhere
    if (isInStandaloneMode()) {
      localStorage.removeItem(LS_KEY)
      setInstallable('installed')
      return
    }

    if (isIOS()) {
      setInstallable('ios')
      return
    }

    // On Android/Chrome: beforeinstallprompt only fires once per "install opportunity".
    // Subsequent refreshes won't re-fire it. We persist a flag so the button stays
    // visible across page loads, and trigger the saved prompt when available.
    const wasPreviouslyInstallable = localStorage.getItem(LS_KEY) === '1'
    if (wasPreviouslyInstallable) {
      setInstallable('android')
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setInstallable('android')
      localStorage.setItem(LS_KEY, '1')
    }

    const handleAppInstalled = () => {
      setDeferredPrompt(null)
      setInstallable('installed')
      localStorage.removeItem(LS_KEY)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  if (installable === null || installable === 'installed') return null

  const handleAndroidInstall = async () => {
    if (isInstalling) return
    if (!deferredPrompt) {
      // Prompt not available this session — show manual instructions
      setShowIOSModal(true)
      return
    }
    setIsInstalling(true)
    try {
      await deferredPrompt.prompt()
      setDeferredPrompt(null)
    } finally {
      setIsInstalling(false)
    }
  }

  const handleClick = () => {
    if (installable === 'ios') {
      setShowIOSModal(true)
    } else {
      handleAndroidInstall()
    }
  }

  const button =
    variant === 'icon-only' ? (
      <button
        type="button"
        onClick={handleClick}
        disabled={isInstalling}
        aria-label="התקן אפליקציה"
        className={`${iconButton.primary} flex-shrink-0 ${className}`}
      >
        <Download className="h-5 w-5" />
        <span className="sr-only">התקן אפליקציה</span>
      </button>
    ) : (
      <button
        type="button"
        onClick={handleClick}
        disabled={isInstalling}
        className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-all duration-200 ease-out border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-300 ${className}`}
      >
        <Download className="w-4 h-4" />
        התקן אפליקציה
      </button>
    )

  const isAndroid = installable === 'android'

  return (
    <>
      {button}

      {showIOSModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setShowIOSModal(false)}
        >
          <div
            className="bg-white rounded-t-2xl w-full max-w-md p-6 pb-10 shadow-2xl"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">התקנת האפליקציה</h2>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="סגור"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isAndroid ? (
              <>
                <p className="text-sm text-gray-500 mb-5">כדי להוסיף את kartis.info למסך הבית:</p>
                <ol className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center">
                      1
                    </span>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">פתח את תפריט Chrome</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        שלוש נקודות בפינה הימנית העליונה
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center">
                      2
                    </span>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">
                        בחר &quot;הוסף למסך הבית&quot;
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        אם לא רואה — רענן את הדף ונסה שוב
                      </p>
                    </div>
                  </li>
                </ol>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-500 mb-5">
                  כדי להוסיף את kartis.info למסך הבית שלך בשני צעדים פשוטים:
                </p>
                <ol className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center">
                      1
                    </span>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">לחץ על כפתור השיתוף</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Share className="w-3.5 h-3.5" />
                        הסמל בסרגל התחתון של Safari
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center">
                      2
                    </span>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">
                        בחר &quot;הוסף למסך הבית&quot;
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <ArrowUp className="w-3.5 h-3.5" />
                        גלול מטה ברשימה עד שתמצא את האפשרות
                      </p>
                    </div>
                  </li>
                </ol>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
