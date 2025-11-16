import { useState, useEffect } from 'react'
import { applicationsAPI, jobsAPI, companiesAPI } from '../services/api'
import type { Application, Job, Company } from '../types'
import ApplicationTable from '../components/applications/ApplicationTable'
import ApplicationForm from '../components/applications/ApplicationForm'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'

export default function Applications() {
  const [applications, setApplications] = useState<Application[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Fetch all data on component mount
  useEffect(() => {
    // Clear draft on page load/refresh (sessionStorage persists across refreshes)
    // This ensures a fresh start on page refresh, but keeps draft if form is closed/reopened without refresh
    try {
      sessionStorage.removeItem('applicationFormDraft')
    } catch (error) {
      // Ignore errors (e.g., if sessionStorage is not available)
    }
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch all data in parallel
      const [applicationsData, jobsData, companiesData] = await Promise.all([
        applicationsAPI.getAll(),
        jobsAPI.getAll(),
        companiesAPI.getAll(),
      ])

      setApplications(applicationsData)
      setJobs(jobsData)
      setCompanies(companiesData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch applications')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  const handleSubmit = async (formData: {
    companyName: string
    jobTitle: string
    jobDescription?: string
    jobRequirements?: string
    jobLocation?: string
    status: string
    appliedDate: string
    notes?: string
  }) => {
    try {
      setIsSubmitting(true)
      setError(null)
      setSuccessMessage(null)

      // Step 1: Create/get company (get-or-create pattern)
      const company = await companiesAPI.create({
        name: formData.companyName,
      })

      // Step 2: Create job
      const job = await jobsAPI.create({
        company_id: company.id,
        title: formData.jobTitle,
        description: formData.jobDescription,
        requirements: formData.jobRequirements,
        location: formData.jobLocation,
      })

      // Step 3: Create application
      await applicationsAPI.create({
        job_id: job.id,
        status: formData.status,
        applied_date: formData.appliedDate,
        notes: formData.notes,
      })

      setSuccessMessage('Application created successfully!')

      // Refresh the data
      await fetchData()

      // Close modal after a short delay to show success message
      setTimeout(() => {
        handleCloseModal()
        setSuccessMessage(null)
      }, 500)
    } catch (err) {
      throw err // Let the form handle the error
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Applications</h1>
        <Button variant="primary" onClick={handleCreate}>
          Add Application
        </Button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading applications...</p>
        </div>
      ) : (
        <ApplicationTable
          applications={applications}
          jobs={jobs}
          companies={companies}
          emptyMessage="No applications found. Create your first application to get started."
        />
      )}

      {/* Create Application Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Create New Application"
      >
        <ApplicationForm
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
          isLoading={isSubmitting}
        />
      </Modal>
    </div>
  )
}

