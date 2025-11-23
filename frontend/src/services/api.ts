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
import { tokenStorage, authAPI } from './auth'

const API_BASE_URL = '/api'

// Track if we're currently refreshing to prevent multiple simultaneous refresh attempts
let isRefreshing = false
let refreshPromise: Promise<string | null> | null = null

// Function to refresh token and return new access token
async function refreshAccessToken(): Promise<string | null> {
  // If already refreshing, return the existing promise
  if (isRefreshing && refreshPromise) {
    return refreshPromise
  }

  isRefreshing = true
  refreshPromise = (async () => {
    try {
      const refreshToken = tokenStorage.getRefreshToken()
      if (!refreshToken) {
        throw new Error('No refresh token available')
      }

      const response = await authAPI.refreshToken(refreshToken)
      return response.access_token
    } catch (error) {
      // Refresh failed, clear tokens
      tokenStorage.clearTokens()
      // Redirect to login will be handled by ProtectedRoute
      throw error
    } finally {
      isRefreshing = false
      refreshPromise = null
    }
  })()

  return refreshPromise
}

// Generic fetch wrapper with error handling and automatic token refresh
async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit,
  retryOn401: boolean = true
): Promise<T> {
  // Get access token
  let accessToken = tokenStorage.getAccessToken()

  // Build headers with authorization if token exists
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options?.headers,
  }

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  // Make request
  let response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  // Handle 401 Unauthorized - try to refresh token
  if (response.status === 401 && retryOn401 && accessToken) {
    try {
      // Attempt to refresh token
      const newAccessToken = await refreshAccessToken()
      
      if (newAccessToken) {
        // Retry original request with new token
        headers['Authorization'] = `Bearer ${newAccessToken}`
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers,
        })
      } else {
        // Refresh failed, throw error
        throw new Error('Token refresh failed')
      }
    } catch (error) {
      // Refresh failed, clear tokens and throw error
      tokenStorage.clearTokens()
      throw new Error('Authentication failed. Please login again.')
    }
  }

  // Handle non-OK responses
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

