import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BuildingOfficeIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  DocumentTextIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import type { Application, Job, Company, Contact } from '../../types'
import Tooltip from '../ui/Tooltip'
import DataTable, { Column } from '../ui/DataTable'
import ConfirmDialog from '../ui/ConfirmDialog'
import { STATUS_OPTIONS_WITH_ALL } from '../../constants/status'
import StatusBadge from '../ui/StatusBadge'
import { formatDate } from '../../utils/date'

interface ApplicationTableProps {
  applications: Application[]
  jobs: Job[]
  companies: Company[]
  contacts?: Contact[] | null
  emptyMessage?: string
  loading?: boolean
  statusFilter?: string
  onStatusFilterChange?: (status: string) => void
  /** When provided, row click calls this instead of navigating to detail page (e.g. to open a drawer) */
  onRowClick?: (application: Application) => void
  onEdit?: (application: Application) => void
  onDelete?: (id: number) => void
  isDeleting?: boolean
}

export const STATUS_OPTIONS = STATUS_OPTIONS_WITH_ALL

export default function ApplicationTable({
  applications,
  jobs,
  companies,
  contacts = [],
  emptyMessage = 'No applications found',
  loading = false,
  statusFilter = '',
  onStatusFilterChange,
  onRowClick: onRowClickProp,
  onEdit,
  onDelete,
  isDeleting = false,
}: ApplicationTableProps) {
  const navigate = useNavigate()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [applicationToDelete, setApplicationToDelete] = useState<Application | null>(null)

  const handleDelete = (application: Application) => {
    if (onDelete) {
      setApplicationToDelete(application)
      setIsDeleteDialogOpen(true)
    }
  }

  const handleDeleteConfirm = () => {
    if (onDelete && applicationToDelete) {
      onDelete(applicationToDelete.id)
      setIsDeleteDialogOpen(false)
      setApplicationToDelete(null)
    }
  }

  // Helper function to get job by application ID
  const getJob = (applicationId: number): Job | undefined => {
    return jobs.find((job) => job.application_id === applicationId)
  }

  // Helper function to get company by ID
  const getCompany = (companyId: number): Company | undefined => {
    return companies.find((company) => company.id === companyId)
  }

  // Helper function to get contact by ID
  const getContact = (contactId: number | null | undefined): Contact | undefined => {
    if (!contactId || !contacts) return undefined
    return contacts.find((contact) => contact.id === contactId)
  }

  // Helper function to get notes text
  const getNotesText = (notes: string | null): string | null => {
    return notes
  }

  const handleRowClick = (application: Application) => {
    if (onRowClickProp) {
      onRowClickProp(application)
    } else {
      navigate(`/applications/${application.id}`)
    }
  }


  const columns: Column<Application>[] = [
    {
      key: 'company',
      header: (
        <div className="flex items-center space-x-1">
          <BuildingOfficeIcon className="w-4 h-4" />
          <span>Company</span>
        </div>
      ),
      render: (application) => {
        const job = getJob(application.id)
        const company = job ? getCompany(job.company_id) : undefined
        return (
          <span className="font-medium text-gray-900 whitespace-nowrap">
            {company?.name || 'Unknown Company'}
          </span>
        )
      },
    },
    {
      key: 'position',
      header: (
        <div className="flex items-center space-x-1">
          <BriefcaseIcon className="w-4 h-4" />
          <span>Position</span>
        </div>
      ),
      render: (application) => {
        const job = getJob(application.id)
        return (
          <div className="max-w-[200px] truncate" title={job?.title || 'Unknown Job'}>
            <span className="text-gray-900">{job?.title || 'Unknown Job'}</span>
          </div>
        )
      },
      className: 'max-w-[200px]',
    },
    {
      key: 'status',
      header: (
        <div className="flex items-center space-x-1">
          <CheckCircleIcon className="w-4 h-4" />
          <span>Status</span>
        </div>
      ),
      render: (application) => (
        <StatusBadge status={application.status} size="sm" />
      ),
    },
    {
      key: 'appliedDate',
      header: (
        <div className="flex items-center space-x-1">
          <CalendarIcon className="w-4 h-4" />
          <span>Applied Date</span>
        </div>
      ),
      render: (application) => (
        <span className="text-gray-600 whitespace-nowrap">{formatDate(application.applied_date)}</span>
      ),
    },
    {
      key: 'lastUpdated',
      header: (
        <div className="flex items-center space-x-1">
          <ClockIcon className="w-4 h-4" />
          <span>Last Updated</span>
        </div>
      ),
      render: (application) => (
        <span className="text-gray-600 whitespace-nowrap">{formatDate(application.updated_at)}</span>
      ),
    },
    {
      key: 'contact',
      header: (
        <div className="flex items-center space-x-1">
          <UserIcon className="w-4 h-4" />
          <span>Contact</span>
        </div>
      ),
      render: (application) => {
        const contact = getContact(application.contact_id)
        return contact?.name || <span className="text-gray-300">—</span>
      },
    },
    {
      key: 'notes',
      header: (
        <div className="flex items-center space-x-1">
          <DocumentTextIcon className="w-4 h-4" />
          <span>Notes</span>
        </div>
      ),
      render: (application) => {
        const notesText = getNotesText(application.notes)
        const hasNotes = notesText && notesText.trim() !== ''
        return hasNotes ? (
          <Tooltip content={notesText} position="left" maxWidth="max">
            <DocumentTextIcon className="w-5 h-5 text-gray-500 hover:text-gray-700 cursor-pointer" />
          </Tooltip>
        ) : (
          <span className="text-gray-300">—</span>
        )
      },
    },
    ...(onEdit || onDelete
      ? [
          {
            key: 'actions',
            header: <span>Actions</span>,
            render: (application: Application) => (
              <div className="flex items-center justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                {onEdit && (
                  <button
                    onClick={() => onEdit(application)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit application"
                    aria-label="Edit application"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => handleDelete(application)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete application"
                    aria-label="Delete application"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
            ),
            className: 'text-right',
          } as Column<Application>,
        ]
      : []),
  ]

  // Filter content for DataTable
  const filterContent = onStatusFilterChange ? (
    <div className="space-y-3">
      <div>
        <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">
          Filter by Status
        </label>
        <select
          id="statusFilter"
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      {statusFilter && (
        <p className="text-sm text-gray-600">
          Showing {applications.length} application{applications.length !== 1 ? 's' : ''} with status "{STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label}"
        </p>
      )}
    </div>
  ) : undefined

  return (
    <>
      <DataTable
        data={applications}
        columns={columns}
        emptyMessage={emptyMessage}
        rowKey={(application) => application.id}
        loading={loading}
        onRowClick={handleRowClick}
        filter={filterContent}
        filterLabel="Filter Applications"
      />
      {onDelete && (
        <ConfirmDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => {
            setIsDeleteDialogOpen(false)
            setApplicationToDelete(null)
          }}
          onConfirm={handleDeleteConfirm}
          title="Delete Application"
          message={
            applicationToDelete
              ? (() => {
                  const job = getJob(applicationToDelete.id)
                  const company = job ? getCompany(job.company_id) : undefined
                  const jobTitle = job?.title || 'Unknown Position'
                  const companyName = company?.name || 'Unknown Company'
                  return `Are you sure you want to delete the application for "${jobTitle}" at "${companyName}"? This action cannot be undone.`
                })()
              : 'Are you sure you want to delete this application? This action cannot be undone.'
          }
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
          isLoading={isDeleting}
        />
      )}
    </>
  )
}
