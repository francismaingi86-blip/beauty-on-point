import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  completeSale,
  listSales,
  syncPendingSales,
  holdSale,
  listHeldSales,
  deleteHeldSale,
} from '../api/sales-api'

const SALES_KEY = ['sales'] as const
const HELD_SALES_KEY = ['held-sales'] as const

export function useSales() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const onOnline = async () => {
      await syncPendingSales()
      queryClient.invalidateQueries({ queryKey: SALES_KEY })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    }
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [queryClient])

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
