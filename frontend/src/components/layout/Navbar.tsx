import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline'
import Button from '../ui/Button'

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  
  // Check if we're on the landing page
  const isLandingPage = location.pathname === '/'

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
      // Still navigate to login even if logout fails
      navigate('/login')
    }
  }

  // Landing page variant
  if (isLandingPage) {
    return (
      <nav className="bg-white dark:bg-gray-800 shadow-sm relative z-10">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">ResumeControl</h1>
            <div className="flex items-center gap-4">
              <Link to="/login">
                <Button variant="secondary" className="px-6 py-2 text-sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button className="px-6 py-2 text-sm">Get Started</Button>
              </Link>
              
              {/* Dark Mode Toggle Button - moved to the right */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? (
                  <SunIcon className="w-5 h-5" />
                ) : (
                  <MoonIcon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  // Protected routes variant
  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="text-xl font-bold text-gray-900 dark:text-white">
              ResumeControl
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {isAuthenticated && user ? (
              <>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {user.name || user.email}
                </span>
                <Button
                  variant="danger"
                  onClick={handleLogout}
                  className="!px-6 !py-2 !text-sm !border !font-normal"
                >
                  Logout
                </Button>
              </>
            ) : (
              <span className="text-sm text-gray-600 dark:text-gray-300">Job Application Manager</span>
            )}
            
            {/* Dark Mode Toggle Button - moved to the right */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? (
                <SunIcon className="w-5 h-5" />
              ) : (
                <MoonIcon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

