import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApplications } from '../hooks/useApplications'
import { useToast } from '../hooks/useToast'
import ApplicationTable, { STATUS_OPTIONS } from '../components/applications/ApplicationTable'
import ApplicationForm from '../components/applications/ApplicationForm'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import ErrorMessage from '../components/ui/ErrorMessage'

export default function Applications() {
  const navigate = useNavigate()
  const toast = useToast()
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [isModalOpen, setIsModalOpen] = useState(false)

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
        toast.showSuccess('Application created successfully!')
        // Close modal after a short delay to show success message
        setTimeout(() => {
          handleCloseModal()
        }, 500)
      },
      onError: (err) => {
        toast.showError(err instanceof Error ? err.message : 'Failed to create application')
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
        toast.showSuccess('Application deleted successfully!')
      },
      onError: (err) => {
        toast.showError(err instanceof Error ? err.message : 'Failed to delete application')
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

      {/* Error Message - only for query errors, not mutations */}
      {error && (
        <div className="mb-4">
          <ErrorMessage message={error} />
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

