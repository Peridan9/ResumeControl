import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { applicationsAPI, jobsAPI, companiesAPI, contactsAPI } from '../services/api'
import type { Application, Job, Company, Contact } from '../types'
import { nullStringToString, nullTimeToString } from '../utils/helpers'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import ApplicationForm from '../components/applications/ApplicationForm'

export default function ApplicationDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)

  const applicationId = id ? parseInt(id, 10) : null

  // Fetch application detail
  const {
    data: application,
    isLoading: applicationLoading,
    error: applicationError,
  } = useQuery<Application>({
    queryKey: ['application', applicationId],
    queryFn: () => {
      if (!applicationId) throw new Error('Invalid application ID')
      return applicationsAPI.getById(applicationId)
    },
    enabled: !!applicationId,
  })

  // Fetch job by application ID
  const {
    data: job,
    isLoading: jobLoading,
  } = useQuery<Job>({
    queryKey: ['job', 'by-application', applicationId],
    queryFn: () => {
      if (!applicationId) throw new Error('Invalid application ID')
      return applicationsAPI.getJobByApplicationId(applicationId)
    },
    enabled: !!applicationId && !!application,
  })

  // Fetch company
  const {
    data: company,
    isLoading: companyLoading,
  } = useQuery<Company>({
    queryKey: ['company', job?.company_id],
    queryFn: () => {
      if (!job?.company_id) throw new Error('Invalid company ID')
      return companiesAPI.getById(job.company_id)
    },
    enabled: !!job?.company_id,
  })

  // Extract contact ID from application
  const contactId = useMemo(() => {
    if (!application?.contact_id) return null
    const cid = application.contact_id
    if (typeof cid === 'number' && cid > 0) return cid
    if (typeof cid === 'object' && 'Int32' in cid && 'Valid' in cid) {
      if (cid.Valid && cid.Int32 > 0) return cid.Int32
    }
    return null
  }, [application?.contact_id])

  // Fetch contact if contact_id exists
  const {
    data: contact,
  } = useQuery<Contact>({
    queryKey: ['contact', contactId],
    queryFn: () => {
      if (!contactId) throw new Error('Invalid contact ID')
      return contactsAPI.getById(contactId)
    },
    enabled: !!contactId,
    retry: false, // Don't retry if contact doesn't exist
  })

  // Fetch all contacts for the form dropdown (uses cache if already fetched)
  const {
    data: contacts = [],
  } = useQuery<Contact[]>({
    queryKey: ['contacts'],
    queryFn: () => contactsAPI.getAll(),
  })

  const loading = applicationLoading || jobLoading || companyLoading
  const error = applicationError
    ? (applicationError instanceof Error ? applicationError.message : 'Failed to fetch application details')
    : !applicationId
    ? 'Invalid application ID'
    : null

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch {
      return 'Invalid date'
    }
  }

  const formatDateTime = (dateString: string | null): string => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return 'Invalid date'
    }
  }

  const getStatusBadgeColor = (status: string): string => {
    const statusColors: Record<string, string> = {
      applied: 'bg-blue-100 text-blue-800',
      interview: 'bg-yellow-100 text-yellow-800',
      offer: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      withdrawn: 'bg-gray-100 text-gray-800',
    }
    return statusColors[status.toLowerCase()] || 'bg-gray-100 text-gray-800'
  }

  const handleEdit = () => {
    setIsEditModalOpen(true)
    setSuccessMessage(null)
    setMutationError(null)
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
  }

  // Mutation for updating application
  const updateApplicationMutation = useMutation({
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
      if (!application || !job || !company) throw new Error('Missing required data')

      // Step 1: Update company if name changed
      if (formData.companyName !== company.name) {
        await companiesAPI.update(company.id, {
          name: formData.companyName,
        })
      }

      // Step 2: Update job
      await jobsAPI.update(job.id, {
        title: formData.jobTitle,
        description: formData.jobDescription,
        requirements: formData.jobRequirements,
        location: formData.jobLocation,
      })

      // Step 3: Update application
      return await applicationsAPI.update(application.id, {
        status: formData.status,
        applied_date: formData.appliedDate,
        contact_id: formData.contactId ?? null,
        notes: formData.notes,
      })
    },
    onSuccess: () => {
      // Invalidate and refetch all related queries
      queryClient.invalidateQueries({ queryKey: ['application', applicationId] })
      queryClient.invalidateQueries({ queryKey: ['job', 'by-application', applicationId] })
      queryClient.invalidateQueries({ queryKey: ['company', job?.company_id] })
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      if (contactId) {
        queryClient.invalidateQueries({ queryKey: ['contact', contactId] })
      }
      queryClient.invalidateQueries({ queryKey: ['contacts'] })

      setSuccessMessage('Application updated successfully!')
      setMutationError(null)

      // Close modal after a short delay to show success message
      setTimeout(() => {
        handleCloseEditModal()
        setSuccessMessage(null)
      }, 500)
    },
    onError: (err) => {
      setMutationError(err instanceof Error ? err.message : 'Failed to update application')
    },
  })

  // Mutation for deleting application
  const deleteApplicationMutation = useMutation({
    mutationFn: async () => {
      if (!application) throw new Error('No application to delete')
      return await applicationsAPI.delete(application.id)
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      
      // Navigate back to applications list
      navigate('/applications')
    },
    onError: (err) => {
      setMutationError(err instanceof Error ? err.message : 'Failed to delete application')
      setIsDeleteDialogOpen(false)
    },
  })

  const handleUpdate = async (formData: {
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
    updateApplicationMutation.mutate(formData)
  }

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    deleteApplicationMutation.mutate()
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Loading application details...</p>
      </div>
    )
  }

  if (error || !application) {
    return (
      <div>
        <Button variant="secondary" onClick={() => navigate('/applications')} className="mb-4">
          ← Back to Applications
        </Button>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error || 'Application not found'}
        </div>
      </div>
    )
  }

  const companyWebsite = company?.website ? nullStringToString(company.website) : ''
  const jobDescription = job?.description ? nullStringToString(job.description) : ''
  const jobRequirements = job?.requirements ? nullStringToString(job.requirements) : ''
  const jobLocation = job?.location ? nullStringToString(job.location) : ''
  const notes = nullStringToString(application.notes)
  const createdAt = nullTimeToString(application.created_at)
  const updatedAt = nullTimeToString(application.updated_at)

  return (
    <div>
      {/* Back Button */}
      <Button variant="secondary" onClick={() => navigate('/applications')} className="mb-6">
        ← Back to Applications
      </Button>

      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Application Details</h1>
        <div className="flex space-x-3">
          <Button variant="primary" onClick={handleEdit}>
            Edit Application
          </Button>
          <Button variant="danger" onClick={handleDeleteClick}>
            Delete Application
          </Button>
        </div>
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

      <div className="space-y-6">
        {/* Company Information Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Company Information</h2>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-500">Company Name</span>
              <p className="text-lg text-gray-900">{company?.name || 'Unknown Company'}</p>
            </div>
            {companyWebsite && (
              <div>
                <span className="text-sm font-medium text-gray-500">Website</span>
                <p className="text-lg">
                  <a
                    href={companyWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {companyWebsite}
                  </a>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Job Details Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Details</h2>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-500">Job Title</span>
              <p className="text-lg text-gray-900">{job?.title || 'Unknown Job'}</p>
            </div>
            {jobLocation && (
              <div>
                <span className="text-sm font-medium text-gray-500">Location</span>
                <p className="text-lg text-gray-900">{jobLocation}</p>
              </div>
            )}
            {jobDescription && (
              <div>
                <span className="text-sm font-medium text-gray-500">Description</span>
                <p className="text-gray-900 whitespace-pre-wrap">{jobDescription}</p>
              </div>
            )}
            {jobRequirements && (
              <div>
                <span className="text-sm font-medium text-gray-500">Requirements</span>
                <p className="text-gray-900 whitespace-pre-wrap">{jobRequirements}</p>
              </div>
            )}
          </div>
        </div>

        {/* Contact Information Card */}
        {contact && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-500">Name</span>
                <p className="text-lg text-gray-900">{contact.name}</p>
              </div>
              {contact.email && nullStringToString(contact.email) && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Email</span>
                  <p className="text-lg">
                    <a
                      href={`mailto:${nullStringToString(contact.email)}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {nullStringToString(contact.email)}
                    </a>
                  </p>
                </div>
              )}
              {contact.phone && nullStringToString(contact.phone) && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Phone</span>
                  <p className="text-lg">
                    <a
                      href={`tel:${nullStringToString(contact.phone)}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {nullStringToString(contact.phone)}
                    </a>
                  </p>
                </div>
              )}
              {contact.linkedin && nullStringToString(contact.linkedin) && (
                <div>
                  <span className="text-sm font-medium text-gray-500">LinkedIn</span>
                  <p className="text-lg">
                    <a
                      href={nullStringToString(contact.linkedin) || undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {nullStringToString(contact.linkedin)}
                    </a>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Application Details Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Application Details</h2>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-500">Status</span>
              <p className="mt-1">
                <span
                  className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(
                    application.status
                  )}`}
                >
                  {application.status}
                </span>
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Applied Date</span>
              <p className="text-lg text-gray-900">{formatDate(application.applied_date)}</p>
            </div>
            {notes && (
              <div>
                <span className="text-sm font-medium text-gray-500">Notes</span>
                <p className="text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded mt-1">
                  {notes}
                </p>
              </div>
            )}
            {createdAt && (
              <div>
                <span className="text-sm font-medium text-gray-500">Created</span>
                <p className="text-gray-900">{formatDateTime(createdAt)}</p>
              </div>
            )}
            {updatedAt && (
              <div>
                <span className="text-sm font-medium text-gray-500">Last Updated</span>
                <p className="text-gray-900">{formatDateTime(updatedAt)}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Application Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        title="Edit Application"
      >
        <ApplicationForm
          application={application}
          job={job}
          company={company}
          contacts={contacts}
          onSubmit={handleUpdate}
          onCancel={handleCloseEditModal}
          isLoading={updateApplicationMutation.isPending}
        />
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Application"
        message={`Are you sure you want to delete this application? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteApplicationMutation.isPending}
      />
    </div>
  )
}

