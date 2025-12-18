import { useState } from 'react'
import { useCompanies } from '../hooks/useCompanies'
import type { Company, CreateCompanyRequest, UpdateCompanyRequest } from '../types'
import CompanyTable from '../components/companies/CompanyTable'
import CompanyForm from '../components/companies/CompanyForm'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'

export default function Companies() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)

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
          setSuccessMessage(editingCompany ? 'Company updated successfully!' : 'Company created successfully!')
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
      }
    )
  }

  const handleDelete = async (id: number) => {
    deleteCompany(id, {
      onSuccess: () => {
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
        isDeleting={isDeleting}
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
          isLoading={isSaving}
        />
      </Modal>
    </div>
  )
}
