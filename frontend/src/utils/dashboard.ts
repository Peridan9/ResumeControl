import type { Application, Job, Company } from '../types'
import { STATUS_OPTIONS } from '../constants/status'
import { formatDate } from './date'

/**
 * Calculate status breakdown from applications
 * @param applications - Array of applications
 * @returns Record mapping status values to counts
 */
export const calculateStatusBreakdown = (applications: Application[]): Record<string, number> => {
  const breakdown: Record<string, number> = {}
  STATUS_OPTIONS.forEach((status) => {
    breakdown[status.value] = 0
  })
  applications.forEach((app) => {
    const status = app.status.toLowerCase()
    if (breakdown[status] !== undefined) {
      breakdown[status]++
    }
  })
  return breakdown
}

/**
 * Calculate time-based statistics (this month, this week, today)
 * @param applications - Array of applications
 * @returns Object with thisMonth, thisWeek, and today counts
 */
export const calculateTimeBasedStats = (applications: Application[]) => {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfWeek = new Date(startOfToday)
  startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay()) // Start of week (Sunday)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  let thisMonth = 0
  let thisWeek = 0
  let today = 0

  applications.forEach((app) => {
    const appDate = new Date(app.applied_date)
    if (appDate >= startOfMonth) thisMonth++
    if (appDate >= startOfWeek) thisWeek++
    if (appDate >= startOfToday) today++
  })

  return { thisMonth, thisWeek, today }
}

/**
 * Get recent applications with enriched job and company data
 * @param applications - Array of applications
 * @param jobs - Array of jobs
 * @param companies - Array of companies
 * @param limit - Maximum number of applications to return
 * @returns Array of applications with job and company data
 */
export const getRecentApplications = (
  applications: Application[],
  jobs: Job[],
  companies: Company[],
  limit: number
): Array<Application & { job?: Job; company?: Company }> => {
  // Sort by applied_date descending (most recent first)
  const sorted = [...applications].sort((a, b) => {
    const dateA = new Date(a.applied_date).getTime()
    const dateB = new Date(b.applied_date).getTime()
    return dateB - dateA
  })

  // Get top N and enrich with job and company data
  return sorted.slice(0, limit).map((app) => {
    const job = jobs.find((j) => j.application_id === app.id)
    const company = job ? companies.find((c) => c.id === job.company_id) : undefined
    return { ...app, job, company }
  })
}

// Re-export formatDate from date utils for backward compatibility
export { formatDate } from './date'

/**
 * Calculate percentage of applications with a given status
 * @param status - Status value
 * @param total - Total number of applications
 * @param applicationsByStatus - Record of status counts
 * @returns Percentage rounded to nearest integer
 */
export const getStatusPercentage = (
  status: string,
  total: number,
  applicationsByStatus: Record<string, number>
): number => {
  if (total === 0) return 0
  const count = applicationsByStatus[status] || 0
  return Math.round((count / total) * 100)
}

