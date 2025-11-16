// Type definitions matching backend models
// Note: Backend returns sql.NullString and sql.NullTime as objects
// These types handle both formats for compatibility

type NullString = string | null | { String: string; Valid: boolean }
type NullTime = string | { Time: string; Valid: boolean }

export interface Company {
  id: number
  name: string
  website: NullString
  created_at: NullTime
  updated_at: NullTime
}

export interface Job {
  id: number
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
  job_id: number
  status: string
  applied_date: string
  notes: NullString
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
  job_id: number
  status: string
  applied_date: string
  notes?: string
}

export interface UpdateApplicationRequest {
  job_id?: number
  status: string
  applied_date: string
  notes?: string
}

