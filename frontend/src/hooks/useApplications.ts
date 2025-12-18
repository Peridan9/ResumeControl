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
      const job = await jobsAPI.create({
        application_id: application.id,
        company_id: company.id,
        title: formData.jobTitle,
        description: formData.jobDescription,
        requirements: formData.jobRequirements,
        location: formData.jobLocation,
      })

      return { application, company, job }
    },
    onMutate: async (formData) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['applications'] })
      await queryClient.cancelQueries({ queryKey: ['jobs'] })
      await queryClient.cancelQueries({ queryKey: ['companies'] })

      // Snapshot the previous values
      const previousApplications = queryClient.getQueryData<Application[]>(['applications'])
      const previousJobs = queryClient.getQueryData<Job[]>(['jobs'])
      const previousCompanies = queryClient.getQueryData<Company[]>(['companies'])

      // Create optimistic IDs
      const tempCompanyId = Date.now()
      const tempApplicationId = Date.now() + 1
      const tempJobId = Date.now() + 2

      // Create optimistic company
      const optimisticCompany: Company = {
        id: tempCompanyId,
        name: formData.companyName,
        website: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // Create optimistic application
      const optimisticApplication: Application = {
        id: tempApplicationId,
        status: formData.status,
        applied_date: formData.appliedDate,
        contact_id: formData.contactId || null,
        notes: formData.notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // Create optimistic job
      const optimisticJob: Job = {
        id: tempJobId,
        application_id: tempApplicationId,
        company_id: tempCompanyId,
        title: formData.jobTitle,
        description: formData.jobDescription || null,
        requirements: formData.jobRequirements || null,
        location: formData.jobLocation || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // Optimistically update all caches
      queryClient.setQueryData<Company[]>(['companies'], (old = []) => [...old, optimisticCompany])
      queryClient.setQueryData<Application[]>(['applications'], (old = []) => [...old, optimisticApplication])
      queryClient.setQueryData<Job[]>(['jobs'], (old = []) => [...old, optimisticJob])

      // Return context with snapshots and temp IDs
      return {
        previousApplications,
        previousJobs,
        previousCompanies,
        tempCompanyId,
        tempApplicationId,
        tempJobId,
      }
    },
    onError: (_err, _formData, context) => {
      // If the mutation fails, roll back all optimistic updates
      if (context?.previousApplications) {
        queryClient.setQueryData(['applications'], context.previousApplications)
      }
      if (context?.previousJobs) {
        queryClient.setQueryData(['jobs'], context.previousJobs)
      }
      if (context?.previousCompanies) {
        queryClient.setQueryData(['companies'], context.previousCompanies)
      }
    },
    onSuccess: (data, _formData, context) => {
      // Replace optimistic entries with real ones from server
      if (context) {
        // Replace optimistic company
        queryClient.setQueryData<Company[]>(['companies'], (old = []) =>
          old.map((company) => (company.id === context.tempCompanyId ? data.company : company))
        )

        // Replace optimistic application
        queryClient.setQueryData<Application[]>(['applications'], (old = []) =>
          old.map((app) => (app.id === context.tempApplicationId ? data.application : app))
        )

        // Replace optimistic job
        queryClient.setQueryData<Job[]>(['jobs'], (old = []) =>
          old.map((job) => (job.id === context.tempJobId ? data.job : job))
        )
      }

      // Invalidate to ensure we have the latest data
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
    onMutate: async (id) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['applications'] })
      await queryClient.cancelQueries({ queryKey: ['jobs'] })

      // Snapshot the previous values
      const previousApplications = queryClient.getQueryData<Application[]>(['applications'])
      const previousJobs = queryClient.getQueryData<Job[]>(['jobs'])

      // Find the application to delete to get its job
      const applicationToDelete = previousApplications?.find((app) => app.id === id)
      const jobToDelete = previousJobs?.find((job) => job.application_id === id)

      // Optimistically remove the application
      queryClient.setQueryData<Application[]>(['applications'], (old = []) =>
        old.filter((app) => app.id !== id)
      )

      // Optimistically remove the associated job
      if (jobToDelete) {
        queryClient.setQueryData<Job[]>(['jobs'], (old = []) =>
          old.filter((job) => job.id !== jobToDelete.id)
        )
      }

      // Return context with snapshots
      return { previousApplications, previousJobs, applicationToDelete, jobToDelete }
    },
    onError: (_err, _id, context) => {
      // If the mutation fails, roll back all optimistic updates
      if (context?.previousApplications) {
        queryClient.setQueryData(['applications'], context.previousApplications)
      }
      if (context?.previousJobs) {
        queryClient.setQueryData(['jobs'], context.previousJobs)
      }
    },
    onSuccess: () => {
      // Invalidate to ensure we have the latest data
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

