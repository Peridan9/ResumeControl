import Button from '../ui/Button'

interface ApplicationDetailHeaderProps {
  onEdit: () => void
  onDelete: () => void
  onBack: () => void
}

/**
 * Header component for ApplicationDetail page
 * Displays title and action buttons (Edit, Delete, Back)
 */
export default function ApplicationDetailHeader({
  onEdit,
  onDelete,
  onBack,
}: ApplicationDetailHeaderProps) {
  return (
    <>
      {/* Back Button */}
      <Button variant="secondary" onClick={onBack} className="mb-6">
        ← Back to Applications
      </Button>

      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Application Details</h1>
        <div className="flex space-x-3">
          <Button variant="primary" onClick={onEdit}>
            Edit Application
          </Button>
          <Button variant="danger" onClick={onDelete}>
            Delete Application
          </Button>
        </div>
      </div>
    </>
  )
}






