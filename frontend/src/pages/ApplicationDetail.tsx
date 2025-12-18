import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useToast } from '../hooks/useToast'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import ApplicationForm from '../components/applications/ApplicationForm'
import ApplicationDetailHeader from '../components/applications/ApplicationDetailHeader'
import ApplicationDetailCards from '../components/applications/ApplicationDetailCards'
import LoadingState from '../components/ui/LoadingState'
import ErrorMessage from '../components/ui/ErrorMessage'
import { useApplicationDetail, type UpdateApplicationFormData } from '../hooks/useApplicationDetail'

export default function ApplicationDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const applicationId = id ? parseInt(id, 10) : null

  const {
    application,
    job,
    company,
    contact,
    contacts,
    loading,
    error,
    updateApplication,
    deleteApplication,
    isUpdating,
    isDeleting,
    MODAL_CLOSE_DELAY,
  } = useApplicationDetail(applicationId)

  const handleEdit = () => {
    setIsEditModalOpen(true)
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
  }

  const handleUpdate = async (formData: UpdateApplicationFormData) => {
    updateApplication(formData, {
      onSuccess: () => {
        toast.showSuccess('Application updated successfully!')
        setTimeout(() => {
          handleCloseEditModal()
        }, MODAL_CLOSE_DELAY)
      },
      onError: (err) => {
        toast.showError(err instanceof Error ? err.message : 'Failed to update application')
      },
    })
  }

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    deleteApplication(undefined, {
      onSuccess: () => {
        toast.showSuccess('Application deleted successfully!')
        setIsDeleteDialogOpen(false)
        // Navigation is handled by the hook
      },
      onError: (err) => {
        toast.showError(err instanceof Error ? err.message : 'Failed to delete application')
        setIsDeleteDialogOpen(false)
      },
    })
  }

  const handleBack = () => {
    navigate('/applications')
  }

  if (loading) {
    return <LoadingState message="Loading application details..." />
  }

  if (error || !application) {
    return (
      <div>
        <Button variant="secondary" onClick={handleBack} className="mb-4">
          ← Back to Applications
        </Button>
        <ErrorMessage message={error || 'Application not found'} />
      </div>
    )
  }

  return (
    <div>
      <ApplicationDetailHeader
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        onBack={handleBack}
      />

      <ApplicationDetailCards
        application={application}
        job={job}
        company={company}
        contact={contact}
      />

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
          isLoading={isUpdating}
        />
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Application"
        message={
          job && company
            ? `Are you sure you want to delete the application for "${job.title}" at "${company.name}"? This action cannot be undone.`
            : job
            ? `Are you sure you want to delete the application for "${job.title}"? This action cannot be undone.`
            : `Are you sure you want to delete this application? This action cannot be undone.`
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  )
}
