import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Companies from './pages/Companies'
import Jobs from './pages/Jobs'
import Applications from './pages/Applications'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/companies" element={<Companies />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/applications" element={<Applications />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App

