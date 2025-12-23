
import { ErrorInfo } from 'react'
import Button from './ui/Button'

interface ErrorFallbackProps {
  error: Error | null
  errorInfo: ErrorInfo | null
  onReset?: () => void
}

/**
 * User-friendly error fallback UI component
 * 
 * Displays a friendly error message with options to:
 * - Reload the page
 * - Go back to home
 * - Retry (if onReset is provided)
 */
export default function ErrorFallback({
  error,
  errorInfo,
  onReset,
}: ErrorFallbackProps) {
  const handleReload = () => {
    window.location.reload()
  }

  const handleGoHome = () => {
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 border border-gray-200 dark:border-gray-700">
        <div className="text-center mb-6">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
            <svg
              className="h-8 w-8 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Something went wrong
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            We're sorry, but something unexpected happened. Please try again.
          </p>
        </div>

        {import.meta.env.DEV && error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-md">
            <h2 className="text-sm font-semibold text-red-800 dark:text-red-400 mb-2">
              Error Details (Development Only)
            </h2>
            <p className="text-sm text-red-700 dark:text-red-300 font-mono mb-2">
              {error.toString()}
            </p>
            {errorInfo && errorInfo.componentStack && (
              <details className="mt-2">
                <summary className="text-sm text-red-700 dark:text-red-300 cursor-pointer hover:text-red-800 dark:hover:text-red-200">
                  Component Stack
                </summary>
                <pre className="mt-2 text-xs text-red-600 dark:text-red-400 overflow-auto max-h-40 p-2 bg-red-100 dark:bg-red-900/20 rounded">
                  {errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {onReset && (
            <Button variant="primary" onClick={onReset}>
              Try Again
            </Button>
          )}
          <Button variant="secondary" onClick={handleReload}>
            Reload Page
          </Button>
          <Button variant="secondary" onClick={handleGoHome}>
            Go Home
          </Button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            If this problem persists, please contact support.
          </p>
        </div>
      </div>
    </div>
  )
}



