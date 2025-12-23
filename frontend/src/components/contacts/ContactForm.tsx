import { useState, FormEvent } from 'react'
import type { Contact, CreateContactRequest, UpdateContactRequest } from '../../types'
import Button from '../ui/Button'
import ErrorMessage from '../ui/ErrorMessage'

interface ContactFormProps {
  contact?: Contact | null
  onSubmit: (data: CreateContactRequest | UpdateContactRequest) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export default function ContactForm({
  contact,
  onSubmit,
  onCancel,
  isLoading = false,
}: ContactFormProps) {
  const [name, setName] = useState(contact?.name || '')
  const [email, setEmail] = useState(contact?.email || '')
  const [phone, setPhone] = useState(contact?.phone || '')
  const [linkedin, setLinkedin] = useState(contact?.linkedin || '')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Contact name is required')
      return
    }

    try {
      const data: CreateContactRequest | UpdateContactRequest = {
        name: name.trim(),
        ...(email.trim() && { email: email.trim() }),
        ...(phone.trim() && { phone: phone.trim() }),
        ...(linkedin.trim() && { linkedin: linkedin.trim() }),
      }
      await onSubmit(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save contact')
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
          Name <span className="text-red-500" aria-label="required">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          placeholder="Enter contact name"
          required
          disabled={isLoading}
          aria-required="true"
          aria-invalid={error ? 'true' : 'false'}
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Email <span className="text-gray-500 text-xs">(optional)</span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          placeholder="email@example.com"
          disabled={isLoading}
          aria-label="Email (optional)"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Phone <span className="text-gray-500 text-xs">(optional)</span>
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          placeholder="+1 (555) 123-4567"
          disabled={isLoading}
          aria-label="Phone (optional)"
        />
      </div>

      <div>
        <label htmlFor="linkedin" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          LinkedIn <span className="text-gray-500 text-xs">(optional)</span>
        </label>
        <input
          type="url"
          id="linkedin"
          name="linkedin"
          value={linkedin}
          onChange={(e) => setLinkedin(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          placeholder="https://linkedin.com/in/username"
          disabled={isLoading}
          aria-label="LinkedIn (optional)"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={isLoading}>
          {isLoading ? 'Saving...' : contact ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  )
}

