import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  listPurchases,
  savePurchase,
  markPurchaseOrdered,
  markPurchaseReceived,
  deletePurchase,
  syncPendingPurchases,
  type PurchaseFormValues,
} from '../api/purchases-api'

const PURCHASES_KEY = ['purchases'] as const

export function usePurchases() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const onOnline = async () => {
      await syncPendingPurchases()
      queryClient.invalidateQueries({ queryKey: PURCHASES_KEY })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    }
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [queryClient])

  return useQuery({ queryKey: PURCHASES_KEY, queryFn: listPurchases })
}

export function useSavePurchase() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ values, id }: { values: PurchaseFormValues; id?: string }) => savePurchase(values, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PURCHASES_KEY }),
  })
}

export function useMarkPurchaseOrdered() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => markPurchaseOrdered(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PURCHASES_KEY }),
  })
}

export function useMarkPurchaseReceived() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => markPurchaseReceived(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PURCHASES_KEY })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useDeletePurchase() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deletePurchase(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PURCHASES_KEY }),
  })
}
