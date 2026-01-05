import { useToastContext } from '../contexts/ToastContext'
import type { ToastType } from '../contexts/ToastContext'

/**
 * Hook to display toast notifications
 * 
 * @example
 * const toast = useToast()
 * toast.showSuccess('Application created successfully!')
 * toast.showError('Failed to create application')
 * toast.showToast('Info message', 'info')
 */
export function useToast() {
  const { showToast, showSuccess, showError } = useToastContext()

  return {
    showToast: (message: string, type?: ToastType, duration?: number) => {
      showToast(message, type, duration)
    },
    showSuccess: (message: string, duration?: number) => {
      showSuccess(message, duration)
    },
    showError: (message: string, duration?: number) => {
      showError(message, duration)
    },
  }
}






