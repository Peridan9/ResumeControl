import { useState } from 'react'
import type { Contact } from '../../types'
import { nullStringToString, nullTimeToString } from '../../utils/helpers'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'

interface ContactCardProps {
  contact: Contact
  onEdit: (contact: Contact) => void
  onDelete: (id: number) => void
  isDeleting?: boolean
}

export default function ContactCard({ contact, onEdit, onDelete, isDeleting = false }: ContactCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const handleDelete = () => {
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    onDelete(contact.id)
    setIsDeleteDialogOpen(false)
  }

  const email = nullStringToString(contact.email)
  const phone = nullStringToString(contact.phone)
  const linkedin = nullStringToString(contact.linkedin)
  const createdAt = nullTimeToString(contact.created_at)

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{contact.name}</h3>
            <div className="space-y-1 text-sm text-gray-600">
              {email && (
                <div>
                  <span className="font-medium">Email:</span>{' '}
                  <a href={`mailto:${email}`} className="text-blue-600 hover:text-blue-800">
                    {email}
                  </a>
                </div>
              )}
              {phone && (
                <div>
                  <span className="font-medium">Phone:</span>{' '}
                  <a href={`tel:${phone}`} className="text-blue-600 hover:text-blue-800">
                    {phone}
                  </a>
                </div>
              )}
              {linkedin && (
                <div>
                  <span className="font-medium">LinkedIn:</span>{' '}
                  <a
                    href={linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {linkedin}
                  </a>
                </div>
              )}
            </div>
            {createdAt && (
              <p className="text-xs text-gray-500 mt-2">
                Created: {new Date(createdAt).toLocaleDateString()}
              </p>
            )}
          </div>
          <div className="flex space-x-2 ml-4">
            <Button variant="secondary" onClick={() => onEdit(contact)}>
              Edit
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>
      </div>
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Contact"
        message={`Are you sure you want to delete "${contact.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  )
}

