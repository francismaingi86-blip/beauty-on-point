import { useEffect } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import {
  listProducts,
  saveProduct,
  deleteProduct,
  syncPendingProducts,
  refreshProductsFromServer,
} from '../api/products-api'
import type { ProductFormValues } from '../types/product-schema'

const PRODUCTS_KEY = ['products'] as const

export function useProducts() {
  const queryClient = useQueryClient()

  // Pull fresh data from Supabase and flush any pending offline writes
  // whenever the app comes back online.
  useEffect(() => {
    const onOnline = async () => {
      await syncPendingProducts()
      await refreshProductsFromServer()
      queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY })
    }
    window.addEventListener('online', onOnline)
    onOnline()
    return () => window.removeEventListener('online', onOnline)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return useQuery({
    queryKey: PRODUCTS_KEY,
    queryFn: listProducts,
  })
}

export function useSaveProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ values, id }: { values: ProductFormValues; id?: string }) =>
      saveProduct(values, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY }),
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY }),
  })
}
