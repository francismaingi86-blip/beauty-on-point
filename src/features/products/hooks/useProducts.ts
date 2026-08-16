import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { listProducts, saveProduct, deleteProduct } from '../api/products-api'
import type { ProductFormValues } from '../types/product-schema'

const PRODUCTS_KEY = ['products'] as const

export function useProducts() {
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
