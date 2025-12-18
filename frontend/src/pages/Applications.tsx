import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApplications } from '../hooks/useApplications'
import ApplicationTable, { STATUS_OPTIONS } from '../components/applications/ApplicationTable'
import ApplicationForm from '../components/applications/ApplicationForm'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'

export default function Applications() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)

  // Clear draft on page load/refresh (sessionStorage persists across refreshes)
  // This ensures a fresh start on page refresh, but keeps draft if form is closed/reopened without refresh
  try {
    sessionStorage.removeItem('applicationFormDraft')
  } catch (error) {
    // Ignore errors (e.g., if sessionStorage is not available)
  }

  // Use applications hook for data fetching
  const {
    applications,
    jobs,
    companies,
    contacts,
    loading,
    error,
    createApplication,
    deleteApplication,
    isCreating,
    isDeleting,
  } = useApplications()

  // Compute filtered applications
  const filteredApplications = useMemo(() => {
    if (!statusFilter || statusFilter === '') {
      return applications
    }
    return applications.filter((app) => app.status.toLowerCase() === statusFilter.toLowerCase())
  }, [applications, statusFilter])

  const handleCreate = () => {
    setIsModalOpen(true)
    setMutationError(null)
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
    contactId?: number | null
    notes?: string
  }) => {
    createApplication(formData, {
      onSuccess: () => {
        setSuccessMessage('Application created successfully!')
        setMutationError(null)
        
        // Close modal after a short delay to show success message
        setTimeout(() => {
          handleCloseModal()
          setSuccessMessage(null)
        }, 500)
      },
      onError: (err) => {
        setMutationError(err instanceof Error ? err.message : 'Failed to create application')
      },
    })
  }

  // Handler for editing application (navigate to detail page)
  const handleEdit = (application: { id: number }) => {
    navigate(`/applications/${application.id}`)
  }

  const handleDelete = async (id: number) => {
    deleteApplication(id, {
      onSuccess: () => {
        setSuccessMessage('Application deleted successfully!')
        setMutationError(null)
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null)
        }, 3000)
      },
      onError: (err) => {
        setMutationError(err instanceof Error ? err.message : 'Failed to delete application')
        setTimeout(() => {
          setMutationError(null)
        }, 5000)
      },
    })
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Applications</h1>
        <Button variant="success" onClick={handleCreate}>
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
      {(error || mutationError) && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error || mutationError}
        </div>
      )}

      <ApplicationTable
        applications={filteredApplications}
        jobs={jobs}
        companies={companies}
        contacts={contacts}
        loading={loading}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isDeleting={isDeleting}
        emptyMessage={
          statusFilter
            ? `No applications found with status "${STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label}".`
            : 'No applications found. Create your first application to get started.'
        }
      />

      {/* Create Application Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Create New Application"
      >
        <ApplicationForm
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
          isLoading={isCreating}
          contacts={contacts || []}
        />
      </Modal>
    </div>
  )
}

