import { memo, useMemo } from 'react'
import type { Application, Job, Company, Contact } from '../../types'
import StatusBadge from '../ui/StatusBadge'
import { formatDateLong, formatDateTime } from '../../utils/date'

interface ApplicationDetailCardsProps {
  application: Application
  job: Job | undefined
  company: Company | undefined
  contact: Contact | undefined
}

/**
 * Company Information Card Component
 */
const CompanyCard = memo(({ company }: { company: Company | undefined }) => {
  const companyWebsite = useMemo(
    () => company?.website || '',
    [company?.website]
  )

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Company Information</h2>
      <div className="space-y-3">
        <div>
          <span className="text-sm font-medium text-gray-500">Company Name</span>
          <p className="text-lg text-gray-900">{company?.name || 'Unknown Company'}</p>
        </div>
        {companyWebsite && (
          <div>
            <span className="text-sm font-medium text-gray-500">Website</span>
            <p className="text-lg">
              <a
                href={companyWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
              >
                {companyWebsite}
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  )
})
CompanyCard.displayName = 'CompanyCard'

/**
 * Job Details Card Component
 */
const JobCard = memo(({ job }: { job: Job | undefined }) => {
  const jobDescription = useMemo(
    () => job?.description || '',
    [job?.description]
  )
  const jobRequirements = useMemo(
    () => job?.requirements || '',
    [job?.requirements]
  )
  const jobLocation = useMemo(
    () => job?.location || '',
    [job?.location]
  )

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Details</h2>
      <div className="space-y-3">
        <div>
          <span className="text-sm font-medium text-gray-500">Job Title</span>
          <p className="text-lg text-gray-900">{job?.title || 'Unknown Job'}</p>
        </div>
        {jobLocation && (
          <div>
            <span className="text-sm font-medium text-gray-500">Location</span>
            <p className="text-lg text-gray-900">{jobLocation}</p>
          </div>
        )}
        {jobDescription && (
          <div>
            <span className="text-sm font-medium text-gray-500">Description</span>
            <p className="text-gray-900 whitespace-pre-wrap">{jobDescription}</p>
          </div>
        )}
        {jobRequirements && (
          <div>
            <span className="text-sm font-medium text-gray-500">Requirements</span>
            <p className="text-gray-900 whitespace-pre-wrap">{jobRequirements}</p>
          </div>
        )}
      </div>
    </div>
  )
})
JobCard.displayName = 'JobCard'

/**
 * Contact Information Card Component
 */
const ContactCard = memo(({ contact }: { contact: Contact | undefined }) => {
  if (!contact) return null

  const email = useMemo(() => contact.email, [contact.email])
  const phone = useMemo(() => contact.phone, [contact.phone])
  const linkedin = useMemo(() => contact.linkedin, [contact.linkedin])

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
      <div className="space-y-3">
        <div>
          <span className="text-sm font-medium text-gray-500">Name</span>
          <p className="text-lg text-gray-900">{contact.name}</p>
        </div>
        {email && (
          <div>
            <span className="text-sm font-medium text-gray-500">Email</span>
            <p className="text-lg">
              <a
                href={`mailto:${email}`}
                className="text-blue-600 hover:text-blue-800"
              >
                {email}
              </a>
            </p>
          </div>
        )}
        {phone && (
          <div>
            <span className="text-sm font-medium text-gray-500">Phone</span>
            <p className="text-lg">
              <a
                href={`tel:${phone}`}
                className="text-blue-600 hover:text-blue-800"
              >
                {phone}
              </a>
            </p>
          </div>
        )}
        {linkedin && (
          <div>
            <span className="text-sm font-medium text-gray-500">LinkedIn</span>
            <p className="text-lg">
              <a
                href={linkedin || undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
              >
                {linkedin}
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  )
})
ContactCard.displayName = 'ContactCard'

/**
 * Application Details Card Component
 */
const ApplicationCard = memo(({ application }: { application: Application }) => {
  const notes = useMemo(() => application.notes, [application.notes])
  const createdAt = useMemo(() => application.created_at, [application.created_at])
  const updatedAt = useMemo(() => application.updated_at, [application.updated_at])
  const formattedAppliedDate = useMemo(
    () => formatDateLong(application.applied_date),
    [application.applied_date]
  )
  const formattedCreatedAt = useMemo(() => formatDateTime(createdAt), [createdAt])
  const formattedUpdatedAt = useMemo(() => formatDateTime(updatedAt), [updatedAt])

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Application Details</h2>
      <div className="space-y-3">
        <div>
          <span className="text-sm font-medium text-gray-500">Status</span>
          <p className="mt-1">
            <StatusBadge status={application.status} size="md" />
          </p>
        </div>
        <div>
          <span className="text-sm font-medium text-gray-500">Applied Date</span>
          <p className="text-lg text-gray-900">{formattedAppliedDate}</p>
        </div>
        {notes && (
          <div>
            <span className="text-sm font-medium text-gray-500">Notes</span>
            <p className="text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded mt-1">
              {notes}
            </p>
          </div>
        )}
        {createdAt && (
          <div>
            <span className="text-sm font-medium text-gray-500">Created</span>
            <p className="text-gray-900">{formattedCreatedAt}</p>
          </div>
        )}
        {updatedAt && (
          <div>
            <span className="text-sm font-medium text-gray-500">Last Updated</span>
            <p className="text-gray-900">{formattedUpdatedAt}</p>
          </div>
        )}
      </div>
    </div>
  )
})
ApplicationCard.displayName = 'ApplicationCard'

/**
 * Container component for all application detail cards
 * Renders Company, Job, Contact, and Application information cards
 */
export default function ApplicationDetailCards({
  application,
  job,
  company,
  contact,
}: ApplicationDetailCardsProps) {
  return (
    <div className="space-y-6">
      <CompanyCard company={company} />
      <JobCard job={job} />
      {contact && <ContactCard contact={contact} />}
      <ApplicationCard application={application} />
    </div>
  )
}

