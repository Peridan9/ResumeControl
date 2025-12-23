import { memo } from 'react'

interface OverviewCardsProps {
  totalCompanies: number
  totalApplications: number
}

function OverviewCards({ totalCompanies, totalApplications }: OverviewCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-700 mb-2">Total Companies</h2>
        <p className="text-3xl font-bold text-gray-900">{totalCompanies}</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-700 mb-2">Total Applications</h2>
        <p className="text-3xl font-bold text-gray-900">{totalApplications}</p>
      </div>
    </div>
  )
}

export default memo(OverviewCards)



