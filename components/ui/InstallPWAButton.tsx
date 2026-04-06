'use client'

import React, { useState, useEffect } from 'react'
import { Download } from 'lucide-react'
import { iconButton } from '@/lib/design-tokens'

// The browser's BeforeInstallPromptEvent is not in standard TypeScript lib
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface InstallPWAButtonProps {
  variant?: 'full' | 'icon-only'
  className?: string
}

export function InstallPWAButton({ variant = 'full', className = '' }: InstallPWAButtonProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalling, setIsInstalling] = useState(false)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    const handleAppInstalled = () => {
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  if (!deferredPrompt) return null

  const handleInstall = async () => {
    if (isInstalling) return
    setIsInstalling(true)
    try {
      await deferredPrompt.prompt()
      setDeferredPrompt(null)
    } finally {
      setIsInstalling(false)
    }
  }

  if (variant === 'icon-only') {
    return (
      <button
        type="button"
        onClick={handleInstall}
        disabled={isInstalling}
        aria-label="התקן אפליקציה"
        className={`${iconButton.primary} flex-shrink-0 ${className}`}
      >
        <Download className="h-5 w-5" />
        <span className="sr-only">התקן אפליקציה</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleInstall}
      disabled={isInstalling}
      className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-all duration-200 ease-out border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-300 ${className}`}
    >
      <Download className="w-4 h-4" />
      התקן אפליקציה
    </button>
  )
}
