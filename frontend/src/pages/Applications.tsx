export default function Applications() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Applications</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          Add Application
        </button>
      </div>
      <div className="bg-white rounded-lg shadow">
        <p className="p-6 text-gray-600">Applications list will go here</p>
      </div>
    </div>
  )
}

