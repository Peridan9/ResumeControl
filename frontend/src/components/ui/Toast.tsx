import { useEffect, useState, useCallback } from 'react'
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import type { Toast as ToastType } from '../../contexts/ToastContext'

interface ToastProps {
  toast: ToastType
  onDismiss: (id: string) => void
}

/**
 * Individual toast notification component
 * Displays a dismissible toast with appropriate styling based on type
 */
export default function Toast({ toast, onDismiss }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false)

  const handleDismiss = useCallback(() => {
    setIsExiting(true)
    // Wait for exit animation before removing
    setTimeout(() => {
      onDismiss(toast.id)
    }, 300)
  }, [toast.id, onDismiss])

  // Auto-dismiss if duration is set
  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        handleDismiss()
      }, toast.duration)

      return () => clearTimeout(timer)
    }
  }, [toast.duration, handleDismiss])

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" aria-hidden="true" />
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400" aria-hidden="true" />
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" aria-hidden="true" />
      case 'info':
      default:
        return <InformationCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
    }
  }

  const getStyles = () => {
    const baseStyles = 'flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg border transition-all duration-300'
    const exitStyles = isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'

    switch (toast.type) {
      case 'success':
        return `${baseStyles} ${exitStyles} bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-200`
      case 'error':
        return `${baseStyles} ${exitStyles} bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-200`
      case 'warning':
        return `${baseStyles} ${exitStyles} bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-200`
      case 'info':
      default:
        return `${baseStyles} ${exitStyles} bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-200`
    }
  }

  return (
    <div
      className={getStyles()}
      role="alert"
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{toast.message}</p>
      </div>
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        aria-label="Dismiss notification"
      >
        <span className="sr-only">Dismiss</span>
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

