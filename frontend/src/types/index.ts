// Type definitions - normalized types for frontend use
// Backend null types are normalized at the API boundary (see services/transformers.ts)

// Re-export normalized types from transformers
export type {
  NormalizedCompany as Company,
  NormalizedJob as Job,
  NormalizedApplication as Application,
  NormalizedContact as Contact,
} from '../services/transformers'

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

