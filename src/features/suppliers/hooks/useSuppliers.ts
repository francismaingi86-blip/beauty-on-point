import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  listSuppliers,
  saveSupplier,
  deleteSupplier,
  syncPendingSuppliers,
  refreshSuppliersFromServer,
  type SupplierFormValues,
} from '../api/suppliers-api'

const SUPPLIERS_KEY = ['suppliers'] as const

export function useSuppliers() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const onOnline = async () => {
      await syncPendingSuppliers()
      await refreshSuppliersFromServer()
      queryClient.invalidateQueries({ queryKey: SUPPLIERS_KEY })
    }
    window.addEventListener('online', onOnline)
    onOnline()
    return () => window.removeEventListener('online', onOnline)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
