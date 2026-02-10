import { useState, useEffect, useRef, useCallback } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useToast } from '../../hooks/useToast'
import Modal from '../ui/Modal'
import ConfirmDialog from '../ui/ConfirmDialog'
import ApplicationForm from './ApplicationForm'
import ApplicationDetailHeader from './ApplicationDetailHeader'
import ApplicationDetailCards from './ApplicationDetailCards'
import LoadingState from '../ui/LoadingState'
import ErrorMessage from '../ui/ErrorMessage'
import { useApplicationDetail, type UpdateApplicationFormData } from '../../hooks/useApplicationDetail'

interface ApplicationDetailDrawerProps {
  applicationId: number | null
  onClose: () => void
}

const DRAWER_TRANSITION_MS = 300

export default function ApplicationDetailDrawer({ applicationId, onClose }: ApplicationDetailDrawerProps) {
  const toast = useToast()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  // Start false so panel first renders off-screen (translate-x-full), then we flip to true so it slides in
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
  } = useApplicationDetail(applicationId, { onDeleteSuccess: onClose })

  // When applicationId is set, defer "open" by one frame so panel renders off-screen first, then slides in
  useEffect(() => {
    if (applicationId) {
      setIsPanelOpen(false)
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsPanelOpen(true))
      })
      return () => cancelAnimationFrame(id)
    } else {
      setIsPanelOpen(false)
    }
  }, [applicationId])

  const handleClose = useCallback(() => {
    if (closeTimeoutRef.current) window.clearTimeout(closeTimeoutRef.current)
    setIsPanelOpen(false)
    closeTimeoutRef.current = window.setTimeout(() => {
      closeTimeoutRef.current = null
      onClose()
    }, DRAWER_TRANSITION_MS)
  }, [onClose])

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) window.clearTimeout(closeTimeoutRef.current)
    }
  }, [])

  // Close drawer on escape key
  useEffect(() => {
    if (!applicationId) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [applicationId, handleClose])

  const handleEdit = () => setIsEditModalOpen(true)
  const handleCloseEditModal = () => setIsEditModalOpen(false)

  const handleUpdate = async (formData: UpdateApplicationFormData) => {
    updateApplication(formData, {
      onSuccess: () => {
        toast.showSuccess('Application updated successfully!')
        setTimeout(handleCloseEditModal, MODAL_CLOSE_DELAY)
      },
      onError: (err) => {
        toast.showError(err instanceof Error ? err.message : 'Failed to update application')
      },
    })
  }

  const handleDeleteClick = () => setIsDeleteDialogOpen(true)

  const handleDeleteConfirm = async () => {
    deleteApplication(undefined, {
      onSuccess: () => {
        toast.showSuccess('Application deleted successfully!')
        setIsDeleteDialogOpen(false)
      },
      onError: (err) => {
        toast.showError(err instanceof Error ? err.message : 'Failed to delete application')
        setIsDeleteDialogOpen(false)
      },
    })
  }

  if (!applicationId) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 ${
          isPanelOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Drawer panel - slides in from right (translate-x-full → translate-x-0) */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-2xl bg-white shadow-xl z-50 flex flex-col transition-transform duration-300 ease-out ${
          isPanelOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Application details"
      >
        <div className="flex-1 overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-end z-10">
            <button
              type="button"
              onClick={handleClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6">
            {loading && (
              <div className="py-12">
                <LoadingState message="Loading application details..." />
              </div>
            )}

            {error && !loading && (
              <ErrorMessage message={error} />
            )}

            {!loading && !error && application && (
              <>
                <ApplicationDetailHeader
                  onEdit={handleEdit}
                  onDelete={handleDeleteClick}
                  onBack={handleClose}
                  backLabel="Close"
                />

                <ApplicationDetailCards
                  application={application}
                  job={job}
                  company={company}
                  contact={contact}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Edit Application Modal */}
      <Modal isOpen={isEditModalOpen} onClose={handleCloseEditModal} title="Edit Application">
        {application && (
          <ApplicationForm
            application={application}
            job={job}
            company={company}
            contacts={contacts}
            onSubmit={handleUpdate}
            onCancel={handleCloseEditModal}
            isLoading={isUpdating}
          />
        )}
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
              : 'Are you sure you want to delete this application? This action cannot be undone.'
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  )
}
