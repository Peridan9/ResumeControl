import type { Application, Job, Company } from '../../types'
import { nullTimeToString } from '../../utils/helpers'

interface ApplicationTableProps {
  applications: Application[]
  jobs: Job[]
  companies: Company[]
  emptyMessage?: string
}

export default function ApplicationTable({
  applications,
  jobs,
  companies,
  emptyMessage = 'No applications found',
}: ApplicationTableProps) {
  // Helper function to get job by ID
  const getJob = (jobId: number): Job | undefined => {
    return jobs.find((job) => job.id === jobId)
  }

  // Helper function to get company by ID
  const getCompany = (companyId: number): Company | undefined => {
    return companies.find((company) => company.id === companyId)
  }

  // Helper function to format date
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A'
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

  // Helper function to format null time
  const formatNullTime = (nullTime: string | null | { Time: string; Valid: boolean }): string => {
    if (nullTime === null) {
      return 'N/A'
    }
    const timeStr = nullTimeToString(nullTime)
    return formatDate(timeStr)
  }

  if (!applications || applications.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <p className="text-gray-600">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Company
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Job Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Applied Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Updated
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {applications?.map((application) => {
              const job = getJob(application.job_id)
              const company = job ? getCompany(job.company_id) : undefined

              return (
                <tr key={application.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {company?.name || 'Unknown Company'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {job?.title || 'Unknown Job'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {application.status}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(application.applied_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatNullTime(application.updated_at)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

