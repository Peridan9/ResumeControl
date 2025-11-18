import { useState, useMemo } from 'react'
import {
  BuildingOfficeIcon,
  GlobeAltIcon,
  CalendarIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import type { Company } from '../../types'
import { nullStringToString, nullTimeToString } from '../../utils/helpers'
import DataTable, { Column } from '../ui/DataTable'

interface CompanyTableProps {
  companies: Company[]
  onEdit: (company: Company) => void
  onDelete: (id: number) => void
  emptyMessage?: string
  loading?: boolean
}

export default function CompanyTable({
  companies,
  onEdit,
  onDelete,
  emptyMessage = 'No companies found.',
  loading = false,
}: CompanyTableProps) {
  const [searchTerm, setSearchTerm] = useState('')

  // Filter companies based on search term
  const filteredCompanies = useMemo(() => {
    if (!searchTerm.trim()) {
      return companies
    }
    const term = searchTerm.toLowerCase()
    return companies.filter(
      (company) =>
        company.name.toLowerCase().includes(term) ||
        (company.website &&
          nullStringToString(company.website)?.toLowerCase().includes(term))
    )
  }, [companies, searchTerm])
  const handleDelete = (company: Company) => {
    if (window.confirm(`Are you sure you want to delete "${company.name}"?`)) {
      onDelete(company.id)
    }
  }

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return 'Invalid date'
    }
  }

  const columns: Column<Company>[] = [
    {
      key: 'name',
      header: (
        <div className="flex items-center space-x-1">
          <BuildingOfficeIcon className="w-4 h-4" />
          <span>Company Name</span>
        </div>
      ),
      render: (company) => (
        <span className="font-medium text-gray-900 whitespace-nowrap">{company.name}</span>
      ),
    },
    {
      key: 'website',
      header: (
        <div className="flex items-center space-x-1">
          <GlobeAltIcon className="w-4 h-4" />
          <span>Website</span>
        </div>
      ),
      render: (company) => {
        const website = nullStringToString(company.website)
        return website ? (
          <a
            href={website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800"
            onClick={(e) => e.stopPropagation()}
          >
            {website}
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
      render: (company) => {
        const createdAt = nullTimeToString(company.created_at)
        return <span className="text-gray-600">{formatDate(createdAt)}</span>
      },
    },
    {
      key: 'actions',
      header: <span>Actions</span>,
      render: (company) => (
        <div className="flex items-center justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onEdit(company)}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit company"
            aria-label="Edit company"
          >
            <PencilIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleDelete(company)}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete company"
            aria-label="Delete company"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      ),
      className: 'text-right',
    },
  ]

  const filterContent = (
    <div className="space-y-3">
      <div>
        <label htmlFor="company-search" className="block text-sm font-medium text-gray-700 mb-1">
          Search Companies
        </label>
        <input
          type="text"
          id="company-search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name or website..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {searchTerm && (
        <p className="text-sm text-gray-600">
          Showing {filteredCompanies.length} of {companies.length} companies
        </p>
      )}
    </div>
  )

  return (
    <DataTable
      data={filteredCompanies}
      columns={columns}
      emptyMessage={searchTerm ? 'No companies match your search.' : emptyMessage}
      rowKey={(company) => company.id}
      loading={loading}
      filter={filterContent}
      filterLabel="Filter Companies"
    />
  )
}

