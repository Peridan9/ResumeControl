// API client for backend communication

import type {
  Company,
  Job,
  Application,
  Contact,
  CreateCompanyRequest,
  UpdateCompanyRequest,
  CreateJobRequest,
  UpdateJobRequest,
  CreateApplicationRequest,
  UpdateApplicationRequest,
  CreateContactRequest,
  UpdateContactRequest,
} from '../types'

const API_BASE_URL = '/api'

// Generic fetch wrapper with error handling
async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: 'An error occurred',
      details: response.statusText,
    }))
    throw new Error(error.error || error.details || 'Request failed')
  }

  return response.json()
}

// Companies API
export const companiesAPI = {
  getAll: () => fetchAPI<Company[]>('/companies'),
  getById: (id: number) => fetchAPI<Company>(`/companies/${id}`),
  create: (data: CreateCompanyRequest) =>
    fetchAPI<Company>('/companies', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: UpdateCompanyRequest) =>
    fetchAPI<Company>(`/companies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    fetchAPI<void>(`/companies/${id}`, {
      method: 'DELETE',
    }),
  getJobs: (companyId: number) =>
    fetchAPI<Job[]>(`/companies/${companyId}/jobs`),
}

// Jobs API
export const jobsAPI = {
  getAll: () => fetchAPI<Job[]>('/jobs'),
  getById: (id: number) => fetchAPI<Job>(`/jobs/${id}`),
  create: (data: CreateJobRequest) =>
    fetchAPI<Job>('/jobs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: UpdateJobRequest) =>
    fetchAPI<Job>(`/jobs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    fetchAPI<void>(`/jobs/${id}`, {
      method: 'DELETE',
    }),
}

// Applications API
export const applicationsAPI = {
  getAll: (status?: string) => {
    const url = status ? `/applications?status=${status}` : '/applications'
    return fetchAPI<Application[]>(url)
  },
  getById: (id: number) => fetchAPI<Application>(`/applications/${id}`),
  create: (data: CreateApplicationRequest) =>
    fetchAPI<Application>('/applications', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: UpdateApplicationRequest) =>
    fetchAPI<Application>(`/applications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    fetchAPI<void>(`/applications/${id}`, {
      method: 'DELETE',
    }),
  getJobByApplicationId: (applicationId: number) =>
    fetchAPI<Job>(`/applications/${applicationId}/job`),
}

// Contacts API
export const contactsAPI = {
  getAll: () => fetchAPI<Contact[]>('/contacts'),
  getById: (id: number) => fetchAPI<Contact>(`/contacts/${id}`),
  create: (data: CreateContactRequest) =>
    fetchAPI<Contact>('/contacts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: UpdateContactRequest) =>
    fetchAPI<Contact>(`/contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    fetchAPI<void>(`/contacts/${id}`, {
      method: 'DELETE',
    }),
}

