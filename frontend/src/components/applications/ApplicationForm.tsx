import type { Application, Job, Company, Contact } from '../../types'
import Button from '../ui/Button'
import ErrorMessage from '../ui/ErrorMessage'
import { STATUS_OPTIONS } from '../../constants/status'
import { useApplicationForm } from '../../hooks/useApplicationForm'
import { useJobPostingUrlFetch } from '../../hooks/useJobPostingUrlFetch'

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

export default function ApplicationForm({
  application,
  job,
  company,
  contacts = [],
  onSubmit,
  onCancel,
  isLoading = false,
}: ApplicationFormProps) {
  // Ensure contacts is always an array (handle null/undefined from React Query)
  const safeContacts = contacts || []

  // Use custom hook for form logic
  const { formData, error, updateField, handleSubmit } = useApplicationForm({
    application,
    job,
    company,
    onSubmit,
  })

  // Job posting URL fetch (Create mode only) — PER-78
  const isCreateMode = !application
  const urlFetch = useJobPostingUrlFetch()

  const handleCancel = () => {
    // Keep draft in sessionStorage when canceling (user might reopen)
    onCancel()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error && (
        <div role="alert" aria-live="polite">
          <ErrorMessage message={error} variant="compact" />
        </div>
      )}

      {/* Job posting URL (Create only) — PER-78 */}
      {isCreateMode && (
        <div className="space-y-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 p-4">
          <label htmlFor="jobPostingUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Job posting URL <span className="text-gray-500 text-xs">(optional)</span>
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            We&apos;ll try to load the page from your browser; some sites block this.
          </p>
          <div className="flex gap-2">
            <input
              type="url"
              id="jobPostingUrl"
              name="jobPostingUrl"
              value={urlFetch.url}
              onChange={(e) => urlFetch.setUrl(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="Paste job posting URL to fetch content"
              disabled={isLoading}
              aria-label="Job posting URL (optional)"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => urlFetch.fetchHtml()}
              disabled={isLoading || urlFetch.fetchStatus === 'loading' || !urlFetch.url.trim()}
            >
              {urlFetch.fetchStatus === 'loading' ? 'Loading…' : 'Fetch HTML'}
            </Button>
          </div>
          {urlFetch.fetchStatus === 'loading' && (
            <p className="text-sm text-gray-600 dark:text-gray-400">Loading…</p>
          )}
          {urlFetch.fetchStatus === 'success' && urlFetch.fetchedMeta && (
            <div className="text-sm text-gray-700 dark:text-gray-300 mt-2 p-3 rounded border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
              <p className="font-medium text-green-800 dark:text-green-200">
                Fetched {urlFetch.fetchedMeta.byteCount.toLocaleString()} bytes.
              </p>
              <p className="mt-1 text-gray-600 dark:text-gray-400 line-clamp-3">
                Preview: {urlFetch.fetchedMeta.textSnippet || '(no text content)'}
              </p>
            </div>
          )}
          {urlFetch.fetchStatus === 'error' && urlFetch.fetchError && (
            <div className="mt-2">
              <ErrorMessage message={urlFetch.fetchError} variant="compact" />
            </div>
          )}
        </div>
      )}

      {/* Company Name */}
      <div>
        <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Company Name <span className="text-red-500" aria-label="required">*</span>
        </label>
        <input
          type="text"
          id="companyName"
          name="companyName"
          value={formData.companyName}
          onChange={(e) => updateField('companyName', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          placeholder="Enter company name"
          required
          disabled={isLoading}
          aria-required="true"
          aria-invalid={error ? 'true' : 'false'}
        />
      </div>

      {/* Job Title */}
      <div>
        <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Job Title <span className="text-red-500" aria-label="required">*</span>
        </label>
        <input
          type="text"
          id="jobTitle"
          name="jobTitle"
          value={formData.jobTitle}
          onChange={(e) => updateField('jobTitle', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          placeholder="Enter job title"
          required
          disabled={isLoading}
          aria-required="true"
        />
      </div>

      {/* Job Description */}
      <div>
        <label htmlFor="jobDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Job Description <span className="text-gray-500 text-xs">(optional)</span>
        </label>
        <textarea
          id="jobDescription"
          name="jobDescription"
          value={formData.jobDescription}
          onChange={(e) => updateField('jobDescription', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          placeholder="Enter job description"
          disabled={isLoading}
          aria-label="Job description (optional)"
        />
      </div>

      {/* Job Requirements */}
      <div>
        <label htmlFor="jobRequirements" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Job Requirements <span className="text-gray-500 text-xs">(optional)</span>
        </label>
        <textarea
          id="jobRequirements"
          name="jobRequirements"
          value={formData.jobRequirements}
          onChange={(e) => updateField('jobRequirements', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          placeholder="Enter job requirements"
          disabled={isLoading}
          aria-label="Job requirements (optional)"
        />
      </div>

      {/* Job Location */}
      <div>
        <label htmlFor="jobLocation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Job Location <span className="text-gray-500 text-xs">(optional)</span>
        </label>
        <input
          type="text"
          id="jobLocation"
          name="jobLocation"
          value={formData.jobLocation}
          onChange={(e) => updateField('jobLocation', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          placeholder="Enter job location"
          disabled={isLoading}
          aria-label="Job location (optional)"
        />
      </div>

      {/* Status */}
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Status <span className="text-red-500" aria-label="required">*</span>
        </label>
        <select
          id="status"
          name="status"
          value={formData.status}
          onChange={(e) => updateField('status', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          required
          disabled={isLoading}
          aria-required="true"
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
        <label htmlFor="appliedDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Applied Date <span className="text-red-500" aria-label="required">*</span>
        </label>
        <input
          type="date"
          id="appliedDate"
          name="appliedDate"
          value={formData.appliedDate}
          onChange={(e) => updateField('appliedDate', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          required
          disabled={isLoading}
          aria-required="true"
        />
      </div>

      {/* Contact */}
      <div>
        <label htmlFor="contactId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Contact <span className="text-gray-500 text-xs">(optional)</span>
        </label>
        <select
          id="contactId"
          name="contactId"
          value={formData.contactId}
          onChange={(e) => updateField('contactId', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          disabled={isLoading}
          aria-label="Contact (optional)"
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
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Notes <span className="text-gray-500 text-xs">(optional)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={(e) => updateField('notes', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          placeholder="Enter any additional notes"
          disabled={isLoading}
          aria-label="Notes (optional)"
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

