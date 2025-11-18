import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { contactsAPI } from '../services/api'
import type { Contact, CreateContactRequest, UpdateContactRequest } from '../types'
import ContactTable from '../components/contacts/ContactTable'
import ContactForm from '../components/contacts/ContactForm'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'

export default function Contacts() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)

  // Fetch contacts using React Query
  const {
    data: contacts = [],
    isLoading: loading,
    error: contactsError,
  } = useQuery<Contact[]>({
    queryKey: ['contacts'],
    queryFn: () => contactsAPI.getAll(),
  })

  const error = contactsError ? (contactsError instanceof Error ? contactsError.message : 'Failed to fetch contacts') : null

  const handleCreate = () => {
    setEditingContact(null)
    setIsModalOpen(true)
  }

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingContact(null)
  }

  // Mutation for creating/updating contact
  const saveContactMutation = useMutation({
    mutationFn: async (data: { contact: Contact | null; formData: CreateContactRequest | UpdateContactRequest }) => {
      if (data.contact) {
        // Update existing contact
        return await contactsAPI.update(data.contact.id, data.formData as UpdateContactRequest)
      } else {
        // Create new contact
        return await contactsAPI.create(data.formData as CreateContactRequest)
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate and refetch contacts
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      
      setSuccessMessage(variables.contact ? 'Contact updated successfully!' : 'Contact created successfully!')
      setMutationError(null)
      handleCloseModal()

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null)
      }, 3000)
    },
    onError: (err) => {
      setMutationError(err instanceof Error ? err.message : 'Failed to save contact')
    },
  })

  // Mutation for deleting contact
  const deleteContactMutation = useMutation({
    mutationFn: async (id: number) => {
      return await contactsAPI.delete(id)
    },
    onSuccess: () => {
      // Invalidate and refetch contacts
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      
      setSuccessMessage('Contact deleted successfully!')
      setMutationError(null)

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null)
      }, 3000)
    },
    onError: (err) => {
      setMutationError(err instanceof Error ? err.message : 'Failed to delete contact')
      setTimeout(() => {
        setMutationError(null)
      }, 5000)
    },
  })

  const handleSubmit = async (data: CreateContactRequest | UpdateContactRequest) => {
    saveContactMutation.mutate({ contact: editingContact, formData: data })
  }

  const handleDelete = async (id: number) => {
    deleteContactMutation.mutate(id)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
        <Button variant="primary" onClick={handleCreate}>
          Add Contact
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

      {/* Contacts Table */}
      <ContactTable
        contacts={contacts}
        onEdit={handleEdit}
        onDelete={handleDelete}
        emptyMessage={
          (!contacts || contacts.length === 0) && !loading
            ? 'No contacts found. Create your first contact to get started.'
            : 'No contacts found.'
        }
        loading={loading}
      />

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingContact ? 'Edit Contact' : 'Create New Contact'}
      >
        <ContactForm
          contact={editingContact}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
          isLoading={saveContactMutation.isPending}
        />
      </Modal>
    </div>
  )
}

