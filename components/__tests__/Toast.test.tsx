/**
 * Toast Component Tests
 *
 * Tests for the Toast notification system including ToastContainer and useToast hook.
 * Covers rendering, auto-dismiss, manual dismiss, and multiple toast handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { useToast } from '../Toast'
import { useState } from 'react'

// Test component that uses the useToast hook
function ToastTestComponent() {
  const { addToast, ToastContainer } = useToast()

  return (
    <div>
      <button onClick={() => addToast('Success message', 'success')}>Add Success Toast</button>
      <button onClick={() => addToast('Error message', 'error')}>Add Error Toast</button>
      <button onClick={() => addToast('Info message', 'info')}>Add Info Toast</button>
      <button onClick={() => addToast('No auto-dismiss', 'info', 0)}>Add Persistent Toast</button>
      <ToastContainer />
    </div>
  )
}

// Test component with custom duration
function ToastWithDurationTestComponent() {
  const { addToast, ToastContainer } = useToast()

  return (
    <div>
      <button onClick={() => addToast('Short duration', 'info', 100)}>Add Quick Toast</button>
      <ToastContainer />
    </div>
  )
}

// Test component for manual removal
function ToastManualRemovalTestComponent() {
  const { addToast, removeToast, ToastContainer } = useToast()
  const [toastId, setToastId] = useState<string>('')

  const handleAddToast = () => {
    const id = addToast('Manual removal toast', 'info', 0)
    setToastId(id)
  }

  const handleRemoveToast = () => {
    removeToast(toastId)
  }

  return (
    <div>
      <button onClick={handleAddToast}>Add Toast</button>
      <button onClick={handleRemoveToast}>Remove Toast</button>
      <ToastContainer />
    </div>
  )
}

describe('Toast Component', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('Basic Rendering', () => {
    it('should render success toast', async () => {
      render(<ToastTestComponent />)

      const addButton = screen.getByText('Add Success Toast')
      await userEvent.click(addButton)

      expect(screen.getByText('Success message')).toBeInTheDocument()
    })

    it('should render error toast', async () => {
      render(<ToastTestComponent />)

      const addButton = screen.getByText('Add Error Toast')
      await userEvent.click(addButton)

      expect(screen.getByText('Error message')).toBeInTheDocument()
    })

    it('should render info toast', async () => {
      render(<ToastTestComponent />)

      const addButton = screen.getByText('Add Info Toast')
      await userEvent.click(addButton)

      expect(screen.getByText('Info message')).toBeInTheDocument()
    })

    it('should not render toasts before they are added', () => {
      render(<ToastTestComponent />)

      expect(screen.queryByText('Success message')).not.toBeInTheDocument()
      expect(screen.queryByText('Error message')).not.toBeInTheDocument()
      expect(screen.queryByText('Info message')).not.toBeInTheDocument()
    })
  })

  describe('Toast Icons', () => {
    it('should render success icon for success toast', async () => {
      const { container } = render(<ToastTestComponent />)

      const addButton = screen.getByText('Add Success Toast')
      await userEvent.click(addButton)

      // Check for SVG icon (lucide-react CheckCircle)
      const toastElement = screen.getByText('Success message').parentElement
      const icon = toastElement?.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('should render error icon for error toast', async () => {
      const { container } = render(<ToastTestComponent />)

      const addButton = screen.getByText('Add Error Toast')
      await userEvent.click(addButton)

      const toastElement = screen.getByText('Error message').parentElement
      const icon = toastElement?.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('should render info icon for info toast', async () => {
      const { container } = render(<ToastTestComponent />)

      const addButton = screen.getByText('Add Info Toast')
      await userEvent.click(addButton)

      const toastElement = screen.getByText('Info message').parentElement
      const icon = toastElement?.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })
  })

  describe('Manual Dismiss', () => {
    it('should remove toast when close button is clicked', async () => {
      render(<ToastTestComponent />)

      const addButton = screen.getByText('Add Success Toast')
      await userEvent.click(addButton)

      expect(screen.getByText('Success message')).toBeInTheDocument()

      const closeButton = screen.getByLabelText('סגור הודעה')
      await userEvent.click(closeButton)

      await waitFor(() => {
        expect(screen.queryByText('Success message')).not.toBeInTheDocument()
      })
    })

    it('should only remove the clicked toast when multiple toasts exist', async () => {
      render(<ToastTestComponent />)

      // Add multiple toasts
      const successButton = screen.getByText('Add Success Toast')
      const errorButton = screen.getByText('Add Error Toast')

      await userEvent.click(successButton)
      await userEvent.click(errorButton)

      expect(screen.getByText('Success message')).toBeInTheDocument()
      expect(screen.getByText('Error message')).toBeInTheDocument()

      // Close only the success toast
      const closeButtons = screen.getAllByLabelText('סגור הודעה')
      await userEvent.click(closeButtons[0])

      await waitFor(() => {
        expect(screen.queryByText('Success message')).not.toBeInTheDocument()
      })

      // Error toast should still be visible
      expect(screen.getByText('Error message')).toBeInTheDocument()
    })

    it('should support manual removal via removeToast function', async () => {
      render(<ToastManualRemovalTestComponent />)

      const addButton = screen.getByText('Add Toast')
      await userEvent.click(addButton)

      expect(screen.getByText('Manual removal toast')).toBeInTheDocument()

      const removeButton = screen.getByText('Remove Toast')
      await userEvent.click(removeButton)

      await waitFor(() => {
        expect(screen.queryByText('Manual removal toast')).not.toBeInTheDocument()
      })
    })
  })

  describe('Auto Dismiss', () => {
    it('should auto-dismiss toast after default duration (5000ms)', async () => {
      render(<ToastTestComponent />)

      const addButton = screen.getByText('Add Success Toast')
      await userEvent.click(addButton)

      expect(screen.getByText('Success message')).toBeInTheDocument()

      // Fast-forward time by 5000ms
      act(() => {
        vi.advanceTimersByTime(5000)
      })

      await waitFor(() => {
        expect(screen.queryByText('Success message')).not.toBeInTheDocument()
      })
    })

    it('should auto-dismiss toast after custom duration', async () => {
      render(<ToastWithDurationTestComponent />)

      const addButton = screen.getByText('Add Quick Toast')
      await userEvent.click(addButton)

      expect(screen.getByText('Short duration')).toBeInTheDocument()

      // Fast-forward time by 100ms (custom duration)
      act(() => {
        vi.advanceTimersByTime(100)
      })

      await waitFor(() => {
        expect(screen.queryByText('Short duration')).not.toBeInTheDocument()
      })
    })

    it('should NOT auto-dismiss toast when duration is 0', async () => {
      render(<ToastTestComponent />)

      const addButton = screen.getByText('Add Persistent Toast')
      await userEvent.click(addButton)

      expect(screen.getByText('No auto-dismiss')).toBeInTheDocument()

      // Fast-forward time by 10 seconds
      act(() => {
        vi.advanceTimersByTime(10000)
      })

      // Toast should still be visible
      expect(screen.getByText('No auto-dismiss')).toBeInTheDocument()
    })

    it('should not dismiss toast before duration expires', async () => {
      render(<ToastTestComponent />)

      const addButton = screen.getByText('Add Success Toast')
      await userEvent.click(addButton)

      expect(screen.getByText('Success message')).toBeInTheDocument()

      // Fast-forward time by 4999ms (just before 5000ms)
      act(() => {
        vi.advanceTimersByTime(4999)
      })

      // Toast should still be visible
      expect(screen.getByText('Success message')).toBeInTheDocument()
    })
  })

  describe('Multiple Toasts', () => {
    it('should render multiple toasts simultaneously', async () => {
      render(<ToastTestComponent />)

      const successButton = screen.getByText('Add Success Toast')
      const errorButton = screen.getByText('Add Error Toast')
      const infoButton = screen.getByText('Add Info Toast')

      await userEvent.click(successButton)
      await userEvent.click(errorButton)
      await userEvent.click(infoButton)

      expect(screen.getByText('Success message')).toBeInTheDocument()
      expect(screen.getByText('Error message')).toBeInTheDocument()
      expect(screen.getByText('Info message')).toBeInTheDocument()
    })

    it('should auto-dismiss multiple toasts independently', async () => {
      render(<ToastTestComponent />)

      const successButton = screen.getByText('Add Success Toast')
      const errorButton = screen.getByText('Add Error Toast')

      await userEvent.click(successButton)

      // Wait 2 seconds before adding second toast
      act(() => {
        vi.advanceTimersByTime(2000)
      })

      await userEvent.click(errorButton)

      expect(screen.getByText('Success message')).toBeInTheDocument()
      expect(screen.getByText('Error message')).toBeInTheDocument()

      // Fast-forward 3 more seconds (total 5s for first toast)
      act(() => {
        vi.advanceTimersByTime(3000)
      })

      await waitFor(() => {
        expect(screen.queryByText('Success message')).not.toBeInTheDocument()
      })

      // Error toast should still be visible (only 3s elapsed)
      expect(screen.getByText('Error message')).toBeInTheDocument()

      // Fast-forward 2 more seconds (total 5s for error toast)
      act(() => {
        vi.advanceTimersByTime(2000)
      })

      await waitFor(() => {
        expect(screen.queryByText('Error message')).not.toBeInTheDocument()
      })
    })

    it('should handle adding many toasts at once', async () => {
      render(<ToastTestComponent />)

      const successButton = screen.getByText('Add Success Toast')

      // Add 5 toasts
      for (let i = 0; i < 5; i++) {
        await userEvent.click(successButton)
      }

      // Should render all 5 toasts (same message, but different instances)
      const toasts = screen.getAllByText('Success message')
      expect(toasts).toHaveLength(5)
    })
  })

  describe('Toast Styling', () => {
    it('should apply success styling to success toast', async () => {
      const { container } = render(<ToastTestComponent />)

      const addButton = screen.getByText('Add Success Toast')
      await userEvent.click(addButton)

      const toastElement = screen.getByText('Success message').parentElement
      expect(toastElement).toHaveClass('bg-green-50', 'border-green-200')
    })

    it('should apply error styling to error toast', async () => {
      const { container } = render(<ToastTestComponent />)

      const addButton = screen.getByText('Add Error Toast')
      await userEvent.click(addButton)

      const toastElement = screen.getByText('Error message').parentElement
      expect(toastElement).toHaveClass('bg-red-50', 'border-red-200')
    })

    it('should apply info styling to info toast', async () => {
      const { container } = render(<ToastTestComponent />)

      const addButton = screen.getByText('Add Info Toast')
      await userEvent.click(addButton)

      const toastElement = screen.getByText('Info message').parentElement
      expect(toastElement).toHaveClass('bg-blue-50', 'border-blue-200')
    })
  })

  describe('useToast Hook', () => {
    it('should return addToast function', () => {
      function TestComponent() {
        const { addToast } = useToast()
        expect(typeof addToast).toBe('function')
        return null
      }

      render(<TestComponent />)
    })

    it('should return removeToast function', () => {
      function TestComponent() {
        const { removeToast } = useToast()
        expect(typeof removeToast).toBe('function')
        return null
      }

      render(<TestComponent />)
    })

    it('should return toasts array', () => {
      function TestComponent() {
        const { toasts } = useToast()
        expect(Array.isArray(toasts)).toBe(true)
        return null
      }

      render(<TestComponent />)
    })

    it('should return ToastContainer component', () => {
      function TestComponent() {
        const { ToastContainer } = useToast()
        expect(typeof ToastContainer).toBe('function')
        return null
      }

      render(<TestComponent />)
    })

    it('should return unique toast ID from addToast', async () => {
      function TestComponent() {
        const { addToast } = useToast()
        const [id1, setId1] = useState<string>('')
        const [id2, setId2] = useState<string>('')

        const handleAddToasts = () => {
          const firstId = addToast('First', 'info', 0)
          const secondId = addToast('Second', 'info', 0)
          setId1(firstId)
          setId2(secondId)
        }

        return (
          <div>
            <button onClick={handleAddToasts}>Add Toasts</button>
            <div data-testid="id1">{id1}</div>
            <div data-testid="id2">{id2}</div>
          </div>
        )
      }

      render(<TestComponent />)

      const button = screen.getByText('Add Toasts')
      await userEvent.click(button)

      await waitFor(() => {
        const id1 = screen.getByTestId('id1').textContent
        const id2 = screen.getByTestId('id2').textContent

        expect(id1).toBeTruthy()
        expect(id2).toBeTruthy()
        expect(id1).not.toBe(id2)
      })
    })
  })

  describe('Accessibility', () => {
    it('should have accessible close button label', async () => {
      render(<ToastTestComponent />)

      const addButton = screen.getByText('Add Success Toast')
      await userEvent.click(addButton)

      const closeButton = screen.getByLabelText('סגור הודעה')
      expect(closeButton).toBeInTheDocument()
      expect(closeButton).toHaveAttribute('aria-label', 'סגור הודעה')
    })

    it('should support keyboard navigation for close button', async () => {
      render(<ToastTestComponent />)

      const addButton = screen.getByText('Add Success Toast')
      await userEvent.click(addButton)

      const closeButton = screen.getByLabelText('סגור הודעה')

      // Tab to close button and press Enter
      closeButton.focus()
      fireEvent.keyDown(closeButton, { key: 'Enter' })

      // Note: This tests that the button is focusable, actual Enter key handling
      // is browser default behavior for button elements
      expect(document.activeElement).toBe(closeButton)
    })
  })
})
