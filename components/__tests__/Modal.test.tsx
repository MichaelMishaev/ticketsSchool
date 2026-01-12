/**
 * Modal Component Tests
 *
 * Tests for the Modal, ConfirmModal, and AlertModal components.
 * Covers rendering, interactions, keyboard navigation, and accessibility.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import Modal, { ConfirmModal, AlertModal } from '../Modal'

describe('Modal Component', () => {
  beforeEach(() => {
    // Reset body overflow style before each test
    document.body.style.overflow = 'unset'
  })

  afterEach(() => {
    // Clean up body overflow style after each test
    document.body.style.overflow = 'unset'
  })

  describe('Basic Rendering', () => {
    it('should render modal when isOpen is true', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      )

      expect(screen.getByText('Test Modal')).toBeInTheDocument()
      expect(screen.getByText('Modal content')).toBeInTheDocument()
    })

    it('should not render modal when isOpen is false', () => {
      render(
        <Modal isOpen={false} onClose={vi.fn()} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      )

      expect(screen.queryByText('Test Modal')).not.toBeInTheDocument()
    })

    it('should render description when provided', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()} title="Test Modal" description="Test description">
          <p>Content</p>
        </Modal>
      )

      expect(screen.getByText('Test description')).toBeInTheDocument()
    })

    it('should render custom children', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
          <div data-testid="custom-child">Custom content here</div>
        </Modal>
      )

      expect(screen.getByTestId('custom-child')).toBeInTheDocument()
    })
  })

  describe('Close Functionality', () => {
    it('should call onClose when close button is clicked', async () => {
      const onClose = vi.fn()
      render(
        <Modal isOpen={true} onClose={onClose} title="Test Modal">
          <p>Content</p>
        </Modal>
      )

      const closeButton = screen.getByLabelText('סגור')
      await userEvent.click(closeButton)

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('should call onClose when Escape key is pressed', async () => {
      const onClose = vi.fn()
      render(
        <Modal isOpen={true} onClose={onClose} title="Test Modal" closeOnEsc={true}>
          <p>Content</p>
        </Modal>
      )

      fireEvent.keyDown(window, { key: 'Escape' })

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('should NOT call onClose when Escape key is pressed if closeOnEsc is false', () => {
      const onClose = vi.fn()
      render(
        <Modal isOpen={true} onClose={onClose} title="Test Modal" closeOnEsc={false}>
          <p>Content</p>
        </Modal>
      )

      fireEvent.keyDown(window, { key: 'Escape' })

      expect(onClose).not.toHaveBeenCalled()
    })

    it('should call onClose when backdrop is clicked', async () => {
      const onClose = vi.fn()
      render(
        <Modal isOpen={true} onClose={onClose} title="Test Modal" closeOnBackdropClick={true}>
          <p>Content</p>
        </Modal>
      )

      // Click the backdrop (the parent div with backdrop-blur)
      const backdrop = screen.getByText('Test Modal').closest('.fixed')
      if (backdrop) {
        fireEvent.click(backdrop)
      }

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('should NOT call onClose when backdrop is clicked if closeOnBackdropClick is false', () => {
      const onClose = vi.fn()
      render(
        <Modal isOpen={true} onClose={onClose} title="Test Modal" closeOnBackdropClick={false}>
          <p>Content</p>
        </Modal>
      )

      const backdrop = screen.getByText('Test Modal').closest('.fixed')
      if (backdrop) {
        fireEvent.click(backdrop)
      }

      expect(onClose).not.toHaveBeenCalled()
    })

    it('should NOT call onClose when clicking modal content', () => {
      const onClose = vi.fn()
      render(
        <Modal isOpen={true} onClose={onClose} title="Test Modal">
          <p>Content</p>
        </Modal>
      )

      const content = screen.getByText('Content')
      fireEvent.click(content)

      expect(onClose).not.toHaveBeenCalled()
    })

    it('should hide close button when showCloseButton is false', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()} title="Test Modal" showCloseButton={false}>
          <p>Content</p>
        </Modal>
      )

      expect(screen.queryByLabelText('סגור')).not.toBeInTheDocument()
    })
  })

  describe('Modal Types', () => {
    it('should render info modal with info icon', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={vi.fn()} title="Info Modal" type="info">
          <p>Info content</p>
        </Modal>
      )

      // Check for icon presence (lucide-react icons)
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should render success modal with success icon', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={vi.fn()} title="Success Modal" type="success">
          <p>Success content</p>
        </Modal>
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should render warning modal with warning icon', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={vi.fn()} title="Warning Modal" type="warning">
          <p>Warning content</p>
        </Modal>
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should render error modal with error icon', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={vi.fn()} title="Error Modal" type="error">
          <p>Error content</p>
        </Modal>
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should render custom modal without default icon', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={vi.fn()} title="Custom Modal" type="custom">
          <p>Custom content</p>
        </Modal>
      )

      // Custom type should not have an icon unless explicitly provided
      const header = screen.getByText('Custom Modal').parentElement
      const svg = header?.querySelector('svg')
      expect(svg).not.toBeInTheDocument()
    })

    it('should render custom icon when provided', () => {
      const CustomIcon = () => <div data-testid="custom-icon">Icon</div>
      render(
        <Modal isOpen={true} onClose={vi.fn()} title="Modal" icon={<CustomIcon />}>
          <p>Content</p>
        </Modal>
      )

      expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
    })
  })

  describe('Modal Buttons', () => {
    it('should render buttons when provided', () => {
      const buttons = [
        { label: 'Cancel', onClick: vi.fn(), variant: 'secondary' as const },
        { label: 'Confirm', onClick: vi.fn(), variant: 'primary' as const },
      ]

      render(
        <Modal isOpen={true} onClose={vi.fn()} title="Test Modal" buttons={buttons}>
          <p>Content</p>
        </Modal>
      )

      expect(screen.getByText('Cancel')).toBeInTheDocument()
      expect(screen.getByText('Confirm')).toBeInTheDocument()
    })

    it('should call button onClick when clicked', async () => {
      const onClick = vi.fn()
      const buttons = [{ label: 'Click Me', onClick, variant: 'primary' as const }]

      render(
        <Modal isOpen={true} onClose={vi.fn()} title="Test Modal" buttons={buttons}>
          <p>Content</p>
        </Modal>
      )

      const button = screen.getByText('Click Me')
      await userEvent.click(button)

      expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('should disable button when disabled prop is true', () => {
      const buttons = [{ label: 'Disabled', onClick: vi.fn(), disabled: true }]

      render(
        <Modal isOpen={true} onClose={vi.fn()} title="Test Modal" buttons={buttons}>
          <p>Content</p>
        </Modal>
      )

      const button = screen.getByText('Disabled')
      expect(button).toBeDisabled()
    })

    it('should render button with icon when provided', () => {
      const ButtonIcon = () => <span data-testid="button-icon">⭐</span>
      const buttons = [{ label: 'With Icon', onClick: vi.fn(), icon: <ButtonIcon /> }]

      render(
        <Modal isOpen={true} onClose={vi.fn()} title="Test Modal" buttons={buttons}>
          <p>Content</p>
        </Modal>
      )

      expect(screen.getByTestId('button-icon')).toBeInTheDocument()
    })

    it('should render buttons with different variants', () => {
      const buttons = [
        { label: 'Primary', onClick: vi.fn(), variant: 'primary' as const },
        { label: 'Secondary', onClick: vi.fn(), variant: 'secondary' as const },
        { label: 'Danger', onClick: vi.fn(), variant: 'danger' as const },
        { label: 'Success', onClick: vi.fn(), variant: 'success' as const },
      ]

      render(
        <Modal isOpen={true} onClose={vi.fn()} title="Test Modal" buttons={buttons}>
          <p>Content</p>
        </Modal>
      )

      expect(screen.getByText('Primary')).toBeInTheDocument()
      expect(screen.getByText('Secondary')).toBeInTheDocument()
      expect(screen.getByText('Danger')).toBeInTheDocument()
      expect(screen.getByText('Success')).toBeInTheDocument()
    })
  })

  describe('Modal Sizes', () => {
    it('should render small modal', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={vi.fn()} title="Small Modal" size="sm">
          <p>Content</p>
        </Modal>
      )

      const modal = container.querySelector('.max-w-sm')
      expect(modal).toBeInTheDocument()
    })

    it('should render medium modal (default)', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={vi.fn()} title="Medium Modal">
          <p>Content</p>
        </Modal>
      )

      const modal = container.querySelector('.max-w-lg')
      expect(modal).toBeInTheDocument()
    })

    it('should render large modal', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={vi.fn()} title="Large Modal" size="lg">
          <p>Content</p>
        </Modal>
      )

      const modal = container.querySelector('.max-w-2xl')
      expect(modal).toBeInTheDocument()
    })

    it('should render extra large modal', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={vi.fn()} title="XL Modal" size="xl">
          <p>Content</p>
        </Modal>
      )

      const modal = container.querySelector('.max-w-4xl')
      expect(modal).toBeInTheDocument()
    })
  })

  describe('Body Scroll Prevention', () => {
    it('should set body overflow to hidden when modal opens', async () => {
      const { rerender } = render(
        <Modal isOpen={false} onClose={vi.fn()} title="Test Modal">
          <p>Content</p>
        </Modal>
      )

      expect(document.body.style.overflow).toBe('unset')

      rerender(
        <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
          <p>Content</p>
        </Modal>
      )

      await waitFor(() => {
        expect(document.body.style.overflow).toBe('hidden')
      })
    })

    it('should restore body overflow when modal closes', async () => {
      const { rerender } = render(
        <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
          <p>Content</p>
        </Modal>
      )

      await waitFor(() => {
        expect(document.body.style.overflow).toBe('hidden')
      })

      rerender(
        <Modal isOpen={false} onClose={vi.fn()} title="Test Modal">
          <p>Content</p>
        </Modal>
      )

      await waitFor(() => {
        expect(document.body.style.overflow).toBe('unset')
      })
    })

    it('should restore body overflow on unmount', async () => {
      const { unmount } = render(
        <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
          <p>Content</p>
        </Modal>
      )

      await waitFor(() => {
        expect(document.body.style.overflow).toBe('hidden')
      })

      unmount()

      expect(document.body.style.overflow).toBe('unset')
    })
  })
})

describe('ConfirmModal Component', () => {
  it('should render with default button text', () => {
    render(
      <ConfirmModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Confirm Action"
        description="Are you sure?"
      />
    )

    expect(screen.getByText('ביטול')).toBeInTheDocument()
    expect(screen.getByText('אישור')).toBeInTheDocument()
  })

  it('should render with custom button text', () => {
    render(
      <ConfirmModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Delete Item"
        confirmText="מחק"
        cancelText="בטל"
      />
    )

    expect(screen.getByText('בטל')).toBeInTheDocument()
    expect(screen.getByText('מחק')).toBeInTheDocument()
  })

  it('should call onConfirm and onClose when confirm button is clicked', async () => {
    const onConfirm = vi.fn()
    const onClose = vi.fn()

    render(
      <ConfirmModal isOpen={true} onClose={onClose} onConfirm={onConfirm} title="Confirm Action" />
    )

    const confirmButton = screen.getByText('אישור')
    await userEvent.click(confirmButton)

    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should call only onClose when cancel button is clicked', async () => {
    const onConfirm = vi.fn()
    const onClose = vi.fn()

    render(
      <ConfirmModal isOpen={true} onClose={onClose} onConfirm={onConfirm} title="Confirm Action" />
    )

    const cancelButton = screen.getByText('ביטול')
    await userEvent.click(cancelButton)

    expect(onConfirm).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should render with warning type by default', () => {
    render(<ConfirmModal isOpen={true} onClose={vi.fn()} onConfirm={vi.fn()} title="Warning" />)

    expect(screen.getByText('Warning')).toBeInTheDocument()
  })

  it('should render with error type', () => {
    render(
      <ConfirmModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Error"
        type="error"
      />
    )

    expect(screen.getByText('Error')).toBeInTheDocument()
  })
})

describe('AlertModal Component', () => {
  it('should render with default button text', () => {
    render(
      <AlertModal isOpen={true} onClose={vi.fn()} title="Alert Title" message="Alert message" />
    )

    expect(screen.getByText('הבנתי')).toBeInTheDocument()
  })

  it('should render with custom button text', () => {
    render(
      <AlertModal
        isOpen={true}
        onClose={vi.fn()}
        title="Alert"
        message="Message"
        buttonText="סגור"
      />
    )

    expect(screen.getByText('סגור')).toBeInTheDocument()
  })

  it('should call onClose when button is clicked', async () => {
    const onClose = vi.fn()

    render(<AlertModal isOpen={true} onClose={onClose} title="Alert" message="Message" />)

    const button = screen.getByText('הבנתי')
    await userEvent.click(button)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should render message content', () => {
    render(
      <AlertModal
        isOpen={true}
        onClose={vi.fn()}
        title="Alert"
        message="This is the alert message"
      />
    )

    expect(screen.getByText('This is the alert message')).toBeInTheDocument()
  })

  it('should render with info type by default', () => {
    render(<AlertModal isOpen={true} onClose={vi.fn()} title="Info" message="Info message" />)

    expect(screen.getByText('Info')).toBeInTheDocument()
  })

  it('should render with custom type', () => {
    render(
      <AlertModal
        isOpen={true}
        onClose={vi.fn()}
        title="Success"
        message="Success message"
        type="success"
      />
    )

    expect(screen.getByText('Success')).toBeInTheDocument()
  })
})
