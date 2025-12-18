import { useState, FormEvent } from 'react'
import type { Application, Job, Company, Contact } from '../../types'
import { nullStringToString } from '../../utils/helpers'
import Button from '../ui/Button'
import { STATUS_OPTIONS } from '../../constants/status'
import { DEBOUNCE_DELAY } from '../../constants/timing'
import { useFormDraft } from '../../hooks/useFormDraft'

interface ApplicationFormProps {
  application?: Application | null
  job?: Job | null
  company?: Company | null
  contacts?: Contact[]
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
  onCancel: () => void
  isLoading?: boolean
}

const STORAGE_KEY = 'applicationFormDraft'

interface FormData {
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

export default function ApplicationForm({
  application,
  job,
  company,
  contacts = [],
  onSubmit,
  onCancel,
  isLoading = false,
}: ApplicationFormProps) {
  const isEditMode = !!application
  
  // Ensure contacts is always an array (handle null/undefined from React Query)
  const safeContacts = contacts || []

  // Helper to get default date
  const getDefaultDate = () => {
    if (application?.applied_date) {
      return application.applied_date.split('T')[0]
    }
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  // Helper to extract contact_id from application (handles number, null, or sql.NullInt32 format)
  const getContactIdFromApplication = (app: Application | null | undefined): string => {
    if (!app || !app.contact_id) return ''
    const contactId = app.contact_id
    // Handle sql.NullInt32 format: { Int32: number, Valid: boolean }
    if (typeof contactId === 'object' && 'Int32' in contactId && 'Valid' in contactId) {
      return contactId.Valid && contactId.Int32 > 0 ? String(contactId.Int32) : ''
    }
    // Handle number format
    if (typeof contactId === 'number' && contactId > 0) {
      return String(contactId)
    }
    return ''
  }

  // Initialize default form values
  const getInitialFormData = (): FormData => {
    if (isEditMode) {
      return {
        companyName: company?.name || '',
        jobTitle: job?.title || '',
        jobDescription: job ? nullStringToString(job.description) || '' : '',
        jobRequirements: job ? nullStringToString(job.requirements) || '' : '',
        jobLocation: job ? nullStringToString(job.location) || '' : '',
        status: application?.status || 'applied',
        appliedDate: getDefaultDate(),
        contactId: getContactIdFromApplication(application),
        notes: application ? nullStringToString(application.notes) || '' : '',
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
  const { formData, updateField, clearDraft, resetForm } = useFormDraft<FormData>(
    STORAGE_KEY,
    getInitialFormData(),
    isEditMode,
    DEBOUNCE_DELAY
  )

  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!formData.companyName.trim()) {
      setError('Company name is required')
      return
    }

    if (!formData.jobTitle.trim()) {
      setError('Job title is required')
      return
    }

    if (!formData.status) {
      setError('Status is required')
      return
    }

    if (!formData.appliedDate) {
      setError('Applied date is required')
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
      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save application')
      // Don't clear draft on error - user can retry
    }
  }

  const handleCancel = () => {
    // Keep draft in sessionStorage when canceling (user might reopen)
    onCancel()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Company Name */}
      <div>
        <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
          Company Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="companyName"
          value={formData.companyName}
          onChange={(e) => updateField('companyName', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter company name"
          required
          disabled={isLoading}
        />
      </div>

      {/* Job Title */}
      <div>
        <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-1">
          Job Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="jobTitle"
          value={formData.jobTitle}
          onChange={(e) => updateField('jobTitle', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter job title"
          required
          disabled={isLoading}
        />
      </div>

      {/* Job Description */}
      <div>
        <label htmlFor="jobDescription" className="block text-sm font-medium text-gray-700 mb-1">
          Job Description (optional)
        </label>
        <textarea
          id="jobDescription"
          value={formData.jobDescription}
          onChange={(e) => updateField('jobDescription', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter job description"
          disabled={isLoading}
        />
      </div>

      {/* Job Requirements */}
      <div>
        <label htmlFor="jobRequirements" className="block text-sm font-medium text-gray-700 mb-1">
          Job Requirements (optional)
        </label>
        <textarea
          id="jobRequirements"
          value={formData.jobRequirements}
          onChange={(e) => updateField('jobRequirements', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter job requirements"
          disabled={isLoading}
        />
      </div>

      {/* Job Location */}
      <div>
        <label htmlFor="jobLocation" className="block text-sm font-medium text-gray-700 mb-1">
          Job Location (optional)
        </label>
        <input
          type="text"
          id="jobLocation"
          value={formData.jobLocation}
          onChange={(e) => updateField('jobLocation', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter job location"
          disabled={isLoading}
        />
      </div>

      {/* Status */}
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
          Status <span className="text-red-500">*</span>
        </label>
        <select
          id="status"
          value={formData.status}
          onChange={(e) => updateField('status', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          disabled={isLoading}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Applied Date */}
      <div>
        <label htmlFor="appliedDate" className="block text-sm font-medium text-gray-700 mb-1">
          Applied Date <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          id="appliedDate"
          value={formData.appliedDate}
          onChange={(e) => updateField('appliedDate', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          disabled={isLoading}
        />
      </div>

      {/* Contact */}
      <div>
        <label htmlFor="contactId" className="block text-sm font-medium text-gray-700 mb-1">
          Contact (optional)
        </label>
        <select
          id="contactId"
          value={formData.contactId}
          onChange={(e) => updateField('contactId', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        >
          <option value="">No contact</option>
          {safeContacts.map((contact) => (
            <option key={contact.id} value={contact.id}>
              {contact.name}
            </option>
          ))}
        </select>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Notes (optional)
        </label>
        <textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => updateField('notes', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter any additional notes"
          disabled={isLoading}
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={handleCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={isLoading}>
          {isLoading ? 'Saving...' : application ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  )
}

