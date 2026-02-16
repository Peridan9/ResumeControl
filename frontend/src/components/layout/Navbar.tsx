import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { UserButton } from '@clerk/clerk-react'
import Button from '../ui/Button'

export default function Navbar() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  
  // Check if we're on the landing page
  const isLandingPage = location.pathname === '/'

  // Landing page variant
  if (isLandingPage) {
    return (
      <nav className="bg-white dark:bg-gray-800 shadow-sm relative z-10" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <Link to="/" className="text-3xl font-semibold text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded antialiased" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Resume Control
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/sign-in" aria-label="Sign in to your account">
                <Button variant="secondary" className="px-6 py-2 text-sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/sign-up" aria-label="Create a new account">
                <Button className="px-6 py-2 text-sm">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  // Protected routes variant
  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700" aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link
              to="/dashboard"
              className="text-2xl font-semibold text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded antialiased"
              style={{ fontFamily: "'Outfit', sans-serif" }}
              aria-label="Resume Control home"
            >
              Resume Control
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <UserButton
                afterSignOutUrl="/"
                userProfileUrl="/profile"
                userProfileMode="navigation"
                showName
                appearance={{
                  elements: {
                    avatarBox: 'w-8 h-8',
                  },
                }}
              />
            ) : (
              <span className="text-sm text-gray-600 dark:text-gray-300">Job Application Manager</span>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

