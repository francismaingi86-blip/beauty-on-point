import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  listSuppliers,
  saveSupplier,
  deleteSupplier,
  type SupplierFormValues,
} from '../api/suppliers-api'

const SUPPLIERS_KEY = ['suppliers'] as const

export function useSuppliers() {
  return useQuery({ queryKey: SUPPLIERS_KEY, queryFn: listSuppliers })
}

export function useSaveSupplier() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ values, id }: { values: SupplierFormValues; id?: string }) => saveSupplier(values, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SUPPLIERS_KEY }),
  })
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteSupplier(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SUPPLIERS_KEY }),
  })
}
