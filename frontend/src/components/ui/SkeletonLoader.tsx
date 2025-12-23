interface SkeletonLoaderProps {
  lines?: number
  className?: string
  showAvatar?: boolean
  showTitle?: boolean
}

/**
 * Skeleton loading states component
 * Provides placeholder content while data is loading
 */
export default function SkeletonLoader({
  lines = 3,
  className = '',
  showAvatar = false,
  showTitle = true,
}: SkeletonLoaderProps) {
  return (
    <div className={`animate-pulse space-y-4 ${className}`} aria-label="Loading content">
      {showAvatar && (
        <div className="flex items-center space-x-4">
          <div className="rounded-full bg-gray-300 dark:bg-gray-600 h-12 w-12"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
          </div>
        </div>
      )}
      {showTitle && (
        <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
      )}
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`h-4 bg-gray-300 dark:bg-gray-600 rounded ${
              index === lines - 1 ? 'w-5/6' : 'w-full'
            }`}
          />
        ))}
      </div>
    </div>
  )
}



