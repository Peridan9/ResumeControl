import { useNavigate } from 'react-router-dom'
import {
  BuildingOfficeIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline'
import type { Application, Job, Company, Contact } from '../../types'
import { nullTimeToString, nullStringToString } from '../../utils/helpers'
import Tooltip from '../ui/Tooltip'

interface ApplicationTableProps {
  applications: Application[]
  jobs: Job[]
  companies: Company[]
  contacts?: Contact[] | null
  emptyMessage?: string
}

export default function ApplicationTable({
  applications,
  jobs,
  companies,
  contacts = [],
  emptyMessage = 'No applications found',
}: ApplicationTableProps) {
  const navigate = useNavigate()

  // Helper function to get job by application ID
  const getJob = (applicationId: number): Job | undefined => {
    return jobs.find((job) => job.application_id === applicationId)
  }

  // Helper function to get company by ID
  const getCompany = (companyId: number): Company | undefined => {
    return companies.find((company) => company.id === companyId)
  }

  // Helper function to get contact by ID
  // Handles contact_id which can be number, null, or { Int32: number, Valid: boolean }
  const getContact = (contactId: number | null | undefined | { Int32: number; Valid: boolean }): Contact | undefined => {
    if (!contactId || !contacts) return undefined
    
    // Handle sql.NullInt32 format: { Int32: number, Valid: boolean }
    let actualContactId: number | null = null
    if (typeof contactId === 'number' && contactId > 0) {
      actualContactId = contactId
    } else if (typeof contactId === 'object' && 'Int32' in contactId && 'Valid' in contactId) {
      if (contactId.Valid && contactId.Int32 > 0) {
        actualContactId = contactId.Int32
      }
    }
    
    if (!actualContactId) return undefined
    return contacts.find((contact) => contact.id === actualContactId)
  }

  // Helper function to get notes text
  const getNotesText = (notes: string | null | { String: string; Valid: boolean }): string | null => {
    return nullStringToString(notes)
  }

  const handleRowClick = (applicationId: number) => {
    navigate(`/applications/${applicationId}`)
  }

  // Helper function to format date
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

  // Helper function to format null time
  const formatNullTime = (nullTime: string | null | { Time: string; Valid: boolean }): string => {
    if (nullTime === null) {
      return 'N/A'
    }
    const timeStr = nullTimeToString(nullTime)
    return formatDate(timeStr)
  }

  if (!applications || applications.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <p className="text-gray-600">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center space-x-1">
                  <BuildingOfficeIcon className="w-4 h-4" />
                  <span>Company</span>
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center space-x-1">
                  <BriefcaseIcon className="w-4 h-4" />
                  <span>Position</span>
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center space-x-1">
                  <CheckCircleIcon className="w-4 h-4" />
                  <span>Status</span>
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center space-x-1">
                  <CalendarIcon className="w-4 h-4" />
                  <span>Applied Date</span>
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center space-x-1">
                  <ClockIcon className="w-4 h-4" />
                  <span>Last Updated</span>
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center space-x-1">
                  <UserIcon className="w-4 h-4" />
                  <span>Contact</span>
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center space-x-1">
                  <DocumentTextIcon className="w-4 h-4" />
                  <span>Notes</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {applications?.map((application) => {
              const job = getJob(application.id)
              const company = job ? getCompany(job.company_id) : undefined
              const contact = getContact(application.contact_id)
              const notesText = getNotesText(application.notes)
              const hasNotes = notesText && notesText.trim() !== ''

              return (
                <tr
                  key={application.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleRowClick(application.id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {company?.name || 'Unknown Company'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {job?.title || 'Unknown Job'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {application.status}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(application.applied_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatNullTime(application.updated_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {contact?.name || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {hasNotes ? (
                      <Tooltip content={notesText} position="left" maxWidth="max">
                        <DocumentTextIcon className="w-5 h-5 text-gray-500 hover:text-gray-700 cursor-pointer" />
                      </Tooltip>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

