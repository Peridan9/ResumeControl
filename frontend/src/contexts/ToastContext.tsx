import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { SUCCESS_MESSAGE_DURATION, ERROR_MESSAGE_DURATION } from '../constants/timing'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  showToast: (message: string, type?: ToastType, duration?: number) => void
  showSuccess: (message: string, duration?: number) => void
  showError: (message: string, duration?: number) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration?: number) => {
      const id = `toast-${Date.now()}-${Math.random()}`
      const defaultDuration = type === 'success' ? SUCCESS_MESSAGE_DURATION : ERROR_MESSAGE_DURATION
      const toastDuration = duration ?? defaultDuration

      const newToast: Toast = {
        id,
        message,
        type,
        duration: toastDuration,
      }

      setToasts((prev) => [...prev, newToast])

      // Auto-remove toast after duration
      if (toastDuration > 0) {
        setTimeout(() => {
          removeToast(id)
        }, toastDuration)
      }
    },
    [removeToast]
  )

  const showSuccess = useCallback(
    (message: string, duration?: number) => {
      showToast(message, 'success', duration)
    },
    [showToast]
  )

  const showError = useCallback(
    (message: string, duration?: number) => {
      showToast(message, 'error', duration)
    },
    [showToast]
  )

  return (
    <ToastContext.Provider value={{ toasts, showToast, showSuccess, showError, removeToast }}>
      {children}
    </ToastContext.Provider>
  )
}

export const useToastContext = () => {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToastContext must be used within a ToastProvider')
  }
  return context
}

