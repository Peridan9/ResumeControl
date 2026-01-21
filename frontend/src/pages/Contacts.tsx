import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { contactsAPI } from '../services/api'
import { useToast } from '../hooks/useToast'
import type { Contact, CreateContactRequest, UpdateContactRequest } from '../types'
import ContactTable from '../components/contacts/ContactTable'
import ContactForm from '../components/contacts/ContactForm'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import ErrorMessage from '../components/ui/ErrorMessage'

export default function Contacts() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)

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
    onMutate: async (data) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['contacts'] })

      // Snapshot the previous value
      const previousContacts = queryClient.getQueryData<Contact[]>(['contacts'])

      // Optimistically update to the new value
      if (data.contact) {
        // Update existing contact
        queryClient.setQueryData<Contact[]>(['contacts'], (old = []) =>
          old.map((contact) =>
            contact.id === data.contact!.id
              ? { ...contact, ...data.formData, updated_at: new Date().toISOString() }
              : contact
          )
        )
        return { previousContacts }
      } else {
        // Create new contact - add temporary ID (will be replaced by server response)
        const tempId = Date.now()
        const optimisticContact: Contact = {
          id: tempId, // Temporary ID
          name: data.formData.name,
          email: data.formData.email ?? null,
          phone: data.formData.phone ?? null,
          linkedin: data.formData.linkedin ?? null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        queryClient.setQueryData<Contact[]>(['contacts'], (old = []) => [...old, optimisticContact])
        // Store tempId in context for later replacement
        return { previousContacts, tempId }
      }
    },
    onError: (err, _data, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousContacts) {
        queryClient.setQueryData(['contacts'], context.previousContacts)
      }
      toast.showError(err instanceof Error ? err.message : 'Failed to save contact')
    },
    onSuccess: (newContact, variables, context) => {
      // If creating, replace the optimistic contact (with temp ID) with the real one from server
      if (!variables.contact && context && 'tempId' in context) {
        queryClient.setQueryData<Contact[]>(['contacts'], (old = []) =>
          old.map((contact) => (contact.id === (context as { tempId: number }).tempId ? newContact : contact))
        )
      }
      // Invalidate to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      
      toast.showSuccess(variables.contact ? 'Contact updated successfully!' : 'Contact created successfully!')
      handleCloseModal()
    },
  })

  // Mutation for deleting contact
  const deleteContactMutation = useMutation({
    mutationFn: async (id: number) => {
      return await contactsAPI.delete(id)
    },
    onMutate: async (id) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['contacts'] })

      // Snapshot the previous value
      const previousContacts = queryClient.getQueryData<Contact[]>(['contacts'])

      // Optimistically remove the contact
      queryClient.setQueryData<Contact[]>(['contacts'], (old = []) =>
        old.filter((contact) => contact.id !== id)
      )

      // Return a context object with the snapshotted value
      return { previousContacts }
    },
    onError: (err, _id, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousContacts) {
        queryClient.setQueryData(['contacts'], context.previousContacts)
      }
      toast.showError(err instanceof Error ? err.message : 'Failed to delete contact')
    },
    onSuccess: () => {
      // Invalidate to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      
      toast.showSuccess('Contact deleted successfully!')
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

      {/* Error Message - only for query errors, not mutations */}
      {error && (
        <div className="mb-4">
          <ErrorMessage message={error} />
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
        isDeleting={deleteContactMutation.isPending}
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

