import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { applicationsAPI, jobsAPI, companiesAPI, contactsAPI } from '../services/api'
import type { Application, Job, Company, Contact } from '../types'
import { MODAL_CLOSE_DELAY } from '../constants/timing'

export interface UpdateApplicationFormData {
  companyName: string
  jobTitle: string
  jobDescription?: string
  jobRequirements?: string
  jobLocation?: string
  status: string
  appliedDate: string
  contactId?: number | null
  notes?: string
}

/**
 * Custom hook for managing application detail data and mutations
 * Extracts all data fetching and mutation logic from ApplicationDetail component
 */
export function useApplicationDetail(applicationId: number | null) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Fetch application detail
  const {
    data: application,
    isLoading: applicationLoading,
    error: applicationError,
  } = useQuery<Application>({
    queryKey: ['application', applicationId],
    queryFn: () => {
      if (!applicationId) throw new Error('Invalid application ID')
      return applicationsAPI.getById(applicationId)
    },
    enabled: !!applicationId,
  })

  // Fetch job by application ID
  const {
    data: job,
    isLoading: jobLoading,
  } = useQuery<Job>({
    queryKey: ['job', 'by-application', applicationId],
    queryFn: () => {
      if (!applicationId) throw new Error('Invalid application ID')
      return applicationsAPI.getJobByApplicationId(applicationId)
    },
    enabled: !!applicationId && !!application,
  })

  // Fetch company
  const {
    data: company,
    isLoading: companyLoading,
  } = useQuery<Company>({
    queryKey: ['company', job?.company_id],
    queryFn: () => {
      if (!job?.company_id) throw new Error('Invalid company ID')
      return companiesAPI.getById(job.company_id)
    },
    enabled: !!job?.company_id,
  })

  // Extract contact ID from application
  const contactId = useMemo(() => {
    if (!application?.contact_id) return null
    const cid = application.contact_id
    if (typeof cid === 'number' && cid > 0) return cid
    if (typeof cid === 'object' && cid !== null && 'Int32' in cid && 'Valid' in cid) {
      const typedCid = cid as { Valid: boolean; Int32: number }
      if (typedCid.Valid && typedCid.Int32 > 0) return typedCid.Int32
    }
    return null
  }, [application?.contact_id])

  // Fetch contact if contact_id exists
  const {
    data: contact,
  } = useQuery<Contact>({
    queryKey: ['contact', contactId],
    queryFn: () => {
      if (!contactId) throw new Error('Invalid contact ID')
      return contactsAPI.getById(contactId)
    },
    enabled: !!contactId,
    retry: false, // Don't retry if contact doesn't exist
  })

  // Fetch all contacts for the form dropdown (uses cache if already fetched)
  const {
    data: contacts = [],
  } = useQuery<Contact[]>({
    queryKey: ['contacts'],
    queryFn: () => contactsAPI.getAll(),
  })

  const loading = applicationLoading || jobLoading || companyLoading
  const error = applicationError
    ? (applicationError instanceof Error ? applicationError.message : 'Failed to fetch application details')
    : !applicationId
    ? 'Invalid application ID'
    : null

  // Mutation for updating application
  const updateApplicationMutation = useMutation({
    mutationFn: async (formData: UpdateApplicationFormData) => {
      if (!application || !job || !company) throw new Error('Missing required data')

      // Step 1: Update company if name changed
      let updatedCompany = company
      if (formData.companyName !== company.name) {
        updatedCompany = await companiesAPI.update(company.id, {
          name: formData.companyName,
        })
      }

      // Step 2: Update job
      const updatedJob = await jobsAPI.update(job.id, {
        title: formData.jobTitle,
        description: formData.jobDescription,
        requirements: formData.jobRequirements,
        location: formData.jobLocation,
      })

      // Step 3: Update application
      const updatedApplication = await applicationsAPI.update(application.id, {
        status: formData.status,
        applied_date: formData.appliedDate,
        contact_id: formData.contactId ?? null,
        notes: formData.notes,
      })

      return { updatedApplication, updatedJob, updatedCompany }
    },
    onMutate: async (formData) => {
      if (!application || !job || !company) return

      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['application', applicationId] })
      await queryClient.cancelQueries({ queryKey: ['job', 'by-application', applicationId] })
      await queryClient.cancelQueries({ queryKey: ['company', job.company_id] })
      await queryClient.cancelQueries({ queryKey: ['applications'] })
      await queryClient.cancelQueries({ queryKey: ['jobs'] })
      await queryClient.cancelQueries({ queryKey: ['companies'] })

      // Snapshot the previous values
      const previousApplication = queryClient.getQueryData<Application>(['application', applicationId])
      const previousJob = queryClient.getQueryData<Job>(['job', 'by-application', applicationId])
      const previousCompany = queryClient.getQueryData<Company>(['company', job.company_id])
      const previousApplications = queryClient.getQueryData<Application[]>(['applications'])
      const previousJobs = queryClient.getQueryData<Job[]>(['jobs'])
      const previousCompanies = queryClient.getQueryData<Company[]>(['companies'])

      // Optimistically update application
      const optimisticApplication: Application = {
        ...application,
        status: formData.status,
        applied_date: formData.appliedDate,
        contact_id: formData.contactId ?? null,
        notes: formData.notes || null,
        updated_at: new Date().toISOString(),
      }
      queryClient.setQueryData<Application>(['application', applicationId], optimisticApplication)

      // Optimistically update job
      const optimisticJob: Job = {
        ...job,
        title: formData.jobTitle,
        description: formData.jobDescription || null,
        requirements: formData.jobRequirements || null,
        location: formData.jobLocation || null,
        updated_at: new Date().toISOString(),
      }
      queryClient.setQueryData<Job>(['job', 'by-application', applicationId], optimisticJob)

      // Optimistically update company if name changed
      if (formData.companyName !== company.name) {
        const optimisticCompany: Company = {
          ...company,
          name: formData.companyName,
          updated_at: new Date().toISOString(),
        }
        queryClient.setQueryData<Company>(['company', job.company_id], optimisticCompany)
      }

      // Optimistically update lists
      if (previousApplications) {
        queryClient.setQueryData<Application[]>(['applications'], (old = []) =>
          old.map((app) => (app.id === application.id ? optimisticApplication : app))
        )
      }
      if (previousJobs) {
        queryClient.setQueryData<Job[]>(['jobs'], (old = []) =>
          old.map((j) => (j.id === job.id ? optimisticJob : j))
        )
      }
      if (previousCompanies && formData.companyName !== company.name) {
        queryClient.setQueryData<Company[]>(['companies'], (old = []) =>
          old.map((c) => (c.id === company.id ? { ...company, name: formData.companyName, updated_at: new Date().toISOString() } : c))
        )
      }

      // Return context with snapshots
      return {
        previousApplication,
        previousJob,
        previousCompany,
        previousApplications,
        previousJobs,
        previousCompanies,
      }
    },
    onError: (_err, _formData, context) => {
      // If the mutation fails, roll back all optimistic updates
      if (context?.previousApplication) {
        queryClient.setQueryData(['application', applicationId], context.previousApplication)
      }
      if (context?.previousJob) {
        queryClient.setQueryData(['job', 'by-application', applicationId], context.previousJob)
      }
      if (context?.previousCompany) {
        queryClient.setQueryData(['company', job?.company_id], context.previousCompany)
      }
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
    onSuccess: (data) => {
      // Update with real data from server
      queryClient.setQueryData<Application>(['application', applicationId], data.updatedApplication)
      queryClient.setQueryData<Job>(['job', 'by-application', applicationId], data.updatedJob)
      if (data.updatedCompany.id !== company?.id || data.updatedCompany.name !== company?.name) {
        queryClient.setQueryData<Company>(['company', data.updatedCompany.id], data.updatedCompany)
      }

      // Invalidate to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ['application', applicationId] })
      queryClient.invalidateQueries({ queryKey: ['job', 'by-application', applicationId] })
      queryClient.invalidateQueries({ queryKey: ['company', job?.company_id] })
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      if (contactId) {
        queryClient.invalidateQueries({ queryKey: ['contact', contactId] })
      }
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })

  // Mutation for deleting application
  const deleteApplicationMutation = useMutation({
    mutationFn: async () => {
      if (!application) throw new Error('No application to delete')
      return await applicationsAPI.delete(application.id)
    },
    onMutate: async () => {
      if (!application || !job) return

      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['applications'] })
      await queryClient.cancelQueries({ queryKey: ['jobs'] })

      // Snapshot the previous values
      const previousApplications = queryClient.getQueryData<Application[]>(['applications'])
      const previousJobs = queryClient.getQueryData<Job[]>(['jobs'])

      // Optimistically remove the application
      queryClient.setQueryData<Application[]>(['applications'], (old = []) =>
        old.filter((app) => app.id !== application.id)
      )

      // Optimistically remove the associated job
      queryClient.setQueryData<Job[]>(['jobs'], (old = []) =>
        old.filter((j) => j.id !== job.id)
      )

      // Return context with snapshots
      return { previousApplications, previousJobs }
    },
    onError: (_err, _variables, context) => {
      // If the mutation fails, roll back all optimistic updates
      if (context?.previousApplications) {
        queryClient.setQueryData(['applications'], context.previousApplications)
      }
      if (context?.previousJobs) {
        queryClient.setQueryData(['jobs'], context.previousJobs)
      }
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      
      // Navigate back to applications list
      navigate('/applications')
    },
  })

  return {
    // Data
    application,
    job,
    company,
    contact,
    contacts,
    loading,
    error,
    // Mutations
    updateApplication: updateApplicationMutation.mutate,
    deleteApplication: deleteApplicationMutation.mutate,
    isUpdating: updateApplicationMutation.isPending,
    isDeleting: deleteApplicationMutation.isPending,
    updateError: updateApplicationMutation.error,
    deleteError: deleteApplicationMutation.error,
    // Utility
    MODAL_CLOSE_DELAY,
  }
}

