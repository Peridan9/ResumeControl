// Type definitions matching backend models

export interface Company {
  id: number
  name: string
  website: string | null
  created_at: string
  updated_at: string
}

export interface Job {
  id: number
  company_id: number
  title: string
  description: string | null
  requirements: string | null
  location: string | null
  created_at: string
  updated_at: string
}

export interface Application {
  id: number
  job_id: number
  status: string
  applied_date: string
  notes: string | null
  created_at: string
  updated_at: string
}

// Request/Response types
export interface CreateCompanyRequest {
  name: string
  website?: string
}

export interface UpdateCompanyRequest {
  name?: string
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
  title?: string
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
  status?: string
  applied_date?: string
  notes?: string
}

