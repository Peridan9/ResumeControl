import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Custom hook for managing form drafts in sessionStorage
 * Automatically saves form data to sessionStorage with debouncing
 * @param storageKey - The key to use in sessionStorage
 * @param initialValue - The initial form values
 * @param isEditMode - Whether the form is in edit mode (draft disabled in edit mode)
 * @param debounceDelay - Delay in milliseconds for auto-save (default: 300)
 * @returns Object with form values, setters, and utility functions
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useFormDraft<T extends Record<string, any>>(
  storageKey: string,
  initialValue: T,
  isEditMode: boolean = false,
  debounceDelay: number = 300
) {
  // Load draft from sessionStorage on mount (only for create mode)
  const loadDraft = (): Partial<T> | null => {
    if (isEditMode) return null // Don't load draft in edit mode
    try {
      const saved = sessionStorage.getItem(storageKey)
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (error) {
      console.error(`Failed to load draft from sessionStorage:`, error)
    }
    return null
  }

  // Save draft to sessionStorage (only for create mode)
  // Wrapped in useCallback to ensure stable reference for useEffect dependency
  const saveDraft = useCallback((data: T) => {
    if (isEditMode) return // Don't save draft in edit mode
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(data))
    } catch (error) {
      console.error(`Failed to save draft to sessionStorage:`, error)
    }
  }, [storageKey, isEditMode])

  // Clear draft from sessionStorage
  const clearDraft = useCallback(() => {
    try {
      sessionStorage.removeItem(storageKey)
    } catch (error) {
      console.error(`Failed to clear draft from sessionStorage:`, error)
    }
  }, [storageKey])

  // Initialize form values: use draft if available, otherwise use initial value
  const draft = loadDraft()
  const [formData, setFormData] = useState<T>(() => {
    if (draft) {
      return { ...initialValue, ...draft }
    }
    return initialValue
  })

  // Store initialValue in a ref to ensure resetForm always uses the latest value
  const initialValueRef = useRef(initialValue)
  useEffect(() => {
    initialValueRef.current = initialValue
  }, [initialValue])

  // Debounce timer ref
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-save to sessionStorage on form data changes (debounced)
  useEffect(() => {
    // Clear existing timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }

    // Set new timer to save after delay of no changes
    saveTimerRef.current = setTimeout(() => {
      saveDraft(formData)
    }, debounceDelay)

    // Cleanup timer on unmount
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
    }
  }, [formData, saveDraft, debounceDelay])

  // Update a specific field in the form data
  const updateField = <K extends keyof T>(field: K, value: T[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Reset form to initial value and clear draft
  // Uses ref to ensure it always uses the latest initialValue
  const resetForm = useCallback(() => {
    setFormData(initialValueRef.current)
    clearDraft()
  }, [clearDraft])

  return {
    formData,
    setFormData,
    updateField,
    clearDraft,
    resetForm,
  }
}

