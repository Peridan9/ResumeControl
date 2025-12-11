import React, { useState } from 'react'
import { FunnelIcon } from '@heroicons/react/24/outline'

export interface Column<T> {
  key: string
  header: string | React.ReactNode
  render: (item: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  emptyMessage?: string
  onRowClick?: (item: T) => void
  rowKey: (item: T) => string | number
  loading?: boolean
  filter?: React.ReactNode
  filterLabel?: string
}

export default function DataTable<T>({
  data,
  columns,
  emptyMessage = 'No data found',
  onRowClick,
  rowKey,
  loading = false,
  filter,
  filterLabel = 'Filter',
}: DataTableProps<T>) {
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
        <p className="text-gray-600 dark:text-gray-400">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      {/* Filter Toggle Button */}
      {filter && (
        <div className="border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="w-full px-6 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            aria-expanded={isFilterOpen}
            aria-label={filterLabel}
          >
            <div className="flex items-center space-x-2">
              <FunnelIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{filterLabel}</span>
            </div>
            <svg
              className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${
                isFilterOpen ? 'transform rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Collapsible Filter Content */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              isFilterOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
              {filter}
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${
                    column.className || ''
                  }`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {data.map((item) => (
              <tr
                key={rowKey(item)}
                className={`transition-colors ${
                  onRowClick ? 'hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer' : ''
                }`}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-6 py-4 text-sm text-gray-900 dark:text-gray-100 ${
                      column.className || ''
                    }`}
                  >
                    {column.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

