import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  completeSale,
  listSales,
  syncPendingSales,
  refreshSalesFromServer,
  holdSale,
  listHeldSales,
  deleteHeldSale,
} from '../api/sales-api'

const SALES_KEY = ['sales'] as const
const HELD_SALES_KEY = ['held-sales'] as const

export function useSales() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const refresh = async () => {
      await syncPendingSales()
      await refreshSalesFromServer()
      queryClient.invalidateQueries({ queryKey: SALES_KEY })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    }
    refresh()
    window.addEventListener('online', refresh)
    return () => window.removeEventListener('online', refresh)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return useQuery({ queryKey: SALES_KEY, queryFn: listSales })
}

export function useCompleteSale() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: completeSale,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SALES_KEY })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useHeldSales() {
  return useQuery({ queryKey: HELD_SALES_KEY, queryFn: listHeldSales })
}

export function useHoldSale() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: holdSale,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: HELD_SALES_KEY }),
  })
}

export function useDeleteHeldSale() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteHeldSale,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: HELD_SALES_KEY }),
  })
}
