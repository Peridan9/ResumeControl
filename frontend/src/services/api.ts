// API client for backend communication
// All responses are normalized at the API boundary

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
import { fetchAPI } from './fetch'
import {
  transformCompany,
  transformCompanies,
  transformJob,
  transformJobs,
  transformApplication,
  transformApplications,
  transformContact,
  transformContacts,
  type BackendCompany,
  type BackendJob,
  type BackendApplication,
  type BackendContact,
} from './transformers'

// Companies API
export const companiesAPI = {
  getAll: async (): Promise<Company[]> => {
    const companies = await fetchAPI<BackendCompany[]>('/companies')
    return transformCompanies(companies)
  },
  getById: async (id: number): Promise<Company> => {
    const company = await fetchAPI<BackendCompany>(`/companies/${id}`)
    return transformCompany(company)
  },
  create: async (data: CreateCompanyRequest): Promise<Company> => {
    const company = await fetchAPI<BackendCompany>('/companies', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return transformCompany(company)
  },
  update: async (id: number, data: UpdateCompanyRequest): Promise<Company> => {
    const company = await fetchAPI<BackendCompany>(`/companies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    return transformCompany(company)
  },
  delete: (id: number) =>
    fetchAPI<void>(`/companies/${id}`, {
      method: 'DELETE',
    }),
  getJobs: async (companyId: number): Promise<Job[]> => {
    const jobs = await fetchAPI<BackendJob[]>(`/companies/${companyId}/jobs`)
    return transformJobs(jobs)
  },
}

// Jobs API
export const jobsAPI = {
  getAll: async (): Promise<Job[]> => {
    const jobs = await fetchAPI<BackendJob[]>('/jobs')
    return transformJobs(jobs)
  },
  getById: async (id: number): Promise<Job> => {
    const job = await fetchAPI<BackendJob>(`/jobs/${id}`)
    return transformJob(job)
  },
  create: async (data: CreateJobRequest): Promise<Job> => {
    const job = await fetchAPI<BackendJob>('/jobs', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return transformJob(job)
  },
  update: async (id: number, data: UpdateJobRequest): Promise<Job> => {
    const job = await fetchAPI<BackendJob>(`/jobs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    return transformJob(job)
  },
  delete: (id: number) =>
    fetchAPI<void>(`/jobs/${id}`, {
      method: 'DELETE',
    }),
}

// Applications API
export const applicationsAPI = {
  getAll: async (status?: string): Promise<Application[]> => {
    const url = status ? `/applications?status=${status}` : '/applications'
    const applications = await fetchAPI<BackendApplication[]>(url)
    return transformApplications(applications)
  },
  getById: async (id: number): Promise<Application> => {
    const application = await fetchAPI<BackendApplication>(`/applications/${id}`)
    return transformApplication(application)
  },
  create: async (data: CreateApplicationRequest): Promise<Application> => {
    const application = await fetchAPI<BackendApplication>('/applications', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return transformApplication(application)
  },
  update: async (id: number, data: UpdateApplicationRequest): Promise<Application> => {
    const application = await fetchAPI<BackendApplication>(`/applications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    return transformApplication(application)
  },
  delete: (id: number) =>
    fetchAPI<void>(`/applications/${id}`, {
      method: 'DELETE',
    }),
  getJobByApplicationId: async (applicationId: number): Promise<Job> => {
    const job = await fetchAPI<BackendJob>(`/applications/${applicationId}/job`)
    return transformJob(job)
  },
}

// Contacts API
export const contactsAPI = {
  getAll: async (): Promise<Contact[]> => {
    const contacts = await fetchAPI<BackendContact[]>('/contacts')
    return transformContacts(contacts)
  },
  getById: async (id: number): Promise<Contact> => {
    const contact = await fetchAPI<BackendContact>(`/contacts/${id}`)
    return transformContact(contact)
  },
  create: async (data: CreateContactRequest): Promise<Contact> => {
    const contact = await fetchAPI<BackendContact>('/contacts', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return transformContact(contact)
  },
  update: async (id: number, data: UpdateContactRequest): Promise<Contact> => {
    const contact = await fetchAPI<BackendContact>(`/contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    return transformContact(contact)
  },
  delete: (id: number) =>
    fetchAPI<void>(`/contacts/${id}`, {
      method: 'DELETE',
    }),
}

