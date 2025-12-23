import { useState, FormEvent } from 'react'
import type { Company, CreateCompanyRequest, UpdateCompanyRequest } from '../../types'
import Button from '../ui/Button'
import ErrorMessage from '../ui/ErrorMessage'

interface CompanyFormProps {
  company?: Company | null
  onSubmit: (data: CreateCompanyRequest | UpdateCompanyRequest) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export default function CompanyForm({
  company,
  onSubmit,
  onCancel,
  isLoading = false,
}: CompanyFormProps) {
  const [name, setName] = useState(company?.name || '')
  const [website, setWebsite] = useState(company?.website || '')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Company name is required')
      return
    }

    try {
      const data: CreateCompanyRequest | UpdateCompanyRequest = {
        name: name.trim(),
        ...(website.trim() && { website: website.trim() }),
      }
      await onSubmit(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save company')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error && (
        <div role="alert" aria-live="polite">
          <ErrorMessage message={error} variant="compact" />
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Company Name <span className="text-red-500" aria-label="required">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          placeholder="Enter company name"
          required
          disabled={isLoading}
          aria-required="true"
          aria-invalid={error ? 'true' : 'false'}
        />
      </div>

      <div>
        <label htmlFor="website" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Website <span className="text-gray-500 text-xs">(optional)</span>
        </label>
        <input
          type="url"
          id="website"
          name="website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          placeholder="https://example.com"
          disabled={isLoading}
          aria-label="Website (optional)"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={isLoading}>
          {isLoading ? 'Saving...' : company ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  )
}

