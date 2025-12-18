/**
 * Application status constants
 * Centralized status options and colors for consistent usage across the application
 */

export type StatusValue = 'applied' | 'interview' | 'offer' | 'rejected' | 'withdrawn' | 'accepted'

export interface StatusOption {
  value: StatusValue | ''
  label: string
}

/**
 * Base status options (without "All Statuses" option)
 * Used in forms and status breakdowns
 */
export const STATUS_OPTIONS: StatusOption[] = [
  { value: 'applied', label: 'Applied' },
  { value: 'interview', label: 'Interview' },
  { value: 'offer', label: 'Offer' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
]

/**
 * Status options including "All Statuses" for filter dropdowns
 * Used in ApplicationTable component
 */
export const STATUS_OPTIONS_WITH_ALL: StatusOption[] = [
  { value: '', label: 'All Statuses' },
  ...STATUS_OPTIONS,
  { value: 'accepted', label: 'Accepted' },
]

/**
 * Status color mapping for badge styling
 * Maps status values to Tailwind CSS classes
 */
export const STATUS_COLORS: Record<string, string> = {
  applied: 'bg-blue-100 text-blue-800',
  interview: 'bg-yellow-100 text-yellow-800',
  offer: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  withdrawn: 'bg-gray-100 text-gray-800',
  accepted: 'bg-green-100 text-green-800',
}

/**
 * Get status color class for a given status
 * @param status - The status value
 * @returns Tailwind CSS classes for the status badge
 */
export const getStatusColor = (status: string): string => {
  return STATUS_COLORS[status.toLowerCase()] || 'bg-gray-100 text-gray-800'
}

