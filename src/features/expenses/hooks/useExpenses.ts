import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  listExpenses,
  saveExpense,
  deleteExpense,
  syncPendingExpenses,
  refreshExpensesFromServer,
  type ExpenseFormValues,
} from '../api/expenses-api'

const EXPENSES_KEY = ['expenses'] as const

export function useExpenses() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const onOnline = async () => {
      await syncPendingExpenses()
      await refreshExpensesFromServer()
      queryClient.invalidateQueries({ queryKey: EXPENSES_KEY })
    }
    window.addEventListener('online', onOnline)
    onOnline()
    return () => window.removeEventListener('online', onOnline)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return useQuery({ queryKey: EXPENSES_KEY, queryFn: listExpenses })
}

export function useSaveExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ values, id }: { values: ExpenseFormValues; id?: string }) => saveExpense(values, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: EXPENSES_KEY }),
  })
}

export function useDeleteExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteExpense(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: EXPENSES_KEY }),
  })
}
