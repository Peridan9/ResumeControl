import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { applicationsAPI, jobsAPI, companiesAPI, contactsAPI } from '../services/api'
import type { Application, Job, Company, Contact } from '../types'
import ApplicationTable, { STATUS_OPTIONS } from '../components/applications/ApplicationTable'
import ApplicationForm from '../components/applications/ApplicationForm'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'

export default function Applications() {
  const queryClient = useQueryClient()
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

  // Fetch all data using React Query
  const {
    data: applications = [],
    isLoading: applicationsLoading,
    error: applicationsError,
  } = useQuery<Application[]>({
    queryKey: ['applications'],
    queryFn: () => applicationsAPI.getAll(),
  })

  const {
    data: jobs = [],
    isLoading: jobsLoading,
  } = useQuery<Job[]>({
    queryKey: ['jobs'],
    queryFn: () => jobsAPI.getAll(),
  })

  const {
    data: companies = [],
    isLoading: companiesLoading,
  } = useQuery<Company[]>({
    queryKey: ['companies'],
    queryFn: () => companiesAPI.getAll(),
  })

  const {
    data: contacts = [],
    isLoading: contactsLoading,
  } = useQuery<Contact[]>({
    queryKey: ['contacts'],
    queryFn: () => contactsAPI.getAll(),
  })

  // Compute filtered applications
  const filteredApplications = useMemo(() => {
    if (!statusFilter || statusFilter === '') {
      return applications
    }
    return applications.filter((app) => app.status.toLowerCase() === statusFilter.toLowerCase())
  }, [applications, statusFilter])

  const loading = applicationsLoading || jobsLoading || companiesLoading || contactsLoading
  const error = applicationsError ? (applicationsError instanceof Error ? applicationsError.message : 'Failed to fetch applications') : null

  const handleCreate = () => {
    setIsModalOpen(true)
    setMutationError(null)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  // Mutation for creating application
  const createApplicationMutation = useMutation({
    mutationFn: async (formData: {
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
      // Step 1: Create/get company (get-or-create pattern)
      const company = await companiesAPI.create({
        name: formData.companyName,
      })

      // Step 2: Create application first (jobs now belong to applications)
      const application = await applicationsAPI.create({
        status: formData.status,
        applied_date: formData.appliedDate,
        contact_id: formData.contactId || null,
        notes: formData.notes,
      })

      // Step 3: Create job with application_id
      await jobsAPI.create({
        application_id: application.id,
        company_id: company.id,
        title: formData.jobTitle,
        description: formData.jobDescription,
        requirements: formData.jobRequirements,
        location: formData.jobLocation,
      })

      return application
    },
    onSuccess: () => {
      // Invalidate and refetch all related queries
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      
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
    createApplicationMutation.mutate(formData)
  }

  // Handler for editing application (navigate to detail page)
  const handleEdit = (application: Application) => {
    navigate(`/applications/${application.id}`)
  }

  // Mutation for deleting application
  const deleteApplicationMutation = useMutation({
    mutationFn: async (id: number) => {
      return await applicationsAPI.delete(id)
    },
    onSuccess: () => {
      // Invalidate and refetch all related queries
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      
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

  const handleDelete = async (id: number) => {
    deleteApplicationMutation.mutate(id)
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
        isDeleting={deleteApplicationMutation.isPending}
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
          isLoading={createApplicationMutation.isPending}
          contacts={contacts || []}
        />
      </Modal>
    </div>
  )
}

