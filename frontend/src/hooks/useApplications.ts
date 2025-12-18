import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { applicationsAPI, jobsAPI, companiesAPI, contactsAPI } from '../services/api'
import type { Application, Job, Company, Contact } from '../types'

/**
 * Custom hook for managing applications data
 * Provides queries for applications, jobs, companies, and contacts
 * Provides mutations for creating and deleting applications
 */
export function useApplications() {
  const queryClient = useQueryClient()

  // Fetch all data using React Query
  const {
    data: applications = [],
    isLoading: applicationsLoading,
    error: applicationsError,
  } = useQuery<Application[]>({
    queryKey: ['applications'],
    queryFn: () => applicationsAPI.getAll(),
  })

  const {
    data: jobs = [],
    isLoading: jobsLoading,
  } = useQuery<Job[]>({
    queryKey: ['jobs'],
    queryFn: () => jobsAPI.getAll(),
  })

  const {
    data: companies = [],
    isLoading: companiesLoading,
  } = useQuery<Company[]>({
    queryKey: ['companies'],
    queryFn: () => companiesAPI.getAll(),
  })

  const {
    data: contacts = [],
    isLoading: contactsLoading,
  } = useQuery<Contact[]>({
    queryKey: ['contacts'],
    queryFn: () => contactsAPI.getAll(),
  })

  const loading = applicationsLoading || jobsLoading || companiesLoading || contactsLoading
  const error = applicationsError
    ? (applicationsError instanceof Error ? applicationsError.message : 'Failed to fetch applications')
    : null

  // Mutation for creating application
  const createApplicationMutation = useMutation({
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
      // Step 1: Create/get company (get-or-create pattern)
      const company = await companiesAPI.create({
        name: formData.companyName,
      })

      // Step 2: Create application first (jobs now belong to applications)
      const application = await applicationsAPI.create({
        status: formData.status,
        applied_date: formData.appliedDate,
        contact_id: formData.contactId || null,
        notes: formData.notes,
      })

      // Step 3: Create job with application_id
      await jobsAPI.create({
        application_id: application.id,
        company_id: company.id,
        title: formData.jobTitle,
        description: formData.jobDescription,
        requirements: formData.jobRequirements,
        location: formData.jobLocation,
      })

      return application
    },
    onSuccess: () => {
      // Invalidate and refetch all related queries
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['companies'] })
    },
  })

  // Mutation for deleting application
  const deleteApplicationMutation = useMutation({
    mutationFn: async (id: number) => {
      return await applicationsAPI.delete(id)
    },
    onSuccess: () => {
      // Invalidate and refetch all related queries
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    },
  })

  return {
    // Data
    applications,
    jobs,
    companies,
    contacts,
    loading,
    error,
    // Mutations
    createApplication: createApplicationMutation.mutate,
    deleteApplication: deleteApplicationMutation.mutate,
    isCreating: createApplicationMutation.isPending,
    isDeleting: deleteApplicationMutation.isPending,
    createError: createApplicationMutation.error,
    deleteError: deleteApplicationMutation.error,
  }
}

