interface LoadingStateProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  fullScreen?: boolean
  className?: string
}

/**
 * Standardized loading spinner component
 * Provides consistent loading states across the application
 */
export default function LoadingState({
  message = 'Loading...',
  size = 'md',
  fullScreen = false,
  className = '',
}: LoadingStateProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-b-2',
    md: 'h-8 w-8 border-b-2',
    lg: 'h-12 w-12 border-b-2',
  }

  const spinnerSize = sizeClasses[size]
  const containerClasses = fullScreen
    ? 'min-h-screen flex items-center justify-center'
    : 'flex items-center justify-center p-12 text-center'

  return (
    <div className={`${containerClasses} ${className}`} role="status" aria-live="polite">
      <div className="text-center">
        <div
          className={`inline-block animate-spin rounded-full border-blue-600 ${spinnerSize}`}
          aria-hidden="true"
        />
        {message && (
          <p className="mt-4 text-gray-600 dark:text-gray-400" aria-label={message}>
            {message}
          </p>
        )}
      </div>
      <span className="sr-only">{message}</span>
    </div>
  )
}






