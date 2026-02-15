// Landing page for ResumeControl - public page with information about the system

import { type RefObject, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ReactLenis, useLenis } from 'lenis/react'
import { useAuth } from '../contexts/AuthContext'
import Button from '../components/ui/Button'
import Navbar from '../components/layout/Navbar'
import LoadingState from '../components/ui/LoadingState'

import 'lenis/dist/lenis.css'

/** Updates hero parallax from Lenis scroll; must be rendered inside ReactLenis. */
function LandingParallax({ heroRef }: { heroRef: RefObject<HTMLDivElement | null> }) {
  useLenis((lenis) => {
    if (heroRef.current) {
      const parallax = lenis.scroll * 0.5
      heroRef.current.style.transform = `translateY(${parallax}px)`
    }
  })
  return null
}

export default function Landing() {
  const { isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()
  const heroImageRef = useRef<HTMLDivElement>(null)
  const [dashboardSectionEl, setDashboardSectionEl] = useState<HTMLDivElement | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, loading, navigate])

  // Scroll-triggered animation for dashboard section (use state for element so effect runs after ref is set)
  useEffect(() => {
    if (!dashboardSectionEl) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            observer.unobserve(entry.target)
          }
        })
      },
      {
        threshold: 0.2,
        rootMargin: '0px 0px -100px 0px',
      }
    )
    observer.observe(dashboardSectionEl)
    return () => observer.unobserve(dashboardSectionEl)
  }, [dashboardSectionEl])

  // Show loading state while checking auth
  if (loading) {
    return <LoadingState fullScreen message="Loading..." />
  }
  return (
    <ReactLenis root options={{ lerp: 0.08, duration: 1.2 }}>
      <LandingParallax heroRef={heroImageRef} />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Navigation Bar */}
        <Navbar />

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
            <div className="bg-black/15 dark:bg-black/25 backdrop-blur-[2px] rounded-2xl px-6 py-8 md:px-10 md:py-10 shadow-lg">
              <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-6 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Organize Your Job Search
              </h2>
              <p className="text-base md:text-lg text-white/90 mb-8 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] max-w-2xl mx-auto space-y-3">
              <span className="block">Job searching gets overwhelming with multiple applications, resume versions, and notes scattered across platforms. This platform brings everything into one workspace so you can manage resume versions and track every application in a simple, organized way.</span>
              <span className="block">The goal is visibility and control. A detailed dashboard turns your activity into clear numbers and progress insights, so you can see where you stand, spot patterns, and make smarter decisions toward your next opportunity.</span>
            </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/sign-up">
                <Button className="!bg-gray-800 !text-white !border-gray-800 hover:!bg-gray-700 text-lg px-8 py-3">
                  Get Started Free
                </Button>
              </Link>
              <Link to="/sign-in">
                <Button variant="secondary" className="text-lg px-8 py-3 bg-white/10 text-white border-white/30 hover:bg-white/20 backdrop-blur-sm">
                  Sign In
                </Button>
              </Link>
              </div>
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

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow relative">
            <div className="absolute top-4 right-4">
              <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs font-semibold px-2.5 py-1 rounded-full">
                Under Development
              </span>
            </div>
            <div className="text-3xl mb-4">✏️</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Tailor Resume Per Application
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Customize your resume for each job application to highlight the most relevant skills and experiences.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow relative">
            <div className="absolute top-4 right-4">
              <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs font-semibold px-2.5 py-1 rounded-full">
                Under Development
              </span>
            </div>
            <div className="text-3xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Prepare to an Interview Using AI Chat
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Practice interview questions and get AI-powered feedback to improve your interview performance.
            </p>
          </div>
        </div>

        {/* Dashboard Preview Section with Scroll Animation */}
        <div 
          ref={setDashboardSectionEl}
          className="mb-16 overflow-hidden"
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
              {/* Text Content - Slides from left */}
              <div 
                className={`transition-all duration-1000 ease-out ${
                  isVisible 
                    ? 'opacity-100 translate-x-0' 
                    : 'opacity-0 -translate-x-12'
                }`}
              >
                <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  Powerful Dashboard
                </h3>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                  Get insights into your job search with comprehensive statistics and visual breakdowns.
                </p>
                <ul className="space-y-3 text-gray-600 dark:text-gray-400">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Track application status in real-time</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>View time-based statistics and trends</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Monitor recent activity and updates</span>
                  </li>
                </ul>
              </div>

              {/* Image - Slides from right */}
              <div 
                className={`transition-all duration-1000 ease-out delay-200 ${
                  isVisible 
                    ? 'opacity-100 translate-x-0' 
                    : 'opacity-0 translate-x-12'
                }`}
              >
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 shadow-inner">
                  <img 
                    src="/dashboard_review.png" 
                    alt="Dashboard Preview" 
                    className="w-full h-auto rounded-lg"
                  />
                </div>
              </div>
            </div>
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
          <Link to="/sign-up">
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
    </ReactLenis>
  )
}

