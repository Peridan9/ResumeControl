import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { companiesAPI } from '../services/api'
import type { Company, CreateCompanyRequest, UpdateCompanyRequest } from '../types'

/**
 * Custom hook for managing companies data
 * Provides query for companies and mutations for creating, updating, and deleting
 */
export function useCompanies() {
  const queryClient = useQueryClient()

  // Fetch companies using React Query
  const {
    data: companies = [],
    isLoading: loading,
    error: companiesError,
  } = useQuery<Company[]>({
    queryKey: ['companies'],
    queryFn: () => companiesAPI.getAll(),
  })

  const error = companiesError
    ? (companiesError instanceof Error ? companiesError.message : 'Failed to fetch companies')
    : null

  // Mutation for creating/updating company
  const saveCompanyMutation = useMutation({
    mutationFn: async (data: { company: Company | null; formData: CreateCompanyRequest | UpdateCompanyRequest }) => {
      if (data.company) {
        // Update existing company
        return await companiesAPI.update(data.company.id, data.formData as UpdateCompanyRequest)
      } else {
        // Create new company
        return await companiesAPI.create(data.formData as CreateCompanyRequest)
      }
    },
    onMutate: async (data) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['companies'] })

      // Snapshot the previous value
      const previousCompanies = queryClient.getQueryData<Company[]>(['companies'])

      // Optimistically update to the new value
      if (data.company) {
        // Update existing company
        queryClient.setQueryData<Company[]>(['companies'], (old = []) =>
          old.map((company) =>
            company.id === data.company!.id
              ? { ...company, ...data.formData, updated_at: new Date().toISOString() }
              : company
          )
        )
      } else {
        // Create new company - add temporary ID (will be replaced by server response)
        const tempId = Date.now()
        const optimisticCompany: Company = {
          id: tempId, // Temporary ID
          name: data.formData.name,
          website: data.formData.website ?? null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        queryClient.setQueryData<Company[]>(['companies'], (old = []) => [...old, optimisticCompany])
        // Store tempId in context for later replacement
        return { previousCompanies, tempId }
      }
    },
    onError: (err, data, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousCompanies) {
        queryClient.setQueryData(['companies'], context.previousCompanies)
      }
    },
    onSuccess: (newCompany, data, context) => {
      // If creating, replace the optimistic company (with temp ID) with the real one from server
      if (!data.company && context && 'tempId' in context) {
        queryClient.setQueryData<Company[]>(['companies'], (old = []) =>
          old.map((company) => (company.id === (context as { tempId: number }).tempId ? newCompany : company))
        )
      }
      // Invalidate to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ['companies'] })
    },
  })

  // Mutation for deleting company
  const deleteCompanyMutation = useMutation({
    mutationFn: async (id: number) => {
      return await companiesAPI.delete(id)
    },
    onMutate: async (id) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['companies'] })

      // Snapshot the previous value
      const previousCompanies = queryClient.getQueryData<Company[]>(['companies'])

      // Optimistically remove the company
      queryClient.setQueryData<Company[]>(['companies'], (old = []) =>
        old.filter((company) => company.id !== id)
      )

      // Return a context object with the snapshotted value
      return { previousCompanies }
    },
    onError: (err, id, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousCompanies) {
        queryClient.setQueryData(['companies'], context.previousCompanies)
      }
    },
    onSuccess: () => {
      // Invalidate to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ['companies'] })
    },
  })

  return {
    // Data
    companies,
    loading,
    error,
    // Mutations
    saveCompany: saveCompanyMutation.mutate,
    deleteCompany: deleteCompanyMutation.mutate,
    isSaving: saveCompanyMutation.isPending,
    isDeleting: deleteCompanyMutation.isPending,
    saveError: saveCompanyMutation.error,
    deleteError: deleteCompanyMutation.error,
  }
}

