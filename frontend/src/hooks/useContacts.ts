import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { contactsAPI } from '../services/api'
import type { Contact, CreateContactRequest, UpdateContactRequest } from '../types'

/**
 * Custom hook for managing contacts data
 * Provides query for contacts and mutations for creating, updating, and deleting
 */
export function useContacts() {
  const queryClient = useQueryClient()

  // Fetch contacts using React Query
  const {
    data: contacts = [],
    isLoading: loading,
    error: contactsError,
  } = useQuery<Contact[]>({
    queryKey: ['contacts'],
    queryFn: () => contactsAPI.getAll(),
  })

  const error = contactsError
    ? (contactsError instanceof Error ? contactsError.message : 'Failed to fetch contacts')
    : null

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
    onSuccess: () => {
      // Invalidate and refetch contacts
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
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
    },
  })

  return {
    // Data
    contacts,
    loading,
    error,
    // Mutations
    saveContact: saveContactMutation.mutate,
    deleteContact: deleteContactMutation.mutate,
    isSaving: saveContactMutation.isPending,
    isDeleting: deleteContactMutation.isPending,
    saveError: saveContactMutation.error,
    deleteError: deleteContactMutation.error,
  }
}

