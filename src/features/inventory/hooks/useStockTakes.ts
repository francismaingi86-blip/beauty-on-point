import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listStockTakes, submitStockTake, type SubmitStockTakeInput } from '../api/stock-takes-api'

const STOCK_TAKES_KEY = ['stock-takes'] as const

export function useStockTakes() {
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
