import { useState, FormEvent, useEffect, useRef } from 'react'
import type { Application, Job, Company } from '../../types'
import { nullStringToString } from '../../utils/helpers'
import Button from '../ui/Button'

interface ApplicationFormProps {
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
    notes?: string
  }) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

const STATUS_OPTIONS = [
  { value: 'applied', label: 'Applied' },
  { value: 'interview', label: 'Interview' },
  { value: 'offer', label: 'Offer' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
  { value: 'accepted', label: 'Accepted' },
]

const STORAGE_KEY = 'applicationFormDraft'

interface FormDraft {
  companyName: string
  jobTitle: string
  jobDescription: string
  jobRequirements: string
  jobLocation: string
  status: string
  appliedDate: string
  notes: string
}

export default function ApplicationForm({
  application,
  job,
  company,
  onSubmit,
  onCancel,
  isLoading = false,
}: ApplicationFormProps) {
  const isEditMode = !!application

  // Helper to get default date
  const getDefaultDate = () => {
    if (application?.applied_date) {
      return application.applied_date.split('T')[0]
    }
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  // Load draft from sessionStorage on mount (only for create mode)
  const loadDraft = (): Partial<FormDraft> | null => {
    if (isEditMode) return null // Don't load draft in edit mode
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY)
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (error) {
      console.error('Failed to load draft from sessionStorage:', error)
    }
    return null
  }

  // Save draft to sessionStorage (only for create mode)
  const saveDraft = (data: FormDraft) => {
    if (isEditMode) return // Don't save draft in edit mode
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save draft to sessionStorage:', error)
    }
  }

  // Clear draft from sessionStorage
  const clearDraft = () => {
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('Failed to clear draft from sessionStorage:', error)
    }
  }

  // Initialize form values: use application data if editing, otherwise use draft or defaults
  const draft = loadDraft()
  const [companyName, setCompanyName] = useState(
    isEditMode && company ? company.name : draft?.companyName || ''
  )
  const [jobTitle, setJobTitle] = useState(
    isEditMode && job ? job.title : draft?.jobTitle || ''
  )
  const [jobDescription, setJobDescription] = useState(
    isEditMode && job ? nullStringToString(job.description) || '' : draft?.jobDescription || ''
  )
  const [jobRequirements, setJobRequirements] = useState(
    isEditMode && job ? nullStringToString(job.requirements) || '' : draft?.jobRequirements || ''
  )
  const [jobLocation, setJobLocation] = useState(
    isEditMode && job ? nullStringToString(job.location) || '' : draft?.jobLocation || ''
  )
  const [status, setStatus] = useState(
    isEditMode && application ? application.status : draft?.status || 'applied'
  )
  const [appliedDate, setAppliedDate] = useState(
    isEditMode ? getDefaultDate() : draft?.appliedDate || getDefaultDate()
  )
  const [notes, setNotes] = useState(
    isEditMode && application ? nullStringToString(application.notes) || '' : draft?.notes || ''
  )
  const [error, setError] = useState<string | null>(null)

  // Debounce timer ref
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-save to sessionStorage on field changes (debounced)
  useEffect(() => {
    // Clear existing timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }

    // Set new timer to save after 300ms of no changes
    saveTimerRef.current = setTimeout(() => {
      saveDraft({
        companyName,
        jobTitle,
        jobDescription,
        jobRequirements,
        jobLocation,
        status,
        appliedDate,
        notes,
      })
    }, 300)

    // Cleanup timer on unmount
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
    }
  }, [companyName, jobTitle, jobDescription, jobRequirements, jobLocation, status, appliedDate, notes])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!companyName.trim()) {
      setError('Company name is required')
      return
    }

    if (!jobTitle.trim()) {
      setError('Job title is required')
      return
    }

    if (!status) {
      setError('Status is required')
      return
    }

    if (!appliedDate) {
      setError('Applied date is required')
      return
    }

    try {
      await onSubmit({
        companyName: companyName.trim(),
        jobTitle: jobTitle.trim(),
        jobDescription: jobDescription.trim() || undefined,
        jobRequirements: jobRequirements.trim() || undefined,
        jobLocation: jobLocation.trim() || undefined,
        status,
        appliedDate,
        notes: notes.trim() || undefined,
      })

      // Clear draft after successful submission
      clearDraft()

      // Reset form fields
      setCompanyName('')
      setJobTitle('')
      setJobDescription('')
      setJobRequirements('')
      setJobLocation('')
      setStatus('applied')
      setAppliedDate(getDefaultDate())
      setNotes('')
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
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
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
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
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
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
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
          value={jobRequirements}
          onChange={(e) => setJobRequirements(e.target.value)}
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
          value={jobLocation}
          onChange={(e) => setJobLocation(e.target.value)}
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
          value={status}
          onChange={(e) => setStatus(e.target.value)}
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
          value={appliedDate}
          onChange={(e) => setAppliedDate(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          disabled={isLoading}
        />
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Notes (optional)
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
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

