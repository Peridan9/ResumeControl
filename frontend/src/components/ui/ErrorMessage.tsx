import { ExclamationCircleIcon } from '@heroicons/react/24/outline'

interface ErrorMessageProps {
  message: string
  title?: string
  variant?: 'default' | 'compact'
  className?: string
  onDismiss?: () => void
}

/**
 * Consistent error message display component
 * Provides standardized error styling across the application
 */
export default function ErrorMessage({
  message,
  title,
  variant = 'default',
  className = '',
  onDismiss,
}: ErrorMessageProps) {
  const baseClasses = 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 rounded-lg'
  const paddingClasses = variant === 'compact' ? 'px-3 py-2' : 'px-4 py-3'

  return (
    <div
      className={`${baseClasses} ${paddingClasses} ${className}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start">
        <ExclamationCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5 mr-2" aria-hidden="true" />
        <div className="flex-1">
          {title && (
            <h3 className="text-sm font-semibold mb-1" id="error-title">
              {title}
            </h3>
          )}
          <p className={title ? 'text-sm' : 'text-sm'} id={title ? 'error-message' : undefined}>
            {message}
          </p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-2 flex-shrink-0 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
            aria-label="Dismiss error"
          >
            <span className="sr-only">Dismiss</span>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}



