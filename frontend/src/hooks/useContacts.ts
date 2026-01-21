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
    onError: (_err, _data, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousContacts) {
        queryClient.setQueryData(['contacts'], context.previousContacts)
      }
    },
    onSuccess: (newContact, data, context) => {
      // If creating, replace the optimistic contact (with temp ID) with the real one from server
      if (!data.contact && context && 'tempId' in context) {
        queryClient.setQueryData<Contact[]>(['contacts'], (old = []) =>
          old.map((contact) => (contact.id === (context as { tempId: number }).tempId ? newContact : contact))
        )
      }
      // Invalidate to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
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
    onError: (_err, _id, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousContacts) {
        queryClient.setQueryData(['contacts'], context.previousContacts)
      }
    },
    onSuccess: () => {
      // Invalidate to ensure we have the latest data
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

