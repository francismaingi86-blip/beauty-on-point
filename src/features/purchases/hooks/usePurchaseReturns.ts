import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  listPurchaseReturns,
  createPurchaseReturn,
  syncPendingPurchaseReturns,
  refreshPurchaseReturnsFromServer,
  type CreatePurchaseReturnInput,
} from '../api/purchase-returns-api'

const PURCHASE_RETURNS_KEY = ['purchase-returns'] as const

export function usePurchaseReturns() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const refresh = async () => {
      await syncPendingPurchaseReturns()
      await refreshPurchaseReturnsFromServer()
      queryClient.invalidateQueries({ queryKey: PURCHASE_RETURNS_KEY })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
    }
    refresh()
    window.addEventListener('online', refresh)
    return () => window.removeEventListener('online', refresh)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return useQuery({ queryKey: PURCHASE_RETURNS_KEY, queryFn: listPurchaseReturns })
}

export function useCreatePurchaseReturn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreatePurchaseReturnInput) => createPurchaseReturn(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PURCHASE_RETURNS_KEY })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
    },
  })
}
