import { memo } from 'react'
import { STATUS_OPTIONS } from '../../constants/status'
import { getStatusPercentage } from '../../utils/dashboard'
import StatusBadge from '../ui/StatusBadge'

interface StatusBreakdownProps {
  applicationsByStatus: Record<string, number>
  totalApplications: number
}

function StatusBreakdown({ applicationsByStatus, totalApplications }: StatusBreakdownProps) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Application Status Breakdown</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {STATUS_OPTIONS.map((status) => {
          const count = applicationsByStatus[status.value] || 0
          const percentage = getStatusPercentage(status.value, totalApplications, applicationsByStatus)

          return (
            <div key={status.value} className="bg-white p-4 rounded-lg shadow min-w-0">
              <div className="flex items-center justify-between mb-2">
                <StatusBadge status={status.value} size="sm" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              {totalApplications > 0 && (
                <p className="text-sm text-gray-500 mt-1">{percentage}%</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default memo(StatusBreakdown)

