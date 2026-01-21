import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { companiesAPI, jobsAPI, applicationsAPI } from '../services/api'
import type { Application, Job, Company } from '../types'
import { calculateStatusBreakdown, calculateTimeBasedStats, getRecentApplications } from '../utils/dashboard'
import RecentApplications from '../components/dashboard/RecentApplications'
import StatusBreakdown from '../components/dashboard/StatusBreakdown'
import TimeStats from '../components/dashboard/TimeStats'
import OverviewCards from '../components/dashboard/OverviewCards'
import LoadingState from '../components/ui/LoadingState'
import ErrorMessage from '../components/ui/ErrorMessage'

interface Statistics {
  totalCompanies: number
  totalApplications: number
  applicationsByStatus: Record<string, number>
  applicationsThisMonth: number
  applicationsThisWeek: number
  applicationsToday: number
  recentApplications: Array<Application & { job?: Job; company?: Company }>
}

export default function Dashboard() {
  const navigate = useNavigate()

  // Fetch all data using React Query (will use cached data if available)
  const {
    data: companies = [],
    isLoading: companiesLoading,
    error: companiesError,
  } = useQuery<Company[]>({
    queryKey: ['companies'],
    queryFn: () => companiesAPI.getAll(),
  })

  const {
    data: jobs = [],
    isLoading: jobsLoading,
  } = useQuery<Job[]>({
    queryKey: ['jobs'],
    queryFn: () => jobsAPI.getAll(),
  })

  const {
    data: applications = [],
    isLoading: applicationsLoading,
    error: applicationsError,
  } = useQuery<Application[]>({
    queryKey: ['applications'],
    queryFn: () => applicationsAPI.getAll(),
  })

  const loading = companiesLoading || jobsLoading || applicationsLoading
  const error = companiesError || applicationsError
    ? (companiesError || applicationsError) instanceof Error
      ? ((companiesError || applicationsError) as Error).message
      : 'Failed to fetch dashboard data'
    : null

  // Calculate statistics using useMemo for performance
  const stats = useMemo<Statistics>(() => {
    const applicationsByStatus = calculateStatusBreakdown(applications)
    const { thisMonth, thisWeek, today } = calculateTimeBasedStats(applications)
    const recentApplications = getRecentApplications(applications, jobs, companies, 5)

    return {
      totalCompanies: companies.length,
      totalApplications: applications.length,
      applicationsByStatus,
      applicationsThisMonth: thisMonth,
      applicationsThisWeek: thisWeek,
      applicationsToday: today,
      recentApplications,
    }
  }, [applications, jobs, companies])

  const handleApplicationClick = (applicationId: number) => {
    navigate(`/applications/${applicationId}`)
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
        <LoadingState message="Loading dashboard data..." />
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
        <ErrorMessage message={error} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

      <RecentApplications
        applications={stats.recentApplications}
        onApplicationClick={handleApplicationClick}
      />

      <TimeStats
        applicationsThisMonth={stats.applicationsThisMonth}
        applicationsThisWeek={stats.applicationsThisWeek}
        applicationsToday={stats.applicationsToday}
      />

      <StatusBreakdown
        applicationsByStatus={stats.applicationsByStatus}
        totalApplications={stats.totalApplications}
      />

      <OverviewCards
        totalCompanies={stats.totalCompanies}
        totalApplications={stats.totalApplications}
      />
    </div>
  )
}
