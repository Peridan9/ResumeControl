import { useState, FormEvent } from 'react'
import type { Application, Job, Company, Contact } from '../types'
import { useFormDraft } from './useFormDraft'
import { DEBOUNCE_DELAY } from '../constants/timing'

const STORAGE_KEY = 'applicationFormDraft'

export interface FormData {
  companyName: string
  jobTitle: string
  jobDescription: string
  jobRequirements: string
  jobLocation: string
  status: string
  appliedDate: string
  contactId: string
  notes: string
}

export interface UseApplicationFormProps {
  application?: Application | null
  job?: Job | null
  company?: Company | null
  onSubmit: (data: {
    companyName: string
    jobTitle: string
    jobDescription?: string
    jobRequirements?: string
    jobLocation?: string
    status: string
    appliedDate: string
    contactId?: number | null
    notes?: string
  }) => Promise<void>
}

export interface UseApplicationFormReturn {
  formData: FormData
  error: string | null
  updateField: <K extends keyof FormData>(field: K, value: FormData[K]) => void
  handleSubmit: (e: FormEvent) => Promise<void>
  resetForm: () => void
}

/**
 * Custom hook for managing ApplicationForm state and logic
 * Handles form state, validation, draft persistence, and submission
 */
export function useApplicationForm({
  application,
  job,
  company,
  onSubmit,
}: UseApplicationFormProps): UseApplicationFormReturn {
  const isEditMode = !!application
  const [error, setError] = useState<string | null>(null)

  // Helper to get default date
  const getDefaultDate = (): string => {
    if (application?.applied_date) {
      return application.applied_date.split('T')[0]
    }
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  // Helper to extract contact_id from application
  const getContactIdFromApplication = (app: Application | null | undefined): string => {
    if (!app || !app.contact_id) return ''
    return String(app.contact_id)
  }

  // Initialize default form values
  const getInitialFormData = (): FormData => {
    if (isEditMode) {
      return {
        companyName: company?.name || '',
        jobTitle: job?.title || '',
        jobDescription: job?.description || '',
        jobRequirements: job?.requirements || '',
        jobLocation: job?.location || '',
        status: application?.status || 'applied',
        appliedDate: getDefaultDate(),
        contactId: getContactIdFromApplication(application),
        notes: application?.notes || '',
      }
    }
    return {
      companyName: '',
      jobTitle: '',
      jobDescription: '',
      jobRequirements: '',
      jobLocation: '',
      status: 'applied',
      appliedDate: getDefaultDate(),
      contactId: '',
      notes: '',
    }
  }

  // Use form draft hook for managing form state and sessionStorage
  const { formData, updateField, resetForm: resetFormDraft } = useFormDraft<FormData>(
    STORAGE_KEY,
    getInitialFormData(),
    isEditMode,
    DEBOUNCE_DELAY
  )

  // Validation logic
  const validateForm = (): string | null => {
    if (!formData.companyName.trim()) {
      return 'Company name is required'
    }

    if (!formData.jobTitle.trim()) {
      return 'Job title is required'
    }

    if (!formData.status) {
      return 'Status is required'
    }

    if (!formData.appliedDate) {
      return 'Applied date is required'
    }

    return null
  }

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate form
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      // Convert contactId: empty string or invalid number should be null
      let contactIdValue: number | null = null
      if (formData.contactId && formData.contactId.trim()) {
        const parsed = Number(formData.contactId.trim())
        if (!isNaN(parsed) && parsed > 0) {
          contactIdValue = parsed
        }
      }

      await onSubmit({
        companyName: formData.companyName.trim(),
        jobTitle: formData.jobTitle.trim(),
        jobDescription: formData.jobDescription.trim() || undefined,
        jobRequirements: formData.jobRequirements.trim() || undefined,
        jobLocation: formData.jobLocation.trim() || undefined,
        status: formData.status,
        appliedDate: formData.appliedDate,
        contactId: contactIdValue,
        notes: formData.notes.trim() || undefined,
      })

      // Clear draft and reset form after successful submission
      resetFormDraft()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save application')
      // Don't clear draft on error - user can retry
    }
  }

  // Reset form wrapper that also clears error
  const resetForm = () => {
    setError(null)
    resetFormDraft()
  }

  return {
    formData,
    error,
    updateField,
    handleSubmit,
    resetForm,
  }
}

