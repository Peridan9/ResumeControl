import { useState, FormEvent } from 'react'
import type { Contact, CreateContactRequest, UpdateContactRequest } from '../../types'
import { nullStringToString } from '../../utils/helpers'
import Button from '../ui/Button'

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
  const [email, setEmail] = useState(
    contact ? nullStringToString(contact.email) || '' : ''
  )
  const [phone, setPhone] = useState(
    contact ? nullStringToString(contact.phone) || '' : ''
  )
  const [linkedin, setLinkedin] = useState(
    contact ? nullStringToString(contact.linkedin) || '' : ''
  )
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter contact name"
          required
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email (optional)
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="email@example.com"
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
          Phone (optional)
        </label>
        <input
          type="tel"
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="+1 (555) 123-4567"
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="linkedin" className="block text-sm font-medium text-gray-700 mb-1">
          LinkedIn (optional)
        </label>
        <input
          type="url"
          id="linkedin"
          value={linkedin}
          onChange={(e) => setLinkedin(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="https://linkedin.com/in/username"
          disabled={isLoading}
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

