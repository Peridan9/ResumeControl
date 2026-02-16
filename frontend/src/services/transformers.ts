// API response transformers - normalize backend null types at the API boundary

// Backend types (as received from API)
type BackendNullString = string | null | { String: string; Valid: boolean }
type BackendNullTime = string | { Time: string; Valid: boolean }
type BackendNullInt32 = number | null | { Int32: number; Valid: boolean }

// Normalized types (what components should use)
type NormalizedString = string | null
type NormalizedTime = string | null
type NormalizedInt32 = number | null

/**
 * Normalizes a NullString value from backend to a simple string | null
 */
function normalizeNullString(value: BackendNullString): NormalizedString {
  if (value === null || value === undefined) {
    return null
  }
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'object' && 'String' in value && 'Valid' in value) {
    return value.Valid ? value.String : null
  }
  return null
}

/**
 * Normalizes a NullTime value from backend to a simple string | null
 */
function normalizeNullTime(value: BackendNullTime): NormalizedTime {
  if (value === null || value === undefined) {
    return null
  }
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'object' && 'Time' in value && 'Valid' in value) {
    return value.Valid ? value.Time : null
  }
  return null
}

/**
 * Normalizes a NullInt32 value from backend to a simple number | null
 */
function normalizeNullInt32(value: BackendNullInt32): NormalizedInt32 {
  if (value === null || value === undefined) {
    return null
  }
  if (typeof value === 'number') {
    return value
  }
  if (typeof value === 'object' && 'Int32' in value && 'Valid' in value) {
    return value.Valid ? value.Int32 : null
  }
  return null
}

// Backend entity types (as received from API)
// Exported for use in api.ts to provide type safety
export interface BackendCompany {
  id: number
  name: string
  website: BackendNullString
  created_at: BackendNullTime
  updated_at: BackendNullTime
}

export interface BackendJob {
  id: number
  application_id: number
  company_id: number
  title: string
  description: BackendNullString
  requirements: BackendNullString
  location: BackendNullString
  created_at: BackendNullTime
  updated_at: BackendNullTime
}

export interface BackendApplication {
  id: number
  contact_id?: BackendNullInt32
  status: string
  applied_date: string
  notes: BackendNullString
  created_at: BackendNullTime
  updated_at: BackendNullTime
}

export interface BackendContact {
  id: number
  name: string
  email: BackendNullString
  phone: BackendNullString
  linkedin: BackendNullString
  created_at: BackendNullTime
  updated_at: BackendNullTime
}

// Normalized entity types (exported for use in components)
export interface NormalizedCompany {
  id: number
  name: string
  website: NormalizedString
  created_at: NormalizedTime
  updated_at: NormalizedTime
}

export interface NormalizedJob {
  id: number
  application_id: number
  company_id: number
  title: string
  description: NormalizedString
  requirements: NormalizedString
  location: NormalizedString
  created_at: NormalizedTime
  updated_at: NormalizedTime
}

export interface NormalizedApplication {
  id: number
  contact_id?: NormalizedInt32
  status: string
  applied_date: string
  notes: NormalizedString
  created_at: NormalizedTime
  updated_at: NormalizedTime
}

export interface NormalizedContact {
  id: number
  name: string
  email: NormalizedString
  phone: NormalizedString
  linkedin: NormalizedString
  created_at: NormalizedTime
  updated_at: NormalizedTime
}

/**
 * Transforms a backend Company to a normalized Company
 */
export function transformCompany(company: BackendCompany): NormalizedCompany {
  return {
    id: company.id,
    name: company.name,
    website: normalizeNullString(company.website),
    created_at: normalizeNullTime(company.created_at),
    updated_at: normalizeNullTime(company.updated_at),
  }
}

/**
 * Transforms a backend Job to a normalized Job
 */
export function transformJob(job: BackendJob): NormalizedJob {
  return {
    id: job.id,
    application_id: job.application_id,
    company_id: job.company_id,
    title: job.title,
    description: normalizeNullString(job.description),
    requirements: normalizeNullString(job.requirements),
    location: normalizeNullString(job.location),
    created_at: normalizeNullTime(job.created_at),
    updated_at: normalizeNullTime(job.updated_at),
  }
}

/**
 * Transforms a backend Application to a normalized Application
 */
export function transformApplication(
  application: BackendApplication
): NormalizedApplication {
  return {
    id: application.id,
    contact_id: application.contact_id
      ? normalizeNullInt32(application.contact_id)
      : undefined,
    status: application.status,
    applied_date: application.applied_date,
    notes: normalizeNullString(application.notes),
    created_at: normalizeNullTime(application.created_at),
    updated_at: normalizeNullTime(application.updated_at),
  }
}

/**
 * Transforms a backend Contact to a normalized Contact
 */
export function transformContact(contact: BackendContact): NormalizedContact {
  return {
    id: contact.id,
    name: contact.name,
    email: normalizeNullString(contact.email),
    phone: normalizeNullString(contact.phone),
    linkedin: normalizeNullString(contact.linkedin),
    created_at: normalizeNullTime(contact.created_at),
    updated_at: normalizeNullTime(contact.updated_at),
  }
}

/**
 * Transforms an array of backend Companies to normalized Companies
 */
export function transformCompanies(companies: BackendCompany[] | null): NormalizedCompany[] {
  if (!companies) return []
  return companies.map(transformCompany)
}

/**
 * Transforms an array of backend Jobs to normalized Jobs
 */
export function transformJobs(jobs: BackendJob[] | null): NormalizedJob[] {
  if (!jobs) return []
  return jobs.map(transformJob)
}

/**
 * Transforms an array of backend Applications to normalized Applications
 */
export function transformApplications(
  applications: BackendApplication[] | null
): NormalizedApplication[] {
  if (!applications) return []
  return applications.map(transformApplication)
}

/**
 * Transforms an array of backend Contacts to normalized Contacts
 */
export function transformContacts(contacts: BackendContact[] | null): NormalizedContact[] {
  if (!contacts) return []
  return contacts.map(transformContact)
}

