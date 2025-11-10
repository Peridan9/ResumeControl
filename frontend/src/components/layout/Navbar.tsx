import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-gray-900">
              ResumeControl
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Job Application Manager</span>
          </div>
        </div>
      </div>
    </nav>
  )
}

