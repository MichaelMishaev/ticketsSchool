/**
 * GuestCountSelector Component Tests
 *
 * Tests for the guest count selector component.
 * Covers increment/decrement, min/max validation, accessibility, and Hebrew text.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import GuestCountSelector from '../GuestCountSelector'

describe('GuestCountSelector Component', () => {
  describe('Basic Rendering', () => {
    it('should render with default props', () => {
      const onChange = vi.fn()
      render(<GuestCountSelector value={1} onChange={onChange} />)

      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('אורח')).toBeInTheDocument() // Singular
      expect(screen.getByText('כמה אורחים?')).toBeInTheDocument() // Default label
    })

    it('should render with custom value', () => {
      const onChange = vi.fn()
      render(<GuestCountSelector value={5} onChange={onChange} />)

      expect(screen.getByText('5')).toBeInTheDocument()
      expect(screen.getByText('אורחים')).toBeInTheDocument() // Plural
    })

    it('should render with custom label', () => {
      const onChange = vi.fn()
      render(<GuestCountSelector value={1} onChange={onChange} label="בחר מספר אורחים" />)

      expect(screen.getByText('בחר מספר אורחים')).toBeInTheDocument()
    })

    it('should not render label when label is empty string', () => {
      const onChange = vi.fn()
      render(<GuestCountSelector value={1} onChange={onChange} label="" />)

      expect(screen.queryByText('כמה אורחים?')).not.toBeInTheDocument()
    })

    it('should render min-max range info', () => {
      const onChange = vi.fn()
      render(<GuestCountSelector value={1} onChange={onChange} min={1} max={12} />)

      expect(screen.getByText('1 - 12 אורחים')).toBeInTheDocument()
    })

    it('should render custom min-max range info', () => {
      const onChange = vi.fn()
      render(<GuestCountSelector value={2} onChange={onChange} min={2} max={20} />)

      expect(screen.getByText('2 - 20 אורחים')).toBeInTheDocument()
    })
  })

  describe('Increment Functionality', () => {
    it('should increment value when plus button is clicked', async () => {
      const onChange = vi.fn()
      render(<GuestCountSelector value={3} onChange={onChange} />)

      const incrementButton = screen.getByLabelText('הוסף אורח')
      await userEvent.click(incrementButton)

      expect(onChange).toHaveBeenCalledWith(4)
    })

    it('should increment from 1 to 2', async () => {
      const onChange = vi.fn()
      render(<GuestCountSelector value={1} onChange={onChange} />)

      const incrementButton = screen.getByLabelText('הוסף אורח')
      await userEvent.click(incrementButton)

      expect(onChange).toHaveBeenCalledWith(2)
    })

    it('should not increment beyond max value', async () => {
      const onChange = vi.fn()
      render(<GuestCountSelector value={12} onChange={onChange} max={12} />)

      const incrementButton = screen.getByLabelText('הוסף אורח')
      await userEvent.click(incrementButton)

      expect(onChange).not.toHaveBeenCalled()
    })

    it('should disable increment button when at max value', () => {
      const onChange = vi.fn()
      render(<GuestCountSelector value={12} onChange={onChange} max={12} />)

      const incrementButton = screen.getByLabelText('הוסף אורח')
      expect(incrementButton).toBeDisabled()
    })

    it('should not increment beyond custom max value', async () => {
      const onChange = vi.fn()
      render(<GuestCountSelector value={20} onChange={onChange} max={20} />)

      const incrementButton = screen.getByLabelText('הוסף אורח')
      await userEvent.click(incrementButton)

      expect(onChange).not.toHaveBeenCalled()
    })

    it('should enable increment button when below max value', () => {
      const onChange = vi.fn()
      render(<GuestCountSelector value={11} onChange={onChange} max={12} />)

      const incrementButton = screen.getByLabelText('הוסף אורח')
      expect(incrementButton).not.toBeDisabled()
    })
  })

  describe('Decrement Functionality', () => {
    it('should decrement value when minus button is clicked', async () => {
      const onChange = vi.fn()
      render(<GuestCountSelector value={5} onChange={onChange} />)

      const decrementButton = screen.getByLabelText('הפחת מספר אורחים')
      await userEvent.click(decrementButton)

      expect(onChange).toHaveBeenCalledWith(4)
    })

    it('should decrement from 2 to 1', async () => {
      const onChange = vi.fn()
      render(<GuestCountSelector value={2} onChange={onChange} />)

      const decrementButton = screen.getByLabelText('הפחת מספר אורחים')
      await userEvent.click(decrementButton)

      expect(onChange).toHaveBeenCalledWith(1)
    })

    it('should not decrement below min value', async () => {
      const onChange = vi.fn()
      render(<GuestCountSelector value={1} onChange={onChange} min={1} />)

      const decrementButton = screen.getByLabelText('הפחת מספר אורחים')
      await userEvent.click(decrementButton)

      expect(onChange).not.toHaveBeenCalled()
    })

    it('should disable decrement button when at min value', () => {
      const onChange = vi.fn()
      render(<GuestCountSelector value={1} onChange={onChange} min={1} />)

      const decrementButton = screen.getByLabelText('הפחת מספר אורחים')
      expect(decrementButton).toBeDisabled()
    })

    it('should not decrement below custom min value', async () => {
      const onChange = vi.fn()
      render(<GuestCountSelector value={5} onChange={onChange} min={5} />)

      const decrementButton = screen.getByLabelText('הפחת מספר אורחים')
      await userEvent.click(decrementButton)

      expect(onChange).not.toHaveBeenCalled()
    })

    it('should enable decrement button when above min value', () => {
      const onChange = vi.fn()
      render(<GuestCountSelector value={2} onChange={onChange} min={1} />)

      const decrementButton = screen.getByLabelText('הפחת מספר אורחים')
      expect(decrementButton).not.toBeDisabled()
    })
  })

  describe('Min/Max Validation', () => {
    it('should respect custom min value', () => {
      const onChange = vi.fn()
      render(<GuestCountSelector value={5} onChange={onChange} min={5} max={10} />)

      const decrementButton = screen.getByLabelText('הפחת מספר אורחים')
      expect(decrementButton).toBeDisabled()
    })

    it('should respect custom max value', () => {
      const onChange = vi.fn()
      render(<GuestCountSelector value={10} onChange={onChange} min={5} max={10} />)

      const incrementButton = screen.getByLabelText('הוסף אורח')
      expect(incrementButton).toBeDisabled()
    })

    it('should allow values within min-max range', () => {
      const onChange = vi.fn()
      render(<GuestCountSelector value={7} onChange={onChange} min={5} max={10} />)

      const incrementButton = screen.getByLabelText('הוסף אורח')
      const decrementButton = screen.getByLabelText('הפחת מספר אורחים')

      expect(incrementButton).not.toBeDisabled()
      expect(decrementButton).not.toBeDisabled()
    })

    it('should handle min=max edge case', () => {
      const onChange = vi.fn()
      render(<GuestCountSelector value={5} onChange={onChange} min={5} max={5} />)

      const incrementButton = screen.getByLabelText('הוסף אורח')
      const decrementButton = screen.getByLabelText('הפחת מספר אורחים')

      expect(incrementButton).toBeDisabled()
      expect(decrementButton).toBeDisabled()
    })
  })

  describe('Hebrew Text (Singular/Plural)', () => {
    it('should display singular "אורח" when value is 1', () => {
      const onChange = vi.fn()
      render(<GuestCountSelector value={1} onChange={onChange} />)

      expect(screen.getByText('אורח')).toBeInTheDocument()
      expect(screen.queryByText('אורחים')).not.toBeInTheDocument()
    })

    it('should display plural "אורחים" when value is 2', () => {
      const onChange = vi.fn()
      render(<GuestCountSelector value={2} onChange={onChange} />)

      expect(screen.getByText('אורחים')).toBeInTheDocument()
      expect(screen.queryByText('אורח')).not.toBeInTheDocument()
    })

    it('should display plural "אורחים" when value is greater than 2', () => {
      const onChange = vi.fn()
      render(<GuestCountSelector value={10} onChange={onChange} />)

      expect(screen.getByText('אורחים')).toBeInTheDocument()
    })

    it('should update text when transitioning from 1 to 2', async () => {
      const onChange = vi.fn()
      const { rerender } = render(<GuestCountSelector value={1} onChange={onChange} />)

      expect(screen.getByText('אורח')).toBeInTheDocument()

      rerender(<GuestCountSelector value={2} onChange={onChange} />)

      expect(screen.getByText('אורחים')).toBeInTheDocument()
    })

    it('should update text when transitioning from 2 to 1', async () => {
      const onChange = vi.fn()
      const { rerender } = render(<GuestCountSelector value={2} onChange={onChange} />)

      expect(screen.getByText('אורחים')).toBeInTheDocument()

      rerender(<GuestCountSelector value={1} onChange={onChange} />)

      expect(screen.getByText('אורח')).toBeInTheDocument()
    })
  })

  describe('Button Styling', () => {
    it('should apply disabled styling when increment button is disabled', () => {
      const onChange = vi.fn()
      render(<GuestCountSelector value={12} onChange={onChange} max={12} />)

      const incrementButton = screen.getByLabelText('הוסף אורח')
      expect(incrementButton).toHaveClass(
        'bg-gray-100',
        'border-gray-300',
        'text-gray-400',
        'cursor-not-allowed'
      )
    })

    it('should apply disabled styling when decrement button is disabled', () => {
      const onChange = vi.fn()
      render(<GuestCountSelector value={1} onChange={onChange} min={1} />)

      const decrementButton = screen.getByLabelText('הפחת מספר אורחים')
      expect(decrementButton).toHaveClass(
        'bg-gray-100',
        'border-gray-300',
        'text-gray-400',
        'cursor-not-allowed'
      )
    })

    it('should apply active styling when increment button is enabled', () => {
      const onChange = vi.fn()
      render(<GuestCountSelector value={5} onChange={onChange} max={12} />)

      const incrementButton = screen.getByLabelText('הוסף אורח')
      expect(incrementButton).toHaveClass('bg-white', 'border-blue-500', 'text-blue-600')
    })

    it('should apply active styling when decrement button is enabled', () => {
      const onChange = vi.fn()
      render(<GuestCountSelector value={5} onChange={onChange} min={1} />)

      const decrementButton = screen.getByLabelText('הפחת מספר אורחים')
      expect(decrementButton).toHaveClass('bg-white', 'border-blue-500', 'text-blue-600')
    })
  })

  describe('Accessibility', () => {
    it('should have accessible label for increment button', () => {
      const onChange = vi.fn()
      render(<GuestCountSelector value={1} onChange={onChange} />)

      const incrementButton = screen.getByLabelText('הוסף אורח')
      expect(incrementButton).toHaveAttribute('aria-label', 'הוסף אורח')
    })

    it('should have accessible label for decrement button', () => {
      const onChange = vi.fn()
      render(<GuestCountSelector value={1} onChange={onChange} />)

      const decrementButton = screen.getByLabelText('הפחת מספר אורחים')
      expect(decrementButton).toHaveAttribute('aria-label', 'הפחת מספר אורחים')
    })

    it('should have type="button" to prevent form submission', () => {
      const onChange = vi.fn()
      render(<GuestCountSelector value={1} onChange={onChange} />)

      const incrementButton = screen.getByLabelText('הוסף אורח')
      const decrementButton = screen.getByLabelText('הפחת מספר אורחים')

      expect(incrementButton).toHaveAttribute('type', 'button')
      expect(decrementButton).toHaveAttribute('type', 'button')
    })

    it('should have RTL direction on container', () => {
      const onChange = vi.fn()
      const { container } = render(<GuestCountSelector value={1} onChange={onChange} />)

      const rtlContainer = container.querySelector('[dir="rtl"]')
      expect(rtlContainer).toBeInTheDocument()
    })
  })

  describe('Multiple Clicks', () => {
    it('should handle multiple increment clicks', async () => {
      const onChange = vi.fn()
      render(<GuestCountSelector value={1} onChange={onChange} max={12} />)

      const incrementButton = screen.getByLabelText('הוסף אורח')

      await userEvent.click(incrementButton)
      await userEvent.click(incrementButton)
      await userEvent.click(incrementButton)

      expect(onChange).toHaveBeenCalledTimes(3)
      expect(onChange).toHaveBeenNthCalledWith(1, 2)
      expect(onChange).toHaveBeenNthCalledWith(2, 2) // Still 2 because value doesn't update
      expect(onChange).toHaveBeenNthCalledWith(3, 2) // Still 2 because value doesn't update
    })

    it('should handle multiple decrement clicks', async () => {
      const onChange = vi.fn()
      render(<GuestCountSelector value={5} onChange={onChange} min={1} />)

      const decrementButton = screen.getByLabelText('הפחת מספר אורחים')

      await userEvent.click(decrementButton)
      await userEvent.click(decrementButton)

      expect(onChange).toHaveBeenCalledTimes(2)
      expect(onChange).toHaveBeenNthCalledWith(1, 4)
      expect(onChange).toHaveBeenNthCalledWith(2, 4) // Still 4 because value doesn't update
    })

    it('should properly handle sequential increment/decrement', async () => {
      const onChange = vi.fn()
      const { rerender } = render(<GuestCountSelector value={5} onChange={onChange} />)

      const incrementButton = screen.getByLabelText('הוסף אורח')
      await userEvent.click(incrementButton)
      expect(onChange).toHaveBeenLastCalledWith(6)

      // Simulate parent updating value
      rerender(<GuestCountSelector value={6} onChange={onChange} />)

      const decrementButton = screen.getByLabelText('הפחת מספר אורחים')
      await userEvent.click(decrementButton)
      expect(onChange).toHaveBeenLastCalledWith(5)
    })
  })

  describe('Edge Cases', () => {
    it('should handle value of 0 with min=0', () => {
      const onChange = vi.fn()
      render(<GuestCountSelector value={0} onChange={onChange} min={0} max={10} />)

      expect(screen.getByText('0')).toBeInTheDocument()
      expect(screen.getByText('אורחים')).toBeInTheDocument() // Plural for 0
    })

    it('should handle large values', () => {
      const onChange = vi.fn()
      render(<GuestCountSelector value={100} onChange={onChange} min={1} max={100} />)

      expect(screen.getByText('100')).toBeInTheDocument()
      expect(screen.getByText('אורחים')).toBeInTheDocument()
    })

    it('should handle value equal to min', () => {
      const onChange = vi.fn()
      render(<GuestCountSelector value={5} onChange={onChange} min={5} max={10} />)

      const decrementButton = screen.getByLabelText('הפחת מספר אורחים')
      expect(decrementButton).toBeDisabled()
    })

    it('should handle value equal to max', () => {
      const onChange = vi.fn()
      render(<GuestCountSelector value={10} onChange={onChange} min={5} max={10} />)

      const incrementButton = screen.getByLabelText('הוסף אורח')
      expect(incrementButton).toBeDisabled()
    })
  })
})
