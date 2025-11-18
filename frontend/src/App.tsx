import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Companies from './pages/Companies'
import Contacts from './pages/Contacts'
import Applications from './pages/Applications'
import ApplicationDetail from './pages/ApplicationDetail'

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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/companies" element={<Companies />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/applications" element={<Applications />} />
            <Route path="/applications/:id" element={<ApplicationDetail />} />
          </Routes>
        </Layout>
      </Router>
    </QueryClientProvider>
  )
}

export default App

