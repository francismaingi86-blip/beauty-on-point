import { useMutation, useQueryClient } from '@tanstack/react-query'
import { bulkCreateProducts } from '../api/products-api'
import type { ImportRowToAdd } from '../lib/analyzeImport'

export function useBulkCreateProducts() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (rows: ImportRowToAdd[]) => bulkCreateProducts(rows),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  })
}
