import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { companiesAPI, jobsAPI, applicationsAPI } from '../services/api'
import type { Application, Job, Company } from '../types'
import { nullStringToString } from '../utils/helpers'

const STATUS_OPTIONS = [
  { value: 'applied', label: 'Applied' },
  { value: 'interview', label: 'Interview' },
  { value: 'offer', label: 'Offer' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
  { value: 'accepted', label: 'Accepted' },
]

const STATUS_COLORS: Record<string, string> = {
  applied: 'bg-blue-100 text-blue-800',
  interview: 'bg-yellow-100 text-yellow-800',
  offer: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  withdrawn: 'bg-gray-100 text-gray-800',
  accepted: 'bg-green-100 text-green-800',
}

interface Statistics {
  totalCompanies: number
  totalJobs: number
  totalApplications: number
  applicationsByStatus: Record<string, number>
  applicationsThisMonth: number
  applicationsThisWeek: number
  applicationsToday: number
  recentApplications: Array<Application & { job?: Job; company?: Company }>
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<Statistics>({
    totalCompanies: 0,
    totalJobs: 0,
    totalApplications: 0,
    applicationsByStatus: {},
    applicationsThisMonth: 0,
    applicationsThisWeek: 0,
    applicationsToday: 0,
    recentApplications: [],
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch all data in parallel
      const [companies, jobs, applications] = await Promise.all([
        companiesAPI.getAll(),
        jobsAPI.getAll(),
        applicationsAPI.getAll(),
      ])

      // Calculate statistics
      const applicationsByStatus = calculateStatusBreakdown(applications)
      const { thisMonth, thisWeek, today } = calculateTimeBasedStats(applications)
      const recentApplications = getRecentApplications(applications, jobs, companies, 5)

      setStats({
        totalCompanies: companies.length,
        totalJobs: jobs.length,
        totalApplications: applications.length,
        applicationsByStatus,
        applicationsThisMonth: thisMonth,
        applicationsThisWeek: thisWeek,
        applicationsToday: today,
        recentApplications,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const calculateStatusBreakdown = (applications: Application[]): Record<string, number> => {
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

  const calculateTimeBasedStats = (applications: Application[]) => {
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

  const getRecentApplications = (
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

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return 'Invalid date'
    }
  }

  const getStatusPercentage = (status: string, total: number): number => {
    if (total === 0) return 0
    const count = stats.applicationsByStatus[status] || 0
    return Math.round((count / total) * 100)
  }

  const handleApplicationClick = (applicationId: number) => {
    navigate(`/applications/${applicationId}`)
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Total Companies</h2>
          <p className="text-3xl font-bold text-gray-900">{stats.totalCompanies}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Total Jobs</h2>
          <p className="text-3xl font-bold text-gray-900">{stats.totalJobs}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Total Applications</h2>
          <p className="text-3xl font-bold text-gray-900">{stats.totalApplications}</p>
        </div>
      </div>

      {/* Application Status Breakdown */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Application Status Breakdown</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {STATUS_OPTIONS.map((status) => {
            const count = stats.applicationsByStatus[status.value] || 0
            const percentage = getStatusPercentage(status.value, stats.totalApplications)
            const colorClass = STATUS_COLORS[status.value] || 'bg-gray-100 text-gray-800'

            return (
              <div key={status.value} className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${colorClass}`}>
                    {status.label}
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                {stats.totalApplications > 0 && (
                  <p className="text-sm text-gray-500 mt-1">{percentage}%</p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Time-Based Statistics */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Applications This Month</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.applicationsThisMonth}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Applications This Week</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.applicationsThisWeek}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Applications Today</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.applicationsToday}</p>
          </div>
        </div>
      </div>

      {/* Recent Applications */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Applications</h2>
        {stats.recentApplications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">No applications found.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Job Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applied Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.recentApplications.map((app) => {
                  const statusColor = STATUS_COLORS[app.status.toLowerCase()] || 'bg-gray-100 text-gray-800'
                  const statusLabel = STATUS_OPTIONS.find((s) => s.value === app.status.toLowerCase())?.label || app.status

                  return (
                    <tr
                      key={app.id}
                      onClick={() => handleApplicationClick(app.id)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {app.job?.title || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {app.company?.name || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(app.applied_date)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
