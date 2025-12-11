import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { contactsAPI } from '../services/api'
import type { Contact, UpdateContactRequest } from '../types'
import { nullStringToString, nullTimeToString } from '../utils/helpers'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import ContactForm from '../components/contacts/ContactForm'

export default function ContactDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)

  const contactId = id ? parseInt(id, 10) : null

  // Fetch contact detail
  const {
    data: contact,
    isLoading: contactLoading,
    error: contactError,
  } = useQuery<Contact>({
    queryKey: ['contact', contactId],
    queryFn: () => {
      if (!contactId) throw new Error('Invalid contact ID')
      return contactsAPI.getById(contactId)
    },
    enabled: !!contactId,
  })

  const loading = contactLoading
  const error = contactError
    ? (contactError instanceof Error ? contactError.message : 'Failed to fetch contact details')
    : !contactId
    ? 'Invalid contact ID'
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

  const handleEdit = () => {
    setIsEditModalOpen(true)
    setSuccessMessage(null)
    setMutationError(null)
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
  }

  // Mutation for updating contact
  const updateContactMutation = useMutation({
    mutationFn: async (formData: UpdateContactRequest) => {
      if (!contact) throw new Error('Missing contact data')
      return await contactsAPI.update(contact.id, formData)
    },
    onSuccess: () => {
      // Invalidate and refetch contact query
      queryClient.invalidateQueries({ queryKey: ['contact', contactId] })
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      queryClient.invalidateQueries({ queryKey: ['applications'] })

      setSuccessMessage('Contact updated successfully!')
      setMutationError(null)

      // Close modal after a short delay to show success message
      setTimeout(() => {
        handleCloseEditModal()
        setSuccessMessage(null)
      }, 500)
    },
    onError: (err) => {
      setMutationError(err instanceof Error ? err.message : 'Failed to update contact')
    },
  })

  // Mutation for deleting contact
  const deleteContactMutation = useMutation({
    mutationFn: async () => {
      if (!contact) throw new Error('No contact to delete')
      return await contactsAPI.delete(contact.id)
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      queryClient.invalidateQueries({ queryKey: ['applications'] })

      // Navigate back to contacts list
      navigate('/contacts')
    },
    onError: (err) => {
      setMutationError(err instanceof Error ? err.message : 'Failed to delete contact')
      setIsDeleteDialogOpen(false)
    },
  })

  const handleUpdate = async (formData: UpdateContactRequest) => {
    updateContactMutation.mutate(formData)
  }

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    deleteContactMutation.mutate()
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Loading contact details...</p>
      </div>
    )
  }

  if (error || !contact) {
    return (
      <div>
        <Button variant="secondary" onClick={() => navigate('/contacts')} className="mb-4">
          ← Back to Contacts
        </Button>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error || 'Contact not found'}
        </div>
      </div>
    )
  }

  const contactEmail = nullStringToString(contact.email)
  const contactPhone = nullStringToString(contact.phone)
  const contactLinkedin = nullStringToString(contact.linkedin)
  const createdAt = nullTimeToString(contact.created_at)
  const updatedAt = nullTimeToString(contact.updated_at)

  return (
    <div>
      {/* Back Button */}
      <Button variant="secondary" onClick={() => navigate('/contacts')} className="mb-6">
        ← Back to Contacts
      </Button>

      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Contact Details</h1>
        <div className="flex space-x-3">
          <Button variant="primary" onClick={handleEdit}>
            Edit Contact
          </Button>
          <Button variant="danger" onClick={handleDeleteClick}>
            Delete Contact
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
        {/* Contact Information Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-500">Name</span>
              <p className="text-lg text-gray-900">{contact.name}</p>
            </div>
            {contactEmail && (
              <div>
                <span className="text-sm font-medium text-gray-500">Email</span>
                <p className="text-lg">
                  <a
                    href={`mailto:${contactEmail}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {contactEmail}
                  </a>
                </p>
              </div>
            )}
            {contactPhone && (
              <div>
                <span className="text-sm font-medium text-gray-500">Phone</span>
                <p className="text-lg">
                  <a
                    href={`tel:${contactPhone}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {contactPhone}
                  </a>
                </p>
              </div>
            )}
            {contactLinkedin && (
              <div>
                <span className="text-sm font-medium text-gray-500">LinkedIn</span>
                <p className="text-lg">
                  <a
                    href={contactLinkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {contactLinkedin}
                  </a>
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

      {/* Edit Contact Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        title="Edit Contact"
      >
        <ContactForm
          contact={contact}
          onSubmit={handleUpdate}
          onCancel={handleCloseEditModal}
          isLoading={updateContactMutation.isPending}
        />
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Contact"
        message={`Are you sure you want to delete "${contact.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteContactMutation.isPending}
      />
    </div>
  )
}

