import { useState } from 'react'
import type { Company } from '../../types'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'
import { formatDateDefault } from '../../utils/date'

interface CompanyCardProps {
  company: Company
  onEdit: (company: Company) => void
  onDelete: (id: number) => void
  isDeleting?: boolean
}

export default function CompanyCard({ company, onEdit, onDelete, isDeleting = false }: CompanyCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const handleDelete = () => {
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    onDelete(company.id)
    setIsDeleteDialogOpen(false)
  }

  const website = company.website
  const createdAt = company.created_at

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {company.name}
            </h3>
            {website && (
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                {website}
              </a>
            )}
            {createdAt && (
              <p className="text-xs text-gray-500 mt-2">
                Created: {formatDateDefault(createdAt)}
              </p>
            )}
          </div>
          <div className="flex space-x-2 ml-4">
            <Button variant="secondary" onClick={() => onEdit(company)}>
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
        title="Delete Company"
        message={`Are you sure you want to delete "${company.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  )
}

