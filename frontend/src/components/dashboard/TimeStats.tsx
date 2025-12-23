import { memo } from 'react'

interface TimeStatsProps {
  applicationsThisMonth: number
  applicationsThisWeek: number
  applicationsToday: number
}

function TimeStats({ applicationsThisMonth, applicationsThisWeek, applicationsToday }: TimeStatsProps) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Applications This Month</h3>
          <p className="text-3xl font-bold text-gray-900">{applicationsThisMonth}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Applications This Week</h3>
          <p className="text-3xl font-bold text-gray-900">{applicationsThisWeek}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Applications Today</h3>
          <p className="text-3xl font-bold text-gray-900">{applicationsToday}</p>
        </div>
      </div>
    </div>
  )
}

export default memo(TimeStats)



