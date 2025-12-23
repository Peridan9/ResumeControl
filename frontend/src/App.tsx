import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { ToastProvider } from './contexts/ToastContext'
import ErrorBoundary from './components/ErrorBoundary'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import LoadingState from './components/ui/LoadingState'
import ToastContainer from './components/ui/ToastContainer'

// Lazy load all page components for code splitting
const Landing = lazy(() => import('./pages/Landing'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Companies = lazy(() => import('./pages/Companies'))
const Contacts = lazy(() => import('./pages/Contacts'))
const Applications = lazy(() => import('./pages/Applications'))
const ApplicationDetail = lazy(() => import('./pages/ApplicationDetail'))
const CompanyDetail = lazy(() => import('./pages/CompanyDetail'))
const ContactDetail = lazy(() => import('./pages/ContactDetail'))
const Profile = lazy(() => import('./pages/Profile'))
const TailorResume = lazy(() => import('./pages/TailorResume'))
const InterviewTraining = lazy(() => import('./pages/InterviewTraining'))

// Create a QueryClient instance with default options
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes - cache garbage collection (formerly cacheTime)
      refetchOnWindowFocus: true, // Refetch when window regains focus
      retry: 1, // Retry failed requests once
    },
  },
})

// Suspense wrapper component for lazy-loaded routes
function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingState fullScreen message="Loading..." />}>
      {children}
    </Suspense>
  )
}

// Component to handle public routes (login/register) with redirect if authenticated
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return <LoadingState fullScreen message="Loading..." />
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

function AppRoutes() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route
          path="/"
          element={
            <SuspenseWrapper>
              <Landing />
            </SuspenseWrapper>
          }
        />
        <Route
          path="/login"
          element={
            <SuspenseWrapper>
              <PublicRoute>
                <Login />
              </PublicRoute>
            </SuspenseWrapper>
          }
        />
        <Route
          path="/register"
          element={
            <SuspenseWrapper>
              <PublicRoute>
                <Register />
              </PublicRoute>
            </SuspenseWrapper>
          }
        />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <SuspenseWrapper>
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            </SuspenseWrapper>
          }
        />
        <Route
          path="/companies"
          element={
            <SuspenseWrapper>
              <ProtectedRoute>
                <Layout>
                  <Companies />
                </Layout>
              </ProtectedRoute>
            </SuspenseWrapper>
          }
        />
        <Route
          path="/contacts"
          element={
            <SuspenseWrapper>
              <ProtectedRoute>
                <Layout>
                  <Contacts />
                </Layout>
              </ProtectedRoute>
            </SuspenseWrapper>
          }
        />
        <Route
          path="/applications"
          element={
            <SuspenseWrapper>
              <ProtectedRoute>
                <Layout>
                  <Applications />
                </Layout>
              </ProtectedRoute>
            </SuspenseWrapper>
          }
        />
        <Route
          path="/applications/:id"
          element={
            <SuspenseWrapper>
              <ProtectedRoute>
                <Layout>
                  <ApplicationDetail />
                </Layout>
              </ProtectedRoute>
            </SuspenseWrapper>
          }
        />
        <Route
          path="/companies/:id"
          element={
            <SuspenseWrapper>
              <ProtectedRoute>
                <Layout>
                  <CompanyDetail />
                </Layout>
              </ProtectedRoute>
            </SuspenseWrapper>
          }
        />
        <Route
          path="/contacts/:id"
          element={
            <SuspenseWrapper>
              <ProtectedRoute>
                <Layout>
                  <ContactDetail />
                </Layout>
              </ProtectedRoute>
            </SuspenseWrapper>
          }
        />
        <Route
          path="/profile"
          element={
            <SuspenseWrapper>
              <ProtectedRoute>
                <Layout>
                  <Profile />
                </Layout>
              </ProtectedRoute>
            </SuspenseWrapper>
          }
        />
        <Route
          path="/tailor-resume"
          element={
            <SuspenseWrapper>
              <ProtectedRoute>
                <Layout>
                  <TailorResume />
                </Layout>
              </ProtectedRoute>
            </SuspenseWrapper>
          }
        />
        <Route
          path="/interview-training"
          element={
            <SuspenseWrapper>
              <ProtectedRoute>
                <Layout>
                  <InterviewTraining />
                </Layout>
              </ProtectedRoute>
            </SuspenseWrapper>
          }
        />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <AppRoutes />
              <ToastContainer />
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
        {/* React Query DevTools - only visible in development */}
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App

