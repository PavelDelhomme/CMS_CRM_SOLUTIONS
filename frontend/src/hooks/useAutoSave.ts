import { useEffect, useRef, useState } from 'react'

interface UseAutoSaveOptions {
  data: any
  onSave: (data: any) => Promise<void>
  debounceMs?: number
  enabled?: boolean
}

export function useAutoSave({ data, onSave, debounceMs = 2000, enabled = true }: UseAutoSaveOptions) {
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const hasUnsavedChanges = useRef(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!enabled || !data) return

    hasUnsavedChanges.current = true

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout
    timeoutRef.current = setTimeout(async () => {
      setIsSaving(true)
      hasUnsavedChanges.current = false
      
      try {
        await onSave(data)
        setLastSaved(new Date())
      } catch (error) {
        console.error('Erreur sauvegarde automatique:', error)
        hasUnsavedChanges.current = true
      } finally {
        setIsSaving(false)
      }
    }, debounceMs)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [data, enabled, debounceMs, onSave])

  return { isSaving, lastSaved, hasUnsavedChanges: hasUnsavedChanges.current }
}

