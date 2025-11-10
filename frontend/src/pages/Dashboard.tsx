export default function Dashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            Total Companies
          </h2>
          <p className="text-3xl font-bold text-gray-900">-</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            Total Jobs
          </h2>
          <p className="text-3xl font-bold text-gray-900">-</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            Total Applications
          </h2>
          <p className="text-3xl font-bold text-gray-900">-</p>
        </div>
      </div>
    </div>
  )
}

