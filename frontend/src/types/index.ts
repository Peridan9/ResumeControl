// Type definitions matching backend models
// Note: Backend returns sql.NullString and sql.NullTime as objects
// These types handle both formats for compatibility

type NullString = string | null | { String: string; Valid: boolean }
type NullTime = string | { Time: string; Valid: boolean }
type NullInt32 = number | null | { Int32: number; Valid: boolean }

export interface Company {
  id: number
  name: string
  website: NullString
  created_at: NullTime
  updated_at: NullTime
}

export interface Job {
  id: number
  application_id: number
  company_id: number
  title: string
  description: NullString
  requirements: NullString
  location: NullString
  created_at: NullTime
  updated_at: NullTime
}

export interface Application {
  id: number
  contact_id?: NullInt32
  status: string
  applied_date: string
  notes: NullString
  created_at: NullTime
  updated_at: NullTime
}

export interface Contact {
  id: number
  name: string
  email: NullString
  phone: NullString
  linkedin: NullString
  created_at: NullTime
  updated_at: NullTime
}

// Request/Response types
export interface CreateCompanyRequest {
  name: string
  website?: string
}

export interface UpdateCompanyRequest {
  name: string
  website?: string
}

export interface CreateJobRequest {
  application_id: number
  company_id: number
  title: string
  description?: string
  requirements?: string
  location?: string
}

export interface UpdateJobRequest {
  company_id?: number
  title: string
  description?: string
  requirements?: string
  location?: string
}

export interface CreateApplicationRequest {
  status: string
  applied_date: string
  contact_id?: number | null
  notes?: string
}

export interface UpdateApplicationRequest {
  status: string
  applied_date: string
  contact_id?: number | null
  notes?: string
}

export interface CreateContactRequest {
  name: string
  email?: string
  phone?: string
  linkedin?: string
}

export interface UpdateContactRequest {
  name: string
  email?: string
  phone?: string
  linkedin?: string
}

