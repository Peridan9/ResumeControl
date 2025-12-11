import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { companiesAPI } from '../services/api'
import type { Company, UpdateCompanyRequest } from '../types'
import { nullStringToString, nullTimeToString } from '../utils/helpers'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import CompanyForm from '../components/companies/CompanyForm'

export default function CompanyDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)

  const companyId = id ? parseInt(id, 10) : null

  // Fetch company detail
  const {
    data: company,
    isLoading: companyLoading,
    error: companyError,
  } = useQuery<Company>({
    queryKey: ['company', companyId],
    queryFn: () => {
      if (!companyId) throw new Error('Invalid company ID')
      return companiesAPI.getById(companyId)
    },
    enabled: !!companyId,
  })

  const loading = companyLoading
  const error = companyError
    ? (companyError instanceof Error ? companyError.message : 'Failed to fetch company details')
    : !companyId
    ? 'Invalid company ID'
    : null

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch {
      return 'Invalid date'
    }
  }

  const formatDateTime = (dateString: string | null): string => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return 'Invalid date'
    }
  }

  const handleEdit = () => {
    setIsEditModalOpen(true)
    setSuccessMessage(null)
    setMutationError(null)
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
  }

  // Mutation for updating company
  const updateCompanyMutation = useMutation({
    mutationFn: async (formData: UpdateCompanyRequest) => {
      if (!company) throw new Error('Missing company data')
      return await companiesAPI.update(company.id, formData)
    },
    onSuccess: () => {
      // Invalidate and refetch company query
      queryClient.invalidateQueries({ queryKey: ['company', companyId] })
      queryClient.invalidateQueries({ queryKey: ['companies'] })

      setSuccessMessage('Company updated successfully!')
      setMutationError(null)

      // Close modal after a short delay to show success message
      setTimeout(() => {
        handleCloseEditModal()
        setSuccessMessage(null)
      }, 500)
    },
    onError: (err) => {
      setMutationError(err instanceof Error ? err.message : 'Failed to update company')
    },
  })

  // Mutation for deleting company
  const deleteCompanyMutation = useMutation({
    mutationFn: async () => {
      if (!company) throw new Error('No company to delete')
      return await companiesAPI.delete(company.id)
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['applications'] })

      // Navigate back to companies list
      navigate('/companies')
    },
    onError: (err) => {
      setMutationError(err instanceof Error ? err.message : 'Failed to delete company')
      setIsDeleteDialogOpen(false)
    },
  })

  const handleUpdate = async (formData: UpdateCompanyRequest) => {
    updateCompanyMutation.mutate(formData)
  }

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    deleteCompanyMutation.mutate()
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Loading company details...</p>
      </div>
    )
  }

  if (error || !company) {
    return (
      <div>
        <Button variant="secondary" onClick={() => navigate('/companies')} className="mb-4">
          ← Back to Companies
        </Button>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error || 'Company not found'}
        </div>
      </div>
    )
  }

  const companyWebsite = nullStringToString(company.website)
  const createdAt = nullTimeToString(company.created_at)
  const updatedAt = nullTimeToString(company.updated_at)

  return (
    <div>
      {/* Back Button */}
      <Button variant="secondary" onClick={() => navigate('/companies')} className="mb-6">
        ← Back to Companies
      </Button>

      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Company Details</h1>
        <div className="flex space-x-3">
          <Button variant="primary" onClick={handleEdit}>
            Edit Company
          </Button>
          <Button variant="danger" onClick={handleDeleteClick}>
            Delete Company
          </Button>
        </div>
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

      <div className="space-y-6">
        {/* Company Information Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Company Information</h2>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-500">Company Name</span>
              <p className="text-lg text-gray-900">{company.name}</p>
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
            {createdAt && (
              <div>
                <span className="text-sm font-medium text-gray-500">Created</span>
                <p className="text-gray-900">{formatDateTime(createdAt)}</p>
              </div>
            )}
            {updatedAt && (
              <div>
                <span className="text-sm font-medium text-gray-500">Last Updated</span>
                <p className="text-gray-900">{formatDateTime(updatedAt)}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Company Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        title="Edit Company"
      >
        <CompanyForm
          company={company}
          onSubmit={handleUpdate}
          onCancel={handleCloseEditModal}
          isLoading={updateCompanyMutation.isPending}
        />
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Company"
        message={`Are you sure you want to delete "${company.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteCompanyMutation.isPending}
      />
    </div>
  )
}

