import { useState, useEffect } from 'react'
import { companiesAPI } from '../services/api'
import type { Company, CreateCompanyRequest, UpdateCompanyRequest } from '../types'
import CompanyTable from '../components/companies/CompanyTable'
import CompanyForm from '../components/companies/CompanyForm'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'

export default function Companies() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Fetch companies on component mount
  useEffect(() => {
    fetchCompanies()
  }, [])

  const fetchCompanies = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await companiesAPI.getAll()
      setCompanies(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch companies')
    } finally {
      setLoading(false)
    }
  }

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
    try {
      setIsSubmitting(true)
      setError(null)
      setSuccessMessage(null)

      if (editingCompany) {
        // Update existing company
        await companiesAPI.update(editingCompany.id, data as UpdateCompanyRequest)
        setSuccessMessage('Company updated successfully!')
      } else {
        // Create new company
        await companiesAPI.create(data as CreateCompanyRequest)
        setSuccessMessage('Company created successfully!')
      }

      // Refresh the list
      await fetchCompanies()
      
      // Close modal after a short delay to show success message
      setTimeout(() => {
        handleCloseModal()
        setSuccessMessage(null)
      }, 500)
    } catch (err) {
      throw err // Let the form handle the error
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      setError(null)
      await companiesAPI.delete(id)
      setSuccessMessage('Company deleted successfully!')
      
      // Refresh the list
      await fetchCompanies()
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null)
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete company')
      setTimeout(() => {
        setError(null)
      }, 5000)
    }
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
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
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
          isLoading={isSubmitting}
        />
      </Modal>
    </div>
  )
}
