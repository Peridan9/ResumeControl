import { getStatusColor } from '../../constants/status'

interface StatusBadgeProps {
  status: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Reusable status badge component
 * Displays application status with consistent styling
 */
export default function StatusBadge({ status, size = 'md', className = '' }: StatusBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  }

  const statusColor = getStatusColor(status)
  const sizeClass = sizeClasses[size]

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium whitespace-nowrap ${sizeClass} ${statusColor} ${className}`}
      aria-label={`Status: ${status}`}
    >
      {status}
    </span>
  )
}

