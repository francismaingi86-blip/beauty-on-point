import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  listCreditNotes,
  createCreditNote,
  syncPendingCreditNotes,
  refreshCreditNotesFromServer,
  type CreateCreditNoteInput,
} from '../api/credit-notes-api'

const CREDIT_NOTES_KEY = ['credit-notes'] as const

export function useCreditNotes() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const refresh = async () => {
      await syncPendingCreditNotes()
      await refreshCreditNotesFromServer()
      queryClient.invalidateQueries({ queryKey: CREDIT_NOTES_KEY })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    }
    refresh()
    window.addEventListener('online', refresh)
    return () => window.removeEventListener('online', refresh)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return useQuery({ queryKey: CREDIT_NOTES_KEY, queryFn: listCreditNotes })
}

export function useCreateCreditNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateCreditNoteInput) => createCreditNote(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CREDIT_NOTES_KEY })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}
