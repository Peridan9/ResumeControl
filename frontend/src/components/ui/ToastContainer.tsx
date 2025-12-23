import { useToastContext } from '../../contexts/ToastContext'
import Toast from './Toast'

/**
 * Container component for displaying toast notifications
 * Renders all active toasts in a fixed position
 */
export default function ToastContainer() {
  const { toasts, removeToast } = useToastContext()

  if (toasts.length === 0) {
    return null
  }

  return (
    <div
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast toast={toast} onDismiss={removeToast} />
        </div>
      ))}
    </div>
  )
}



