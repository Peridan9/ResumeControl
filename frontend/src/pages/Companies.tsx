import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { companiesAPI } from '../services/api'
import type { Company, CreateCompanyRequest, UpdateCompanyRequest } from '../types'
import CompanyTable from '../components/companies/CompanyTable'
import CompanyForm from '../components/companies/CompanyForm'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'

export default function Companies() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)

  // Fetch companies using React Query
  const {
    data: companies = [],
    isLoading: loading,
    error: companiesError,
  } = useQuery<Company[]>({
    queryKey: ['companies'],
    queryFn: () => companiesAPI.getAll(),
  })

  const error = companiesError ? (companiesError instanceof Error ? companiesError.message : 'Failed to fetch companies') : null

  const handleCreate = () => {
    setEditingCompany(null)
    setIsModalOpen(true)
  }

  const handleEdit = (company: Company) => {
    setEditingCompany(company)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingCompany(null)
  }

  // Mutation for creating/updating company
  const saveCompanyMutation = useMutation({
    mutationFn: async (data: { company: Company | null; formData: CreateCompanyRequest | UpdateCompanyRequest }) => {
      if (data.company) {
        // Update existing company
        return await companiesAPI.update(data.company.id, data.formData as UpdateCompanyRequest)
      } else {
        // Create new company
        return await companiesAPI.create(data.formData as CreateCompanyRequest)
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate and refetch companies
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      
      setSuccessMessage(variables.company ? 'Company updated successfully!' : 'Company created successfully!')
      setMutationError(null)
      
      // Close modal after a short delay to show success message
      setTimeout(() => {
        handleCloseModal()
        setSuccessMessage(null)
      }, 500)
    },
    onError: (err) => {
      setMutationError(err instanceof Error ? err.message : 'Failed to save company')
    },
  })

  // Mutation for deleting company
  const deleteCompanyMutation = useMutation({
    mutationFn: async (id: number) => {
      return await companiesAPI.delete(id)
    },
    onSuccess: () => {
      // Invalidate and refetch companies
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      
      setSuccessMessage('Company deleted successfully!')
      setMutationError(null)
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null)
      }, 3000)
    },
    onError: (err) => {
      setMutationError(err instanceof Error ? err.message : 'Failed to delete company')
      setTimeout(() => {
        setMutationError(null)
      }, 5000)
    },
  })

  const handleSubmit = async (data: CreateCompanyRequest | UpdateCompanyRequest) => {
    saveCompanyMutation.mutate({ company: editingCompany, formData: data })
  }

  const handleDelete = async (id: number) => {
    deleteCompanyMutation.mutate(id)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Companies</h1>
        <Button variant="primary" onClick={handleCreate}>
          Add Company
        </Button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {(error || mutationError) && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error || mutationError}
        </div>
      )}

      {/* Companies Table */}
      <CompanyTable
        companies={companies}
        onEdit={handleEdit}
        onDelete={handleDelete}
        emptyMessage={
          companies.length === 0 && !loading
            ? 'No companies found. Create your first company to get started.'
            : 'No companies found.'
        }
        loading={loading}
      />

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingCompany ? 'Edit Company' : 'Create New Company'}
      >
        <CompanyForm
          company={editingCompany}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
          isLoading={saveCompanyMutation.isPending}
        />
      </Modal>
    </div>
  )
}
