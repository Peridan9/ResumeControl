// Landing page for ResumeControl - public page with information about the system

import { useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Button from '../components/ui/Button'

export default function Landing() {
  const { isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()
  const heroImageRef = useRef<HTMLDivElement>(null)

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, loading, navigate])

  // Parallax scrolling effect
  useEffect(() => {
    const handleScroll = () => {
      if (heroImageRef.current) {
        const scrolled = window.pageYOffset
        const parallaxSpeed = 0.5 // Adjust this value to change parallax speed (0.5 = moves at half scroll speed)
        const parallax = scrolled * parallaxSpeed
        heroImageRef.current.style.transform = `translateY(${parallax}px)`
      }
    }

    // Use requestAnimationFrame for smooth performance
    let ticking = false
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll()
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation Bar */}
      <div className="bg-white dark:bg-gray-800 shadow-sm relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">ResumeControl</h1>
            <div className="flex gap-4">
              <Link
                to="/login"
                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-4 py-2"
              >
                Sign In
              </Link>
              <Link to="/register">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Image Section with Overlaid Text */}
      <div className="relative w-full h-[600px] md:h-[700px] overflow-hidden">
        {/* Background Image with Parallax Effect */}
        <div 
          ref={heroImageRef}
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/hero-image.png)',
            backgroundColor: '#e5e7eb', // Fallback gray color
            willChange: 'transform' // Optimizes performance for animations
          }}
        >
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-black/40 dark:bg-black/60"></div>
        </div>

        {/* Overlaid Text Content */}
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-6 drop-shadow-lg">
              Organize Your Job Search
            </h2>
            <p className="text-xl md:text-2xl text-white/90 mb-8 drop-shadow-md max-w-2xl mx-auto">
              Track job applications, manage company information, and store contact details all in one place.
              Keep your job search organized and never miss an opportunity.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button className="text-lg px-8 py-3 bg-white text-gray-900 hover:bg-gray-100 border-white">
                  Get Started Free
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="secondary" className="text-lg px-8 py-3 bg-white/10 text-white border-white/30 hover:bg-white/20 backdrop-blur-sm">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="text-3xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Track Applications
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Keep track of all your job applications with status updates, applied dates, and detailed notes.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="text-3xl mb-4">🏢</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Manage Companies
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Store company information, track your interactions, and maintain a database of potential employers.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="text-3xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Store Contacts
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Keep contact information for recruiters, hiring managers, and networking connections organized.
            </p>
          </div>
        </div>

        {/* Dashboard Preview Section */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow mb-16">
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4 text-center">
            Powerful Dashboard
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
            Get insights into your job search with statistics, status breakdowns, and recent activity tracking.
          </p>
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              Dashboard preview coming soon
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-blue-50 dark:bg-blue-900/20 rounded-lg p-12">
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Ready to get started?
          </h3>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Join ResumeControl today and take control of your job search.
          </p>
          <Link to="/register">
            <Button className="text-lg px-8 py-3">Create Your Free Account</Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-600 dark:text-gray-400">
            © 2025 ResumeControl. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

