/**
 * Date formatting utilities
 * Centralized date formatting functions for consistent date display across the application
 */

/**
 * Format options for date formatting
 */
export type DateFormatOptions = {
  year?: 'numeric' | '2-digit'
  month?: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow'
  day?: 'numeric' | '2-digit'
  hour?: 'numeric' | '2-digit'
  minute?: 'numeric' | '2-digit'
  hour12?: boolean
}

/**
 * Formats a date string to a short readable format (e.g., "Jan 15, 2024")
 * Commonly used in tables and lists
 * @param dateString - ISO date string or null
 * @returns Formatted date string or 'N/A' if dateString is null/invalid
 */
export const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'N/A'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Invalid date'
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return 'Invalid date'
  }
}

/**
 * Formats a date string to a long readable format (e.g., "January 15, 2024")
 * Commonly used in detail pages
 * @param dateString - ISO date string or null
 * @returns Formatted date string or 'N/A' if dateString is null/invalid
 */
export const formatDateLong = (dateString: string | null): string => {
  if (!dateString) return 'N/A'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Invalid date'
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return 'Invalid date'
  }
}

/**
 * Formats a date-time string to a readable format (e.g., "January 15, 2024, 2:30 PM")
 * Commonly used for timestamps (created_at, updated_at)
 * @param dateString - ISO date string or null
 * @returns Formatted date-time string or 'N/A' if dateString is null/invalid
 */
export const formatDateTime = (dateString: string | null): string => {
  if (!dateString) return 'N/A'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Invalid date'
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return 'Invalid date'
  }
}

/**
 * Formats a date string using the default locale format
 * Simple format for cards and minimal displays
 * @param dateString - ISO date string or null
 * @returns Formatted date string or 'N/A' if dateString is null/invalid
 */
export const formatDateDefault = (dateString: string | null): string => {
  if (!dateString) return 'N/A'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Invalid date'
    return date.toLocaleDateString()
  } catch {
    return 'Invalid date'
  }
}

