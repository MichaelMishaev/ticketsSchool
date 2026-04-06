/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import { InstallPWAButton } from '@/components/ui/InstallPWAButton'

// Must be declared locally — BeforeInstallPromptEvent is not in standard TypeScript lib
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// Helper to simulate beforeinstallprompt
function fireInstallPrompt(promptFn = jest.fn().mockResolvedValue({ outcome: 'accepted' })) {
  const event = new Event('beforeinstallprompt') as BeforeInstallPromptEvent
  ;(event as unknown as { prompt: () => Promise<{ outcome: string }> }).prompt = promptFn
  act(() => {
    window.dispatchEvent(event)
  })
  return event
}

describe('InstallPWAButton', () => {
  it('renders nothing before beforeinstallprompt fires', () => {
    render(<InstallPWAButton />)
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('shows full button after beforeinstallprompt fires (default variant)', () => {
    render(<InstallPWAButton />)
    fireInstallPrompt()
    expect(screen.getByRole('button', { name: /התקן אפליקציה/i })).toBeInTheDocument()
  })

  it('shows icon-only button when variant="icon-only"', () => {
    render(<InstallPWAButton variant="icon-only" />)
    fireInstallPrompt()
    const btn = screen.getByRole('button', { name: /התקן אפליקציה/i })
    expect(btn).toBeInTheDocument()
    // Text label should not be visible (sr-only)
    const label = btn.querySelector('span:not(.sr-only)')
    expect(label).toBeNull()
  })

  it('calls prompt() when button is clicked', async () => {
    const promptFn = jest.fn().mockResolvedValue({ outcome: 'accepted' })
    render(<InstallPWAButton />)
    fireInstallPrompt(promptFn)
    await act(async () => {
      fireEvent.click(screen.getByRole('button'))
    })
    expect(promptFn).toHaveBeenCalledTimes(1)
  })

  it('hides button after successful install (appinstalled event)', async () => {
    render(<InstallPWAButton />)
    fireInstallPrompt()
    expect(screen.getByRole('button')).toBeInTheDocument()
    act(() => {
      window.dispatchEvent(new Event('appinstalled'))
    })
    expect(screen.queryByRole('button')).toBeNull()
  })
})
