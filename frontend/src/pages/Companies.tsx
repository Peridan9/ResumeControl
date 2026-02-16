import { useState } from 'react'
import { useCompanies } from '../hooks/useCompanies'
import { useToast } from '../hooks/useToast'
import type { Company, CreateCompanyRequest, UpdateCompanyRequest } from '../types'
import CompanyTable from '../components/companies/CompanyTable'
import CompanyForm from '../components/companies/CompanyForm'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import ErrorMessage from '../components/ui/ErrorMessage'
import EmptyState from '../components/ui/EmptyState'
import { BuildingOfficeIcon } from '@heroicons/react/24/outline'

export default function Companies() {
  const toast = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)

  // Use companies hook for data fetching
  const {
    companies,
    loading,
    error,
    saveCompany,
    deleteCompany,
    isSaving,
    isDeleting,
  } = useCompanies()

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

  const handleSubmit = async (data: CreateCompanyRequest | UpdateCompanyRequest) => {
    saveCompany(
      { company: editingCompany, formData: data },
      {
        onSuccess: () => {
          toast.showSuccess(editingCompany ? 'Company updated successfully!' : 'Company created successfully!')
          // Close modal after a short delay to show success message
          setTimeout(() => {
            handleCloseModal()
          }, 500)
        },
        onError: (err) => {
          toast.showError(err instanceof Error ? err.message : 'Failed to save company')
        },
      }
    )
  }

  const handleDelete = async (id: number) => {
    deleteCompany(id, {
      onSuccess: () => {
        toast.showSuccess('Company deleted successfully!')
      },
      onError: (err) => {
        toast.showError(err instanceof Error ? err.message : 'Failed to delete company')
      },
    })
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Companies</h1>
        <Button variant="primary" onClick={handleCreate}>
          Add Company
        </Button>
      </div>

      {/* Error Message - only for query errors, not mutations */}
      {error && (
        <div className="mb-4">
          <ErrorMessage message={error} />
        </div>
      )}

      {(!companies || companies.length === 0) && !loading ? (
        <EmptyState
          title="No companies yet!"
          description="Keep a list of companies you're interested in or have applied to."
          actionLabel="Add Company"
          onAction={handleCreate}
          icon={<BuildingOfficeIcon />}
        />
      ) : (
        /* Companies Table */
        <CompanyTable
          companies={companies}
          onEdit={handleEdit}
          onDelete={handleDelete}
          emptyMessage="No companies found."
          loading={loading}
          isDeleting={isDeleting}
        />
      )}

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
          isLoading={isSaving}
        />
      </Modal>
    </div>
  )
}
