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
    onSuccess: () => {
      // Invalidate and refetch companies
      queryClient.invalidateQueries({ queryKey: ['companies'] })
    },
  })

  // Mutation for deleting company
  const deleteCompanyMutation = useMutation({
    mutationFn: async (id: number) => {
      return await companiesAPI.delete(id)
    },
    onSuccess: () => {
      // Invalidate and refetch companies
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

