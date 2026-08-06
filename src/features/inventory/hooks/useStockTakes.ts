import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  listStockTakes,
  submitStockTake,
  syncPendingStockTakes,
  refreshStockTakesFromServer,
  type SubmitStockTakeInput,
} from '../api/stock-takes-api'

const STOCK_TAKES_KEY = ['stock-takes'] as const

export function useStockTakes() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const refresh = async () => {
      await syncPendingStockTakes()
      await refreshStockTakesFromServer()
      queryClient.invalidateQueries({ queryKey: STOCK_TAKES_KEY })
    }
    refresh()
    window.addEventListener('online', refresh)
    return () => window.removeEventListener('online', refresh)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return useQuery({ queryKey: STOCK_TAKES_KEY, queryFn: listStockTakes })
}

export function useSubmitStockTake() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SubmitStockTakeInput) => submitStockTake(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STOCK_TAKES_KEY })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
