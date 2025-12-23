import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  LinkIcon,
  CalendarIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import type { Contact } from '../../types'
import DataTable, { Column } from '../ui/DataTable'
import ConfirmDialog from '../ui/ConfirmDialog'
import { formatDate } from '../../utils/date'

interface ContactTableProps {
  contacts: Contact[]
  onEdit: (contact: Contact) => void
  onDelete: (id: number) => void
  emptyMessage?: string
  loading?: boolean
  isDeleting?: boolean
}

export default function ContactTable({
  contacts,
  onEdit,
  onDelete,
  emptyMessage = 'No contacts found.',
  loading = false,
  isDeleting = false,
}: ContactTableProps) {
  const navigate = useNavigate()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null)

  const handleDelete = (contact: Contact) => {
    setContactToDelete(contact)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (contactToDelete) {
      onDelete(contactToDelete.id)
      setIsDeleteDialogOpen(false)
      setContactToDelete(null)
    }
  }

  const handleRowClick = (contact: Contact) => {
    navigate(`/contacts/${contact.id}`)
  }

  const columns: Column<Contact>[] = [
    {
      key: 'name',
      header: (
        <div className="flex items-center space-x-1">
          <UserIcon className="w-4 h-4" />
          <span>Name</span>
        </div>
      ),
      render: (contact) => (
        <span className="font-medium text-gray-900 whitespace-nowrap">{contact.name}</span>
      ),
    },
    {
      key: 'email',
      header: (
        <div className="flex items-center space-x-1">
          <EnvelopeIcon className="w-4 h-4" />
          <span>Email</span>
        </div>
      ),
      render: (contact) => {
        const email = contact.email
        return email ? (
          <a
            href={`mailto:${email}`}
            className="text-blue-600 hover:text-blue-800"
            onClick={(e) => e.stopPropagation()}
          >
            {email}
          </a>
        ) : (
          <span className="text-gray-300">—</span>
        )
      },
    },
    {
      key: 'phone',
      header: (
        <div className="flex items-center space-x-1">
          <PhoneIcon className="w-4 h-4" />
          <span>Phone</span>
        </div>
      ),
      render: (contact) => {
        const phone = contact.phone
        return phone ? (
          <a
            href={`tel:${phone}`}
            className="text-blue-600 hover:text-blue-800"
            onClick={(e) => e.stopPropagation()}
          >
            {phone}
          </a>
        ) : (
          <span className="text-gray-300">—</span>
        )
      },
    },
    {
      key: 'linkedin',
      header: (
        <div className="flex items-center space-x-1">
          <LinkIcon className="w-4 h-4" />
          <span>LinkedIn</span>
        </div>
      ),
      render: (contact) => {
        const linkedin = contact.linkedin
        return linkedin ? (
          <a
            href={linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800"
            onClick={(e) => e.stopPropagation()}
          >
            {linkedin}
          </a>
        ) : (
          <span className="text-gray-300">—</span>
        )
      },
    },
    {
      key: 'created',
      header: (
        <div className="flex items-center space-x-1">
          <CalendarIcon className="w-4 h-4" />
          <span>Created</span>
        </div>
      ),
      render: (contact) => {
        const createdAt = contact.created_at
        return <span className="text-gray-600">{formatDate(createdAt)}</span>
      },
    },
    {
      key: 'actions',
      header: <span>Actions</span>,
      render: (contact) => (
        <div className="flex items-center justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onEdit(contact)}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit contact"
            aria-label="Edit contact"
          >
            <PencilIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleDelete(contact)}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete contact"
            aria-label="Delete contact"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      ),
      className: 'text-right',
    },
  ]

  return (
    <>
      <DataTable
        data={contacts}
        columns={columns}
        emptyMessage={emptyMessage}
        rowKey={(contact) => contact.id}
        loading={loading}
        onRowClick={handleRowClick}
      />
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false)
          setContactToDelete(null)
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Contact"
        message={`Are you sure you want to delete "${contactToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  )
}

