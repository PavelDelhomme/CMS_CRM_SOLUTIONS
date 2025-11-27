import { useState, useCallback, useRef } from 'react'

interface HistoryState<T> {
  past: T[]
  present: T
  future: T[]
}

export function useHistory<T>(initialState: T, maxHistorySize: number = 50) {
  const [state, setState] = useState<HistoryState<T>>({
    past: [],
    present: initialState,
    future: [],
  })

  const canUndo = state.past.length > 0
  const canRedo = state.future.length > 0

  const set = useCallback((newState: T, addToHistory: boolean = true) => {
    if (addToHistory) {
      setState((current) => {
        const newPast = [...current.past, current.present]
        // Limiter la taille de l'historique
        const trimmedPast = newPast.slice(-maxHistorySize)
        
        return {
          past: trimmedPast,
          present: newState,
          future: [], // Effacer le futur quand on fait une nouvelle action
        }
      })
    } else {
      setState((current) => ({
        ...current,
        present: newState,
      }))
    }
  }, [maxHistorySize])

  const undo = useCallback(() => {
    setState((current) => {
      if (current.past.length === 0) {
        return current
      }

      const previous = current.past[current.past.length - 1]
      const newPast = current.past.slice(0, -1)

      return {
        past: newPast,
        present: previous,
        future: [current.present, ...current.future],
      }
    })
  }, [])

  const redo = useCallback(() => {
    setState((current) => {
      if (current.future.length === 0) {
        return current
      }

      const next = current.future[0]
      const newFuture = current.future.slice(1)

      return {
        past: [...current.past, current.present],
        present: next,
        future: newFuture,
      }
    })
  }, [])

  const reset = useCallback((newState: T) => {
    setState({
      past: [],
      present: newState,
      future: [],
    })
  }, [])

  return {
    state: state.present,
    set,
    undo,
    redo,
    canUndo,
    canRedo,
    reset,
  }
}

