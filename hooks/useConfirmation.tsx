'use client'

import { useState, useCallback } from 'react'
import ConfirmationModal, { ConfirmationVariant } from '@/components/ui/ConfirmationModal'

interface ConfirmationOptions {
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: ConfirmationVariant
}

interface ConfirmationState extends ConfirmationOptions {
  isOpen: boolean
  loading: boolean
  onConfirm: () => void | Promise<void>
}

export function useConfirmation() {
  const [state, setState] = useState<ConfirmationState>({
    isOpen: false,
    loading: false,
    title: '',
    onConfirm: () => {},
  })

  const confirm = useCallback((options: ConfirmationOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        isOpen: true,
        loading: false,
        ...options,
        onConfirm: async () => {
          setState((prev) => ({ ...prev, loading: true }))
          // Small delay to show loading state
          await new Promise((r) => setTimeout(r, 100))
          setState((prev) => ({ ...prev, isOpen: false, loading: false }))
          resolve(true)
        },
      })
    })
  }, [])

  const handleClose = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }))
  }, [])

  const ConfirmationDialog = useCallback(
    () => (
      <ConfirmationModal
        isOpen={state.isOpen}
        onClose={handleClose}
        onConfirm={state.onConfirm}
        title={state.title}
        description={state.description}
        confirmText={state.confirmText}
        cancelText={state.cancelText}
        variant={state.variant}
        loading={state.loading}
      />
    ),
    [state, handleClose]
  )

  return { confirm, ConfirmationDialog }
}
