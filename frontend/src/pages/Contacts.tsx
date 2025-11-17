import { useState, useEffect } from 'react'
import { contactsAPI } from '../services/api'
import type { Contact, CreateContactRequest, UpdateContactRequest } from '../types'
import ContactCard from '../components/contacts/ContactCard'
import ContactForm from '../components/contacts/ContactForm'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Fetch contacts on component mount
  useEffect(() => {
    fetchContacts()
  }, [])

  const fetchContacts = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await contactsAPI.getAll()
      setContacts(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch contacts')
      setContacts([]) // Set to empty array on error
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingContact(null)
    setIsModalOpen(true)
  }

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingContact(null)
  }

  const handleSubmit = async (data: CreateContactRequest | UpdateContactRequest) => {
    try {
      setIsSubmitting(true)
      setError(null)

      if (editingContact) {
        // Update existing contact
        await contactsAPI.update(editingContact.id, data as UpdateContactRequest)
        setSuccessMessage('Contact updated successfully!')
      } else {
        // Create new contact
        await contactsAPI.create(data as CreateContactRequest)
        setSuccessMessage('Contact created successfully!')
      }

      // Refresh contacts list
      await fetchContacts()
      handleCloseModal()

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null)
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save contact')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      setError(null)
      await contactsAPI.delete(id)
      setSuccessMessage('Contact deleted successfully!')
      await fetchContacts()

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null)
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete contact')
      setTimeout(() => {
        setError(null)
      }, 5000)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
        <Button variant="primary" onClick={handleCreate}>
          Add Contact
        </Button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading contacts...</p>
        </div>
      ) : !contacts || contacts.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-600 mb-4">No contacts found.</p>
          <Button variant="primary" onClick={handleCreate}>
            Create Your First Contact
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingContact ? 'Edit Contact' : 'Create New Contact'}
      >
        <ContactForm
          contact={editingContact}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
          isLoading={isSubmitting}
        />
      </Modal>
    </div>
  )
}

