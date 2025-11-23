import { useState, FormEvent } from 'react'
import type { Company, CreateCompanyRequest, UpdateCompanyRequest } from '../../types'
import { nullStringToString } from '../../utils/helpers'
import Button from '../ui/Button'

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
  const [website, setWebsite] = useState(
    company ? nullStringToString(company.website) || '' : ''
  )
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Company Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter company name"
          required
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
          Website (optional)
        </label>
        <input
          type="url"
          id="website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="https://example.com"
          disabled={isLoading}
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

